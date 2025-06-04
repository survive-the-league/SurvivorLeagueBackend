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
