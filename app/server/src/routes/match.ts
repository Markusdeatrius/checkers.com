import { Router } from "express";
import { recordMatchResult, getLeaderboard } from "../controllers/matchController";

const router = Router();

router.post("/result", recordMatchResult);
router.get("/leaderboard", getLeaderboard);

export default router;
