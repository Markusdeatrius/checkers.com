import { Server } from "socket.io";
import prisma from "../libs/prisma";
import { calculateElo } from "../utils/elo";
import {
  validateMove,
  applyMove,
  getCaptureMovesForPiece,
  hasPiecesLeft,
  hasValidMoves,
} from "../utils/board";

const DEFAULT_CLOCK_MS = 5 * 60 * 1000;

type TimerState = {
  clocks: Record<number, number>;
  activeSlot: number;
  interval: NodeJS.Timeout | null;
  lastTick: number;
};

const gameTimers: Record<string, TimerState> = {};

const parseId = (value: unknown): string | undefined => {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
};

const getPlayerSlot = (players: Array<{ userId: string }>, userId: string) => {
  const index = players.findIndex((player) => player.userId === userId);
  return index === -1 ? undefined : index + 1;
};

const getPlayerStats = async (userId: string) => {
  const wins = await prisma.game.count({
    where: {
      status: "FINISHED",
      winnerId: userId,
      players: {
        some: { userId },
      },
    },
  });

  const losses = await prisma.game.count({
    where: {
      status: "FINISHED",
      AND: [
        {
          winnerId: {
            not: null,
          },
        },
        {
          winnerId: {
            not: userId,
          },
        },
      ],
      players: {
        some: { userId },
      },
    },
  });

  const draws = await prisma.game.count({
    where: {
      status: "DRAW",
      players: {
        some: { userId },
      },
    },
  });

  return { wins, losses, draws };
};

const getDefaultBoard = (): number[][] =>
  Array.from({ length: 8 }, () => Array(8).fill(0));

const ensureTimerState = (gameId: string, activeSlot: number, io: Server) => {
  const timer = gameTimers[gameId] || {
    clocks: { 1: DEFAULT_CLOCK_MS, 2: DEFAULT_CLOCK_MS },
    activeSlot,
    interval: null,
    lastTick: Date.now(),
  };

  timer.activeSlot = activeSlot;
  timer.lastTick = Date.now();

  if (!timer.interval) {
    timer.interval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - timer.lastTick;
      timer.lastTick = now;
      timer.clocks[timer.activeSlot] = Math.max(
        0,
        timer.clocks[timer.activeSlot] - elapsed
      );

      io.to(`game_${gameId}`).emit("timerUpdate", {
        clocks: timer.clocks,
        activeSlot: timer.activeSlot,
      });

      if (timer.clocks[timer.activeSlot] <= 0) {
        stopTimer(gameId);
        endGameByTimeout(
          gameId,
          timer.activeSlot === 1 ? 2 : 1,
          io
        ).catch(console.error);
      }
    }, 1000);
  }

  gameTimers[gameId] = timer;

  io.to(`game_${gameId}`).emit("timerUpdate", {
    clocks: timer.clocks,
    activeSlot: timer.activeSlot,
  });
};

const stopTimer = (gameId: string) => {
  const timer = gameTimers[gameId];

  if (timer?.interval) {
    clearInterval(timer.interval);
  }

  delete gameTimers[gameId];
};

const buildGameState = async (game: any) => {
  const sortedPlayers = [...game.players].sort((a, b) =>
    String(a.id).localeCompare(String(b.id))
  );

  const players = await Promise.all(
    sortedPlayers.map(async (player: any, index: number) => ({
      slot: index + 1,
      userId: player.userId,
      name: player.user.name,
      color: index === 0 ? "white" : "black",
      eloRating: player.user.eloRating,
      stats: await getPlayerStats(player.userId),
    }))
  );

  const timer = gameTimers[game.id] || {
    clocks: { 1: DEFAULT_CLOCK_MS, 2: DEFAULT_CLOCK_MS },
    activeSlot: game.turn ?? 1,
    interval: null,
    lastTick: Date.now(),
  };

  return {
    id: game.id,
    board: game.board ?? getDefaultBoard(),
    turn: game.turn ?? 1,
    status: game.status,
    winnerId: game.winnerId,
    activeSlot: timer.activeSlot,
    clocks: timer.clocks,
    players,
  };
};

const finalizeMatchElo = async (players: any[], winnerSlot: number) => {
  if (players.length < 2) return;

  const sorted = [...players].sort((a, b) =>
    String(a.id).localeCompare(String(b.id))
  );

  const player1 = sorted[0].user;
  const player2 = sorted[1].user;

  if (!player1 || !player2) return;

  const actualScore1 = winnerSlot === 1 ? 1 : 0;
  const actualScore2 = winnerSlot === 2 ? 1 : 0;

  const newRating1 = calculateElo(
    player1.eloRating,
    player2.eloRating,
    actualScore1,
    player1.gamesPlayed
  );

  const newRating2 = calculateElo(
    player2.eloRating,
    player1.eloRating,
    actualScore2,
    player2.gamesPlayed
  );

  await prisma.$transaction([
    prisma.user.update({
      where: { id: player1.id },
      data: {
        eloRating: newRating1,
        gamesPlayed: { increment: 1 },
      },
    }),
    prisma.user.update({
      where: { id: player2.id },
      data: {
        eloRating: newRating2,
        gamesPlayed: { increment: 1 },
      },
    }),
    prisma.match.create({
      data: {
        player1Id: player1.id,
        player2Id: player2.id,
        isDraw: false,
        eloChangePlayer1: newRating1 - player1.eloRating,
        eloChangePlayer2: newRating2 - player2.eloRating,
      },
    }),
  ]);
};

