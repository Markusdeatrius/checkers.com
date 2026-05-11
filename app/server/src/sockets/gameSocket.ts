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

const gameTimers: Record<number, TimerState> = {};

const parseId = (value: unknown) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : undefined;
};

const getPlayerSlot = (players: Array<{ userId: number }>, userId: number) => {
  const index = players.findIndex((player) => player.userId === userId);
  return index === -1 ? undefined : index + 1;
};

const getPlayerStats = async (userId: number) => {
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
      winnerId: { not: userId },
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

const getDefaultBoard = (): number[][] => Array.from({ length: 8 }, () => Array(8).fill(0));

const ensureTimerState = (gameId: number, activeSlot: number, io: Server) => {
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
      timer.clocks[timer.activeSlot] = Math.max(0, timer.clocks[timer.activeSlot] - elapsed);

      io.to(`game_${gameId}`).emit("timerUpdate", {
        clocks: timer.clocks,
        activeSlot: timer.activeSlot,
      });

      if (timer.clocks[timer.activeSlot] <= 0) {
        const loserSlot = timer.activeSlot;
        const winnerSlot = loserSlot === 1 ? 2 : 1;
        stopTimer(gameId);
        endGameByTimeout(gameId, winnerSlot, io).catch((error) => {
          console.error("Error ending game by timeout:", error);
        });
      }
    }, 1000);
  }

  gameTimers[gameId] = timer;
  io.to(`game_${gameId}`).emit("timerUpdate", {
    clocks: timer.clocks,
    activeSlot: timer.activeSlot,
  });
};

const stopTimer = (gameId: number) => {
  const timer = gameTimers[gameId];
  if (timer?.interval) {
    clearInterval(timer.interval);
  }
  delete gameTimers[gameId];
};

const buildGameState = async (game: any) => {
  const sortedPlayers = [...game.players].sort((a, b) => a.id - b.id);
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

  const player1 = players[0].user;
  const player2 = players[1].user;
  if (!player1 || !player2) return;

  const actualScore1 = winnerSlot === 1 ? 1 : 0;
  const actualScore2 = winnerSlot === 1 ? 0 : 1;

  const newRating1 = calculateElo(
    player1.eloRating || 1200,
    player2.eloRating || 1200,
    actualScore1,
    player1.gamesPlayed || 0
  );
  const newRating2 = calculateElo(
    player2.eloRating || 1200,
    player1.eloRating || 1200,
    actualScore2,
    player2.gamesPlayed || 0
  );

  const eloChange1 = newRating1 - (player1.eloRating || 1200);
  const eloChange2 = newRating2 - (player2.eloRating || 1200);

  await prisma.$transaction(async (tx: any) => {
    await Promise.all([
      tx.user.update({
        where: { id: player1.id },
        data: { eloRating: newRating1, gamesPlayed: { increment: 1 } },
      }),
      tx.user.update({
        where: { id: player2.id },
        data: { eloRating: newRating2, gamesPlayed: { increment: 1 } },
      }),
    ]);

    await tx.match.create({
      data: {
        player1Id: player1.id,
        player2Id: player2.id,
        isDraw: false,
        eloChangePlayer1: eloChange1,
        eloChangePlayer2: eloChange2,
      },
    });
  });
};

const endGameByTimeout = async (gameId: number, winnerSlot: number, io: Server) => {
  const players = await prisma.gamePlayer.findMany({
    where: { gameId },
    orderBy: { id: "asc" },
  });

  const winner = players[winnerSlot - 1];
  if (!winner) return;

  const updatedGame = await prisma.game.update({
    where: { id: gameId },
    data: {
      status: "FINISHED",
      winnerId: winner.userId,
    },
    include: { players: { include: { user: true } } },
  });

  await finalizeMatchElo(players, winnerSlot);
  io.to(`game_${gameId}`).emit("gameFinished", winnerSlot);
  io.to(`game_${gameId}`).emit("gameState", await buildGameState(updatedGame));
};

const broadcastGameState = async (gameId: number, io: Server) => {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: { players: { include: { user: true } } },
  });

  if (!game) return;

  if (game.status === "PLAYING") {
    ensureTimerState(gameId, game.turn ?? 1, io);
  }

  io.to(`game_${gameId}`).emit("gameState", await buildGameState(game));
};

