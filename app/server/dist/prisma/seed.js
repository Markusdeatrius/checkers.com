"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
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
