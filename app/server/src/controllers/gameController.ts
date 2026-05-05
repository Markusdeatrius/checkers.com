import { Request, Response } from "express"
import prisma from "../libs/prisma"
import { createInitialBoard } from "../utils/board"

export const createGame = async (req: Request, res: Response) => {
  const { name } = req.body

  const game = await prisma.game.create({
    data: { name: name || 'Game', status: "WAITING" },
  })

  res.json(game)
}

export const joinGame = async (req: Request, res: Response) => {
  const { gameId } = req.params
  const userId = req.body.userId

  if (!userId) {
    return res.status(400).json({ error: "userId required" })
  }

    const players = await prisma.gamePlayer.count({
        where: { gameId: Number(gameId) }
    })

    if (players >= 2) {
    return res.status(400).json({ error: "Game full" })
    }

  const existing = await prisma.gamePlayer.findFirst({
    where: {
      userId,
      gameId: Number(gameId),
    },
  })

  if (existing) {
    return res.status(400).json({ error: "Player already in game" })
  }

  const player = await prisma.gamePlayer.create({
    data: {
      userId,
      gameId: Number(gameId),
    },
  })

  res.json(player)
}

export const getGames = async (_req: Request, res: Response) => {
  const games = await prisma.game.findMany({
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
  })

  res.json(games)
}

export const startGame = async (req: Request, res: Response) => {
  const { gameId } = req.params

  const game = await prisma.game.findUnique({
    where: { id: Number(gameId) }
  })

  if (!game || game.status !== "WAITING") {
    return res.status(400).json({ error: "Game cannot be started" })
  }

  const players = await prisma.gamePlayer.findMany({
    where: { gameId: Number(gameId) }
  })

  if (players.length !== 2) {
    return res.status(400).json({ error: "Need 2 players" })
  }

  const board = createInitialBoard()

  const updated = await prisma.game.update({
    where: { id: Number(gameId) },
    data: {
      status: "PLAYING",
      board,
      turn: players[0].userId
    }
  })

  res.json(updated)
}