export interface User {
  id: string;
  email: string;
  displayName?: string;
  lives: number;
  predictions: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  result?: string;
  status: 'pending' | 'finished';
}

export interface Prediction {
  id: string;
  userId: string;
  matchId: string;
  prediction: string;
  matchday: number;
  status: 'pending' | 'correct' | 'incorrect';
}

export interface Matchday {
  id: string;
  number: number;
  startDate: string;
  endDate: string;
  status: 'pending' | 'active' | 'finished';
} 