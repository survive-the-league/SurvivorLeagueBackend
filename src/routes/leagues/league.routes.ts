import { Router } from "express";
import { createLeague } from "../../controllers/leagues/league.controller";
import { validateCreateLeague } from "../../middleware/validators/league.validator";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

// Create a new league
router.post("/", authMiddleware, validateCreateLeague, createLeague);

export default router;
