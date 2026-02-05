export enum RankingPeriod {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ALL_TIME = 'all_time',
}

export interface Ranking {
  id: string;
  userId: string;
  period: RankingPeriod;
  year: number;
  month: number | null;
  quarter: number | null;
  totalBounty: number;
  completedTasksCount?: number;
  rank: number;
  calculatedAt: Date;
}

export interface RankingCreateDTO {
  userId: string;
  period: RankingPeriod;
  year: number;
  month?: number | null;
  quarter?: number | null;
  totalBounty: number;
  completedTasksCount?: number;
  rank: number;
}

export interface RankingQueryDTO {
  period: RankingPeriod;
  year?: number;
  month?: number;
  quarter?: number;
  userId?: string;
  limit?: number;
}

export interface UserRankingInfo {
  userId: string;
  username: string;
  avatarId: string | null;
  avatarUrl?: string;
  totalBounty: number;
  completedTasksCount?: number;
  rank: number;
  period: RankingPeriod;
  year: number;
  month: number | null;
  quarter: number | null;
  user?: {
    id: string;
    username: string;
    email: string;
    avatarId: string | null;
    role: string;
    createdAt: Date;
    lastLogin: Date | null;
  };
}
