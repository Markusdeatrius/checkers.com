"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../libs/prisma");
const router = (0, express_1.Router)();
router.get("/health", async (_req, res) => {
    await prisma_1.prisma.$queryRaw `SELECT 1`;
    res.status(200).json({ status: "ok" });
});
exports.default = router;
