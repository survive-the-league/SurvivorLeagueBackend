import { Router } from "express";
import {
  createLeague,
  getLeaguesByUserId,
  getLeaguesByParticipantId,
  joinLeague,
  acceptJoinRequest,
  denyJoinRequest,
} from "../../controllers/leagues/league.controller";
import { validateCreateLeague } from "../../middleware/validators/league.validator";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

// Create a new league
router.post("/", authMiddleware, validateCreateLeague, createLeague);
// Get all created leagues by user id
router.get("/:userId", authMiddleware, getLeaguesByUserId);
// Get all leagues where the user is a participant (participantId is the user id)
router.get(
  "/my-leagues/:participantId",
  authMiddleware,
  getLeaguesByParticipantId
);
// Join a league (request access)
router.post("/join", authMiddleware, joinLeague);
// Accept join request (admin only)
router.patch("/:leagueId/requests/:userId/accept", authMiddleware, acceptJoinRequest);
// Deny join request (admin only)
router.patch("/:leagueId/requests/:userId/deny", authMiddleware, denyJoinRequest);

export default router;
