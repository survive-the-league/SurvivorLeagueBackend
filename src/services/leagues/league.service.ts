import { CreateLeagueDto } from "../../dto/league.dto";
import { League } from "../../interfaces/league.interface";
import { LeagueParticipant } from "../../interfaces/league-participant.interface";
import { db } from "../../config/firebase";

export class LeagueService {
  async createLeague(leagueData: CreateLeagueDto): Promise<League> {
    try {
      const leagueRef = db.collection("leagues").doc();
      const initialParticipant: LeagueParticipant = {
        userId: leagueData.createdBy,
        lives: leagueData.initialLives,
        isActive: true,
        totalPredictions: 0,
        correctPredictions: 0,
      };

      const newLeague: League = {
        id: leagueRef.id,
        ...leagueData,
        createdAt: new Date(),
        updatedAt: new Date(),
        participants: [initialParticipant],
        status: "active",
        currentRound: 1,
      };

      await leagueRef.set(newLeague);
      return newLeague;
    } catch (error) {
      throw new Error("Error creating league in database");
    }
  }

  async updateParticipantLives(
    leagueId: string,
    userId: string,
    livesLost: number
  ): Promise<void> {
    try {
      const leagueRef = db.collection("leagues").doc(leagueId);
      const leagueDoc = await leagueRef.get();

      if (!leagueDoc.exists) {
        throw new Error("League not found");
      }

      const league = leagueDoc.data() as League;
      const participantIndex = league.participants.findIndex(
        (p) => p.userId === userId
      );

      if (participantIndex === -1) {
        throw new Error("Participant not found in league");
      }

      const participant = league.participants[participantIndex];
      participant.lives -= livesLost;

      if (participant.lives <= 0) {
        participant.lives = 0;
        participant.isActive = false;
        participant.eliminatedAt = new Date();
      }

      await leagueRef.update({
        participants: league.participants,
        updatedAt: new Date(),
      });
    } catch (error) {
      throw new Error("Error updating participant lives");
    }
  }

  async addParticipant(leagueId: string, userId: string): Promise<void> {
    try {
      const leagueRef = db.collection("leagues").doc(leagueId);
      const leagueDoc = await leagueRef.get();

      if (!leagueDoc.exists) {
        throw new Error("League not found");
      }

      const league = leagueDoc.data() as League;

      if (league.participants.length >= league.maxParticipants) {
        throw new Error("League is full");
      }

      const newParticipant: LeagueParticipant = {
        userId,
        lives: league.initialLives,
        isActive: true,
        totalPredictions: 0,
        correctPredictions: 0,
      };

      await leagueRef.update({
        participants: [...league.participants, newParticipant],
        updatedAt: new Date(),
      });
    } catch (error) {
      throw new Error("Error adding participant to league");
    }
  }
}
