"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startGame = exports.getGames = exports.joinGame = exports.createGame = void 0;
const prisma_1 = __importDefault(require("../libs/prisma"));
const board_1 = require("../utils/board");
const createGame = async (req, res) => {
    const { name } = req.body;
    const game = await prisma_1.default.game.create({
        data: { name, status: "WAITING" },
    });
    res.json(game);
};
exports.createGame = createGame;
const joinGame = async (req, res) => {
    const { gameId } = req.params;
    const userId = req.user?.userId;
    if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    const players = await prisma_1.default.gamePlayer.count({
        where: { gameId: Number(gameId) }
    });
    if (players >= 2) {
        return res.status(400).json({ error: "Game full" });
    }
    const existing = await prisma_1.default.gamePlayer.findFirst({
        where: {
            userId,
            gameId: Number(gameId),
        },
    });
    if (existing) {
        return res.status(400).json({ error: "Player already in game" });
    }
    const player = await prisma_1.default.gamePlayer.create({
        data: {
            userId,
            gameId: Number(gameId),
        },
    });
    res.json(player);
};
exports.joinGame = joinGame;
const getGames = async (_req, res) => {
    const games = await prisma_1.default.game.findMany({
        include: {
            players: {
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            },
        },
    });
    res.json(games);
};
exports.getGames = getGames;
const startGame = async (req, res) => {
    const { gameId } = req.params;
    const game = await prisma_1.default.game.findUnique({
        where: { id: Number(gameId) }
    });
    if (!game || game.status !== "WAITING") {
        return res.status(400).json({ error: "Game cannot be started" });
    }
    const players = await prisma_1.default.gamePlayer.findMany({
        where: { gameId: Number(gameId) }
    });
    if (players.length !== 2) {
        return res.status(400).json({ error: "Need 2 players" });
    }
    const board = (0, board_1.createInitialBoard)();
    const updated = await prisma_1.default.game.update({
        where: { id: Number(gameId) },
        data: {
            status: "PLAYING",
            board,
            turn: players[0].userId
        }
    });
    res.json(updated);
};
exports.startGame = startGame;