const endGameByTimeout = async (
  gameId: string,
  winnerSlot: number,
  io: Server
) => {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: {
      players: {
        orderBy: { id: "asc" },
      },
    },
  });

  const winner = game?.players[winnerSlot - 1];

  if (!winner) return;

  const updatedGame = await prisma.game.update({
    where: { id: gameId },
    data: {
      status: "FINISHED",
      winnerId: winner.userId,
    },
    include: {
      players: {
        include: {
          user: true,
        },
      },
    },
  });

  await finalizeMatchElo(updatedGame.players, winnerSlot);

  io.to(`game_${gameId}`).emit("gameFinished", winnerSlot);
  io.to(`game_${gameId}`).emit(
    "gameState",
    await buildGameState(updatedGame)
  );
};

const broadcastGameState = async (gameId: string, io: Server) => {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: {
      players: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!game) return;

  if (game.status === "PLAYING") {
    ensureTimerState(gameId, game.turn ?? 1, io);
  }

  io.to(`game_${gameId}`).emit("gameState", await buildGameState(game));
};

export const setupGameSocket = (io: Server) => {
  io.on("connection", (socket) => {
    socket.on("joinGame", async (payload: any) => {
      const gameId = parseId(payload?.gameId);
      const userId = parseId(payload?.userId);

      if (!gameId || !userId) {
        return socket.emit("error", "Invalid ID format");
      }

      const game = await prisma.game.findUnique({
        where: { id: gameId },
        include: {
          players: {
            orderBy: { id: "asc" },
          },
        },
      });

      if (!game) {
        return socket.emit("error", "Game not found");
      }

      if (!getPlayerSlot(game.players, userId)) {
        return socket.emit("error", "Not your game");
      }

      socket.join(`game_${gameId}`);
      await broadcastGameState(gameId, io);
    });

    socket.on("makeMove", async (payload: any) => {
      const gameId = parseId(payload?.gameId);
      const userId = parseId(payload?.userId);
      const { from, to } = payload;

      if (!gameId || !userId || !from || !to) {
        return socket.emit("error", "Missing move data");
      }

      const game = await prisma.game.findUnique({
        where: { id: gameId },
        include: {
          players: {
            include: {
              user: true,
            },
            orderBy: {
              id: "asc",
            },
          },
        },
      });

      if (!game || game.status !== "PLAYING") {
        return socket.emit("error", "Game inactive");
      }

      const slot = getPlayerSlot(game.players, userId);

      if (slot !== game.turn) {
        return socket.emit("error", "Not your turn");
      }

      const board = game.board as number[][];

      const moveResult = validateMove(
        board,
        {
          from,
          to,
          playerId: slot,
          isKing: Math.abs(board[from[0]][from[1]]) > 2,
        },
        slot
      );

      if (!moveResult.valid) {
        return socket.emit("error", "Invalid move");
      }

      const updatedBoard = applyMove(
        board,
        from,
        to,
        moveResult.captured,
        moveResult.huffed
      );

      let nextTurn = slot === 1 ? 2 : 1;

      if (
        moveResult.captured?.length &&
        getCaptureMovesForPiece(updatedBoard, to, slot).length > 0
      ) {
        nextTurn = slot;
      }

      const isFinished =
        nextTurn !== slot &&
        (!hasPiecesLeft(updatedBoard, nextTurn) ||
          !hasValidMoves(updatedBoard, nextTurn));

      const updated = await prisma.game.update({
        where: { id: gameId },
        data: {
          board: updatedBoard,
          turn: nextTurn,
          status: isFinished ? "FINISHED" : "PLAYING",
          winnerId: isFinished ? userId : null,
        },
        include: {
          players: {
            include: {
              user: true,
            },
          },
        },
      });

      if (isFinished) {
        await finalizeMatchElo(game.players, slot);
        stopTimer(gameId);
        io.to(`game_${gameId}`).emit("gameFinished", slot);
      } else {
        ensureTimerState(gameId, nextTurn, io);
      }

      io.to(`game_${gameId}`).emit("boardUpdate", updated.board);
      io.to(`game_${gameId}`).emit("turnUpdate", updated.turn);

      await broadcastGameState(gameId, io);
    });

    socket.on("chatMessage", async (payload: any) => {
      const gameId = parseId(payload?.gameId);
      const userId = parseId(payload?.userId);
      const text = payload?.text?.trim();

      if (!gameId || !userId || !text) {
        return;
      }

      const sender = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!sender) {
        return;
      }

      io.to(`game_${gameId}`).emit("chatMessage", {
        userId,
        userName: sender.name,
        text,
        createdAt: new Date().toISOString(),
      });
    });

    socket.on("disconnect", () => {});
  });
};