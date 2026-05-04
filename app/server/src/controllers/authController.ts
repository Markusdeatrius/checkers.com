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

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
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

    res.json({ token })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}