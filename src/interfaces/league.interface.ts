import { CreateLeagueDto } from '../dto/league.dto';
import { LeagueParticipant } from './league-participant.interface';

export interface League extends CreateLeagueDto {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    participants: LeagueParticipant[];
    status: 'active' | 'inactive' | 'completed';
    initialLives: number;
    currentRound: number;
    totalRounds: number;
} 
