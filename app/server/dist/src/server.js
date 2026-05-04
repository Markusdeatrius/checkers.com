"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const app_1 = __importDefault(require("./app"));
const gameSocket_1 = require("./sockets/gameSocket");
const httpServer = (0, http_1.createServer)(app_1.default);
const io = new socket_io_1.Server(httpServer, {
    cors: { origin: '*' },
});
(0, gameSocket_1.setupGameSocket)(io);
const port = 3000;
httpServer.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
