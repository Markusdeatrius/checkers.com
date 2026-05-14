import { Router } from "express";
import { 
  recordMatchResult, 
  getLeaderboard, 
  getRankersLeaderboard,
  getWinnersLeaderboard,
  getWallOfShameLeaderboard 
} from "../controllers/matchController";

const router = Router();

router.post("/result", recordMatchResult);
router.get("/leaderboard", getLeaderboard);
router.get("/leaderboard/rankers", getRankersLeaderboard);
router.get("/leaderboard/winners", getWinnersLeaderboard);
router.get("/leaderboard/wall-of-shame", getWallOfShameLeaderboard);

export default router;
