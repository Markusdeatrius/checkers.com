import http from "http";
import { Server } from "socket.io";
import app from "./app";
//import { gameSocket } from "./sockets/gameSocket";

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

//io.on("connection", (socket) => gameSocket(io, socket));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
