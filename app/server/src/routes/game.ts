import { Router } from "express"
import { createGame, joinGame, getGames, startGame } from "../controllers/gameController"
import { authMiddleware } from "../middleware/authMiddleware"

const router = Router()

router.get("/", getGames)
router.post("/", authMiddleware, createGame)
router.post("/:gameId/join", authMiddleware, joinGame)
router.post("/:gameId/start", authMiddleware, startGame)

export default router