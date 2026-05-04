"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupGameSocket = void 0;
const prisma_1 = __importDefault(require("../libs/prisma"));
const board_1 = require("../utils/board");
const parseId = (value) => {
    const id = Number(value);
    return Number.isInteger(id) && id > 0 ? id : undefined;
};
const setupGameSocket = (io) => {
    io.on("connection", (socket) => {
        console.log("New client connected:", socket.id);
        socket.on("joinGame", async (payload) => {
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
            const game = await prisma_1.default.game.findUnique({ where: { id: gameId } });
            if (!game)
                return socket.emit("error", "Game not found");
            socket.join(`game_${gameId}`);
            socket.emit("boardUpdate", game.board);
            socket.emit("turnUpdate", game.turn);
        });
        socket.on("makeMove", async (payload) => {
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
            const game = await prisma_1.default.game.findUnique({ where: { id: gameId } });
            if (!game)
                return socket.emit("error", "Game not found");
            if (game.turn !== userId)
                return socket.emit("error", "Not your turn");
            let board = game.board;
            const piece = board[from[0]][from[1]];
            const isKing = Math.abs(piece) > 2; // >2 označuje královnu
            const { valid, captured, mustJump } = (0, board_1.validateMove)(board, { from: from, to: to, playerId: userId, isKing }, userId);
            if (!valid)
                return socket.emit("error", "Invalid move");
            // Provedení tahu
            board = (0, board_1.applyMove)(board, from, to, captured);
            // Přepnutí tahu
            const players = await prisma_1.default.gamePlayer.findMany({ where: { gameId } });
            let nextTurn = players.find((p) => p.userId !== userId)?.userId;
            // Vícenásobný skok → hráč zůstává na tahu
            let moreJumps = false;
            const pieceAtTo = board[to[0]][to[1]];
            const opponent = userId === 1 ? 2 : 1;
            const dirs = [[2, 2], [2, -2], [-2, 2], [-2, -2]];
            for (const [dx, dy] of dirs) {
                const nx = to[0] + dx;
                const ny = to[1] + dy;
                const mx = to[0] + dx / 2;
                const my = to[1] + dy / 2;
                if (nx >= 0 &&
                    nx < 8 &&
                    ny >= 0 &&
                    ny < 8 &&
                    board[nx][ny] === 0 &&
                    (Math.abs(board[mx][my]) === opponent || Math.abs(board[mx][my]) === opponent + 2)) {
                    moreJumps = true;
                    break;
                }
            }
            if (moreJumps)
                nextTurn = userId;
            const updated = await prisma_1.default.game.update({
                where: { id: gameId },
                data: { board, turn: nextTurn },
            });
            io.to(`game_${gameId}`).emit("boardUpdate", updated.board);
            io.to(`game_${gameId}`).emit("turnUpdate", updated.turn);
        });
        socket.on("disconnect", () => {
            console.log("Client disconnected:", socket.id);
        });
    });
};
exports.setupGameSocket = setupGameSocket;
