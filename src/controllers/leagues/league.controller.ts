import { Response } from "express";
import { CreateLeagueDto } from "../../dto/league.dto";
import { LeagueService } from "../../services/leagues/league.service";
import { AuthRequest } from "../../middleware/auth.middleware";

const leagueService = new LeagueService();

export const createLeague = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
      return;
    }

    const leagueData: CreateLeagueDto = {
      ...req.body,
      createdBy: req.user.uid,
    };

    const newLeague = await leagueService.createLeague(leagueData);

    res.status(201).json({
      success: true,
      data: newLeague,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Error creating league",
      error: error.message,
    });
  }
};

export const getLeaguesByUserId = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId;
    const leagues = await leagueService.getLeaguesByUserId(userId);

    res.status(200).json({
      success: true,
      data: leagues,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Error getting leagues by user id",
      error: error.message,
    });
  }
};

export const getLeaguesByParticipantId = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const participantId = req.params.participantId;
    const leagues = await leagueService.getLeaguesByParticipantId(participantId);

    res.status(200).json({
      success: true,
      data: leagues,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Error getting leagues by participant id",
      error: error.message,
    });
  }
};

export const joinLeague = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
      return;
    }

    const { leagueId } = req.body;
    if (!leagueId) {
      res.status(400).json({
        success: false,
        message: "League ID is required",
      });
      return;
    }

    const league = await leagueService.joinLeague(leagueId, req.user.uid);

    res.status(200).json({
      success: true,
      data: league,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Error joining league",
    });
  }
};

export const acceptJoinRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "User not authenticated" });
      return;
    }
    const { leagueId, userId } = req.params;
    if (!leagueId || !userId) {
      res.status(400).json({ success: false, message: "League ID and user ID are required" });
      return;
    }
    // Solo el creador puede aceptar
    const league = await leagueService.acceptJoinRequest(leagueId, userId, req.user.uid);
    res.status(200).json({ success: true, data: league });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Error accepting join request" });
  }
};

export const denyJoinRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "User not authenticated" });
      return;
    }
    const { leagueId, userId } = req.params;
    if (!leagueId || !userId) {
      res.status(400).json({ success: false, message: "League ID and user ID are required" });
      return;
    }
    // Solo el creador puede denegar
    const league = await leagueService.denyJoinRequest(leagueId, userId, req.user.uid);
    res.status(200).json({ success: true, data: league });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Error denying join request" });
  }
};