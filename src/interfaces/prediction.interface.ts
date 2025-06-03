export interface Prediction {
    id: string;
    userId: string;
    matchId: string;
    prediction: string;
    matchday: number;
    status: 'pending' | 'correct' | 'incorrect';
  }