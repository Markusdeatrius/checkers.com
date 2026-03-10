import { Request, Response } from "express"
import prisma from "../libs/prisma"

export const createGame = async (req: Request, res: Response) => {
  const { name } = req.body
  const game = await prisma.game.create({
    data: { name, status: "WAITING" },
  })
  res.json(game)
}

export const joinGame = async (req: Request, res: Response) => {
  const { gameId } = req.params
  const userId = (req.user as any).userId

  // kontrola, zda hráč už není ve hře
  const existing = await prisma.gamePlayer.findUnique({
    where: { userId_gameId: { userId, gameId: Number(gameId) } },
  })
  if (existing) return res.status(400).json({ error: "Player already in game" })

  const player = await prisma.gamePlayer.create({
    data: { userId, gameId: Number(gameId) },
  })
  res.json(player)
}

export const getGames = async (_req: Request, res: Response) => {
  const games = await prisma.game.findMany({
    include: { players: true },
  })
  res.json(games)
}