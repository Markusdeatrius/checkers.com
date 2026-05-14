import { Request, Response } from "express"
import prisma from "../libs/prisma"
import bcrypt from "bcrypt"
import { signJWT } from "../utils/jwt"

export const register = async (req: Request, res: Response) => {
  const { name, email, password } = req.body

  try {
    const hash = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hash,
      },
    })

    const token = await signJWT({ userId: user.id })

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        eloRating: user.eloRating || 1200,
      },
    })
  } catch {
    res.status(400).json({ error: "Email exists" })
  }
}

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" })
    }

    const valid = await bcrypt.compare(password, user.password)

    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" })
    }

    const token = await signJWT({ userId: user.id })

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        eloRating: user.eloRating || 1200,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      eloRating: user.eloRating || 1200,
    })
  } catch (error) {
    console.error("Get current user error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}