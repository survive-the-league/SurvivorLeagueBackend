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
        pendingRequests: [],
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

  async getLeaguesByUserId(userId: string): Promise<League[]> {
    try {
      const leaguesRef = db.collection("leagues");
      const leagues = await leaguesRef.where("createdBy", "==", userId).get();
      return leagues.docs.map((doc) => doc.data() as League);
    } catch (error) {
      throw new Error("Error getting leagues by user id");
    }
  }

  async getLeaguesByParticipantId(participantId: string): Promise<League[]> {
    try {
      const leaguesRef = db.collection("leagues");
      const leagues = await leaguesRef.get();

      // Filtramos las ligas que contienen al usuario como participante o tiene una solicitud pendiente
      const userLeagues = leagues.docs
        .map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as League)
        )
        .filter((league) => {
          if ("users" in league) return false;
          if (!league.participants || !Array.isArray(league.participants))
            return false;
          
          // Verificar si el usuario es participante
          const isParticipant = league.participants.some(
            (participant) => participant.userId === participantId
          );

          // Verificar si el usuario tiene una solicitud pendiente
          const hasPendingRequest = league.pendingRequests?.includes(participantId) || false;

          return isParticipant || hasPendingRequest;
        });

      return userLeagues;
    } catch (error) {
      console.log("Error details:", error);
      throw new Error("Error getting leagues by participant id");
    }
  }

  async joinLeague(leagueId: string, userId: string): Promise<League> {
    try {
      const leagueRef = db.collection("leagues").doc(leagueId);
      const leagueDoc = await leagueRef.get();

      if (!leagueDoc.exists) {
        throw new Error("League not found");
      }

      const league = leagueDoc.data() as League;

      if (
        league.participants.some((p: LeagueParticipant) => p.userId === userId)
      ) {
        throw new Error("User is already a participant in this league");
      }

      if (league.pendingRequests && league.pendingRequests.includes(userId)) {
        throw new Error("User already requested to join this league");
      }

      await leagueRef.update({
        pendingRequests: [...(league.pendingRequests || []), userId],
        updatedAt: new Date(),
      });

      return {
        ...league,
        pendingRequests: [...(league.pendingRequests || []), userId],
      };
    } catch (error) {
      throw new Error(
        "Error requesting to join league: " + (error as Error).message
      );
    }
  }

  private validateJoinRequest(
    league: League,
    userId: string,
    adminId: string
  ): void {
    const validations = [
      {
        condition: league.createdBy !== adminId,
        message: "Only the league creator can accept join requests",
      },
      {
        condition: !league.pendingRequests.includes(userId),
        message: "No join request found for this user",
      },
      {
        condition: league.participants.some(
          (p: LeagueParticipant) => p.userId === userId
        ),
        message: "User is already a participant in this league",
      },
      {
        condition: league.participants.length >= league.maxParticipants,
        message: `League has reached maximum capacity of ${league.maxParticipants} participants`,
      },
    ];

    for (const validation of validations) {
      if (validation.condition) {
        throw new Error(validation.message);
      }
    }
  }

  async acceptJoinRequest(
    leagueId: string,
    userId: string,
    adminId: string
  ): Promise<League> {
    try {
      const leagueRef = db.collection("leagues").doc(leagueId);
      const leagueDoc = await leagueRef.get();

      if (!leagueDoc.exists) {
        throw new Error("League not found");
      }

      const league = leagueDoc.data() as League;
      this.validateJoinRequest(league, userId, adminId);

      const updatedPending = league.pendingRequests.filter(
        (id) => id !== userId
      );
      const newParticipant: LeagueParticipant = {
        userId,
        lives: league.initialLives,
        isActive: true,
        totalPredictions: 0,
        correctPredictions: 0,
      };

      await leagueRef.update({
        pendingRequests: updatedPending,
        participants: [...league.participants, newParticipant],
        updatedAt: new Date(),
      });

      return {
        ...league,
        pendingRequests: updatedPending,
        participants: [...league.participants, newParticipant],
      };
    } catch (error) {
      throw new Error(
        "Error accepting join request: " + (error as Error).message
      );
    }
  }

  async denyJoinRequest(
    leagueId: string,
    userId: string,
    adminId: string
  ): Promise<League> {
    try {
      const leagueRef = db.collection("leagues").doc(leagueId);
      const leagueDoc = await leagueRef.get();
      if (!leagueDoc.exists) throw new Error("League not found");
      const league = leagueDoc.data() as League;
      if (league.createdBy !== adminId)
        throw new Error("Only the league creator can deny requests");
      if (!league.pendingRequests.includes(userId))
        throw new Error("User did not request to join");
      const updatedPending = league.pendingRequests.filter(
        (id) => id !== userId
      );
      await leagueRef.update({
        pendingRequests: updatedPending,
        updatedAt: new Date(),
      });
      return {
        ...league,
        pendingRequests: updatedPending,
      };
    } catch (error) {
      throw new Error(
        "Error denying join request: " + (error as Error).message
      );
    }
  }
}
