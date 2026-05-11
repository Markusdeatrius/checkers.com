import { Request, Response } from "express";
import prisma from "../libs/prisma";
import { calculateElo } from "../utils/elo";

export const recordMatchResult = async (req: Request, res: Response) => {
  const { player1Id, player2Id, result } = req.body;

  if (!Number.isInteger(player1Id) || !Number.isInteger(player2Id) || !result) {
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
