export interface LeagueParticipant {
    userId: string;
    lives: number;
    isActive: boolean;
    eliminatedAt?: Date;
    lastPredictionDate?: Date;
    totalPredictions: number;
    correctPredictions: number;
} 