import { Router } from "express"

const router = Router()

router.get("/me", (req, res) => res.json({ id: 1, name: "Player1" }))

export default router