import { Request, Response } from "express";
import prisma from "../libs/prisma";
import { calculateElo } from "../utils/elo";

const isValidId = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

export const recordMatchResult = async (req: Request, res: Response) => {
  const { player1Id, player2Id, result } = req.body;

  if (!isValidId(player1Id) || !isValidId(player2Id) || !result) {
    return res.status(400).json({ error: "Invalid input" });
  }

  if (player1Id === player2Id) {
    return res.status(400).json({ error: "Players must be different" });
  }

  if (!["1", "2", "draw"].includes(result)) {
    return res.status(400).json({ error: "Invalid result" });
  }

  try {
    const [player1, player2] = await Promise.all([
      prisma.user.findUnique({
        where: { id: player1Id },
      }) as any,
      prisma.user.findUnique({
        where: { id: player2Id },
      }) as any,
    ]);

    if (!player1 || !player2) {
      return res.status(404).json({ error: "Player not found" });
    }

    const isDraw = result === "draw";
    const player1Won = result === "1";

    const actualScore1 = isDraw ? 0.5 : player1Won ? 1 : 0;
    const actualScore2 = isDraw ? 0.5 : player1Won ? 0 : 1;

    const newRating1 = calculateElo(player1.eloRating || 1200, player2.eloRating || 1200, actualScore1, player1.gamesPlayed || 0);
    const newRating2 = calculateElo(player2.eloRating || 1200, player1.eloRating || 1200, actualScore2, player2.gamesPlayed || 0);

    const eloChange1 = newRating1 - (player1.eloRating || 1200);
    const eloChange2 = newRating2 - (player2.eloRating || 1200);

    const transaction = await (prisma.$transaction(async (tx: any) => {
      await Promise.all([
        tx.user.update({
          where: { id: player1Id },
          data: {
            eloRating: newRating1,
            gamesPlayed: { increment: 1 },
          },
        }),
        tx.user.update({
          where: { id: player2Id },
          data: {
            eloRating: newRating2,
            gamesPlayed: { increment: 1 },
          },
        }),
      ]);

      return await tx.match.create({
        data: {
          player1Id,
          player2Id,
          isDraw,
          eloChangePlayer1: eloChange1,
          eloChangePlayer2: eloChange2,
        },
      });
    })) as any;

    res.json({
      match: transaction,
      player1: { oldElo: player1.eloRating || 1200, newElo: newRating1, eloChange: eloChange1 },
      player2: { oldElo: player2.eloRating || 1200, newElo: newRating2, eloChange: eloChange2 },
    });
  } catch (error) {
    console.error("Error recording match:", error);
    res.status(500).json({ error: "Failed to record match" });
  }
};

export const getLeaderboard = async (req: Request, res: Response) => {
  try {
    const players = (await (prisma.user.findMany({
      orderBy: { eloRating: "desc" } as any,
      take: 100,
    }) as any)) as any[];

    const leaderboard = players.map((player, index) => {
      return {
        rank: index + 1,
        id: player.id,
        name: player.name,
        eloRating: player.eloRating || 1200,
        gamesPlayed: player.gamesPlayed || 0,
        winRate: 0,
        totalWins: 0,
      };
    });

    res.json(leaderboard);
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
};

export const getRankersLeaderboard = async (req: Request, res: Response) => {
  try {
    const players = await prisma.user.findMany({
      orderBy: { eloRating: "desc" },
      take: 50,
    });

    const leaderboard = players.map((player: any, index: number) => ({
      rank: index + 1,
      id: player.id,
      name: player.name,
      eloRating: player.eloRating || 1200,
      gamesPlayed: player.gamesPlayed || 0,
    }));

    res.json(leaderboard);
  } catch (error) {
    console.error("Error fetching rankers:", error);
    res.status(500).json({ error: "Failed to fetch rankers" });
  }
};

export const getWinnersLeaderboard = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany();

    const playerStats = await Promise.all(
      users.map(async (user: any) => {
        const wins = await prisma.match.count({
          where: {
            OR: [
              { player1Id: user.id, isDraw: false, eloChangePlayer1: { gt: 0 } },
              { player2Id: user.id, isDraw: false, eloChangePlayer2: { gt: 0 } },
            ],
          },
        });

        const losses = await prisma.match.count({
          where: {
            OR: [
              { player1Id: user.id, isDraw: false, eloChangePlayer1: { lt: 0 } },
              { player2Id: user.id, isDraw: false, eloChangePlayer2: { lt: 0 } },
            ],
          },
        });

        return {
          id: user.id,
          name: user.name,
          eloRating: user.eloRating || 1200,
          gamesPlayed: user.gamesPlayed || 0,
          wins,
          losses,
          net: wins - losses,
        };
      })
    );

    const sorted = playerStats
      .sort((a, b) => b.net - a.net)
      .slice(0, 50)
      .map((player: any, index: number) => ({
        rank: index + 1,
        ...player,
      }));

    res.json(sorted);
  } catch (error) {
    console.error("Error fetching winners:", error);
    res.status(500).json({ error: "Failed to fetch winners" });
  }
};

export const getWallOfShameLeaderboard = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany();

    const playerStats = await Promise.all(
      users.map(async (user: any) => {
        const wins = await prisma.match.count({
          where: {
            OR: [
              { player1Id: user.id, isDraw: false, eloChangePlayer1: { gt: 0 } },
              { player2Id: user.id, isDraw: false, eloChangePlayer2: { gt: 0 } },
            ],
          },
        });

        const losses = await prisma.match.count({
          where: {
            OR: [
              { player1Id: user.id, isDraw: false, eloChangePlayer1: { lt: 0 } },
              { player2Id: user.id, isDraw: false, eloChangePlayer2: { lt: 0 } },
            ],
          },
        });

        return {
          id: user.id,
          name: user.name,
          eloRating: user.eloRating || 1200,
          gamesPlayed: user.gamesPlayed || 0,
          wins,
          losses,
          net: wins - losses,
        };
      })
    );

    const sorted = playerStats
      .sort((a, b) => b.losses - a.losses)
      .slice(0, 50)
      .map((player: any, index: number) => ({
        rank: index + 1,
        ...player,
      }));

    res.json(sorted);
  } catch (error) {
    console.error("Error fetching wall of shame:", error);
    res.status(500).json({ error: "Failed to fetch wall of shame" });
  }
};
