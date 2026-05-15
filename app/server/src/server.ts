import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './app';
import { setupGameSocket } from './sockets/gameSocket';
import prisma from './libs/prisma';

const TARGET_WAITING_LOBBIES = 9;

const ensureLobbies = async () => {
  try {
    const waitingGames = await prisma.game.findMany({
      where: { status: 'WAITING' },
      orderBy: { createdAt: 'asc' },
    });
    const waitingCount = waitingGames.length;

    console.log(`Waiting lobbies: ${waitingCount}`)

    if (waitingCount > TARGET_WAITING_LOBBIES) {
      const extraGames = waitingGames.slice(TARGET_WAITING_LOBBIES);
      await prisma.game.deleteMany({
        where: { id: { in: extraGames.map(game => game.id) } },
      });
      console.log(`Removed ${extraGames.length} extra lobbies. Now ${TARGET_WAITING_LOBBIES} waiting.`)
    } else if (waitingCount < TARGET_WAITING_LOBBIES) {
      const needed = TARGET_WAITING_LOBBIES - waitingCount;
      console.log(`Creating ${needed} new lobbies...`)
      for (let i = 0; i < needed; i++) {
        await prisma.game.create({
          data: { 
            name: `Game ${waitingCount + i + 1}`, 
            status: 'WAITING',
            board: [] 
          }
        })
      }
      console.log(`Created ${needed} lobbies. Now ${waitingCount + needed} waiting.`)
    }
  } catch (err) {
    console.error('Lobby init error:', err)
  }
}

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: '*' },
});

setupGameSocket(io);

const port = 3002;
httpServer.listen(port, async () => {
  console.log(`Server running on port ${port}`);
  await ensureLobbies();
});