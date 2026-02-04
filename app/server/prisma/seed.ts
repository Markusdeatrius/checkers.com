import { PrismaClient } from "@prisma/client"
import bcrypt from "bcrypt"

const prisma = new PrismaClient()

async function main() {
  await prisma.move.deleteMany()
  await prisma.gamePlayer.deleteMany()
  await prisma.game.deleteMany()
  await prisma.userStats.deleteMany()
  await prisma.user.deleteMany()

  const password = await bcrypt.hash("password123", 10)

  const users = await prisma.user.createMany({
    data: [
      {
        email: "alice@example.com",
        username: "alice",
        passwordHash: password,
        rating: 1200,
      },
      {
        email: "bob@example.com",
        username: "bob",
        passwordHash: password,
        rating: 1200,
      },
      {
        email: "charlie@example.com",
        username: "charlie",
        passwordHash: password,
        rating: 1200,
      },
    ],
  })

  const allUsers = await prisma.user.findMany()

  await prisma.userStats.createMany({
    data: allUsers.map((u: { id: any }) => ({
      userId: u.id,
      wins: 0,
      losses: 0,
      draws: 0,
      gamesPlayed: 0,
    })),
  })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
