import { Router } from "express"

const router = Router()

router.get("/", (_req, res) => {
	res.json({ service: "checkers-backend" })
})

export default router
