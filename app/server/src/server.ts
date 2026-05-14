import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './app';
import { setupGameSocket } from './sockets/gameSocket';
import prisma from './libs/prisma';

const ensureLobbies = async () => {
  try {
    const waitingCount = await prisma.game.count({
      where: { status: 'WAITING' }
    }) - 1;
    
    console.log(`Waiting lobbies: ${waitingCount}`)
    
    const needed = Math.max(0, 9 - waitingCount)
    if (needed > 0) {
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