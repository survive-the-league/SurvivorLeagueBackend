export interface Match {
    id: string;
    homeTeam: string;
    awayTeam: string;
    date: string;
    result?: string;
    status: 'pending' | 'finished';
  }