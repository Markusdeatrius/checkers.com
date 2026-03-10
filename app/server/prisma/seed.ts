import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Uživatele
  await prisma.user.createMany({
    data: [
      { name: 'Alice', email: 'alice@example.com', password: 'password123' },
      { name: 'Bob', email: 'bob@example.com', password: 'password123' },
    ],
  });

  // Hry bez relation pole
  await prisma.game.create({
    data: {
      name: 'Test Game 1',
      status: 'WAITING',
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });