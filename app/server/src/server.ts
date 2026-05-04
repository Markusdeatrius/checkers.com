import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './app';
import { setupGameSocket } from './sockets/gameSocket';

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: '*' },
});

setupGameSocket(io);

const port = 3000;
httpServer.listen(port, () => {
  console.log(`Server running on port ${port}`);
});