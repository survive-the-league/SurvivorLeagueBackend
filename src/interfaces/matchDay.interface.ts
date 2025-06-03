export interface Matchday {
  id: string;
  number: number;
  startDate: string;
  endDate: string;
  status: 'pending' | 'active' | 'finished';
} 