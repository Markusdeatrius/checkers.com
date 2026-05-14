import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Uživatele
  const users = [
    { name: 'K', email: 'k@email.cz', password: '123456' },
    { name: 'L', email: 'l@email.cz', password: '123456' },
  ];

  const hashedUsers = await Promise.all(
    users.map(async (user) => ({
      ...user,
      password: await bcrypt.hash(user.password, 10),
    }))
  );

  await prisma.user.createMany({
    data: hashedUsers,
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