export const setupGameSocket = (io: Server) => {
  io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);

    socket.on("joinGame", async (payload: any) => {
      const gameId = parseId(payload?.gameId);
      const userId = parseId(payload?.userId);

      if (!gameId) {
        console.error("joinGame missing or invalid gameId", payload);
        return socket.emit("error", "Invalid or missing gameId");
      }

      if (!userId) {
        console.error("joinGame missing or invalid userId", payload);
        return socket.emit("error", "Invalid or missing userId");
      }

      const game = await prisma.game.findUnique({
        where: { id: gameId },
        include: { players: { include: { user: true } } },
      });
      if (!game) return socket.emit("error", "Game not found");

      const slot = getPlayerSlot(game.players, userId);
      if (!slot) return socket.emit("error", "User is not part of this game");

      socket.join(`game_${gameId}`);
      if (game.status === "PLAYING") {
        ensureTimerState(gameId, game.turn ?? 1, io);
      }

      await broadcastGameState(gameId, io);
    });

    socket.on("makeMove", async (payload: any) => {
      const gameId = parseId(payload?.gameId);
      const userId = parseId(payload?.userId);
      const from = payload?.from;
      const to = payload?.to;

      if (!gameId) {
        console.error("makeMove missing or invalid gameId", payload);
        return socket.emit("error", "Invalid or missing gameId");
      }

      if (!userId) {
        console.error("makeMove missing or invalid userId", payload);
        return socket.emit("error", "Invalid or missing userId");
      }

      if (!Array.isArray(from) || !Array.isArray(to)) {
        console.error("makeMove invalid move payload", payload);
        return socket.emit("error", "Invalid move data");
      }

      const game = await prisma.game.findUnique({
        where: { id: gameId },
        include: { players: { include: { user: true } } },
      });
      if (!game) return socket.emit("error", "Game not found");
      if (game.status !== "PLAYING") return socket.emit("error", "Game is not active");

      const players = game.players.sort((a, b) => a.id - b.id);
      const slot = getPlayerSlot(players, userId);
      if (!slot) return socket.emit("error", "User is not part of this game");

      if (game.turn !== slot) return socket.emit("error", "Not your turn");

      const board = game.board as number[][];
      const piece = board[from[0]][from[1]];
      const isKing = piece !== undefined && Math.abs(piece) > 2;
      const moveResult = validateMove(board, {
        from: from as [number, number],
        to: to as [number, number],
        playerId: slot,
        isKing,
      }, slot);

      if (!moveResult.valid) return socket.emit("error", "Invalid move");

      const updatedBoard = applyMove(board, from as [number, number], to as [number, number], moveResult.captured, moveResult.huffed);
      const opponentSlot = slot === 1 ? 2 : 1;
      let nextTurn = opponentSlot;
      const additionalJumps = getCaptureMovesForPiece(updatedBoard, to as [number, number], slot);
      if (moveResult.captured && moveResult.captured.length > 0 && additionalJumps.length > 0) {
        nextTurn = slot;
      }

      const opponentHasPieces = hasPiecesLeft(updatedBoard, opponentSlot);
      const opponentHasMoves = hasValidMoves(updatedBoard, opponentSlot);
      const isFinished = nextTurn === opponentSlot && (!opponentHasPieces || !opponentHasMoves);

      const updateData: any = { board: updatedBoard, turn: nextTurn };
      if (isFinished) {
        const winnerUser = players[slot - 1];
        updateData.status = "FINISHED";
        updateData.winnerId = winnerUser.userId;
      }

      const updated = await prisma.game.update({
        where: { id: gameId },
        data: updateData,
        include: { players: { include: { user: true } } },
      });

      if (isFinished) {
        await finalizeMatchElo(players, slot);
        stopTimer(gameId);
        io.to(`game_${gameId}`).emit("gameFinished", slot);
      }

      if (updated.status === "PLAYING") {
        ensureTimerState(gameId, nextTurn, io);
      }

      io.to(`game_${gameId}`).emit("boardUpdate", updated.board);
      io.to(`game_${gameId}`).emit("turnUpdate", updated.turn);
      await broadcastGameState(gameId, io);
    });

    socket.on("chatMessage", async (payload: any) => {
      const gameId = parseId(payload?.gameId);
      const userId = parseId(payload?.userId);
      const text = typeof payload?.text === "string" ? payload.text.trim() : "";

      if (!gameId || !userId || !text) {
        return socket.emit("error", "Invalid chat message");
      }

      const game = await prisma.game.findUnique({
        where: { id: gameId },
        include: { players: { include: { user: true } } },
      });

      if (!game) return socket.emit("error", "Game not found");
      const slot = getPlayerSlot(game.players, userId);
      if (!slot) return socket.emit("error", "User is not part of this game");

      const sender = game.players.find((player) => player.userId === userId);

      io.to(`game_${gameId}`).emit("chatMessage", {
        userId,
        userName: sender?.user?.name ?? `Player ${slot}`,
        text,
        createdAt: new Date().toISOString(),
      });
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });
};
