import { Router } from "express"
import { prisma } from "../libs/prisma"

const router = Router()

router.get("/health", async (_req, res) => {
	await prisma.$queryRaw`SELECT 1`
	res.status(200).json({ status: "ok" })
})

export default router
