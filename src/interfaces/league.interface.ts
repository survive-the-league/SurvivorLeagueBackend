import { CreateLeagueDto } from '../dto/league.dto';
import { LeagueParticipant } from './league-participant.interface';
import { DocumentReference } from 'firebase-admin/firestore';

export interface League extends CreateLeagueDto {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    participants: LeagueParticipant[];
    pendingRequests: string[];
    users?: DocumentReference[];
    status: 'active' | 'inactive' | 'completed';
    initialLives: number;
    currentRound: number;
    totalRounds: number;
} 
