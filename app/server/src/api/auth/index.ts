import { Router } from "express"

const router = Router()

router.post("/login", (_req, res) => {
	res.status(501).json({ error: "not implemented" })
})

router.post("/register", (_req, res) => {
	res.status(501).json({ error: "not implemented" })
})

export default router
