import { Router } from "express"
import { createGame, joinGame, getGames, startGame } from "../controllers/gameController"
import { authMiddleware } from "../middleware/authMiddleware"

const router = Router()

router.get("/", getGames)
router.post("/", createGame)
router.post("/:gameId/join", joinGame)
router.post("/:gameId/start", startGame)

export default router