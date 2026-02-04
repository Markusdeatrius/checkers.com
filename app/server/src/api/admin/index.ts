import { Router } from "express"

const router = Router()

router.get("/admin", (_req, res) => {
	res.json({ admin: true })
})

export default router
