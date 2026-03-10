import { Router } from "express"
import { createGame, joinGame, getGames } from "../controllers/gameController"
import { authMiddleware } from "../middleware/authMiddleware"

const router = Router()

router.post("/", authMiddleware, createGame)
router.get("/", authMiddleware, getGames)
router.post("/:gameId/join", authMiddleware, joinGame)

export default router