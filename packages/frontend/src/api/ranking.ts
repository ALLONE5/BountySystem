import { createApiMethod, createApiMethodWithParams } from './createApiClient';
import { Ranking } from '../types';

export interface RankingQueryParams {
  period: 'monthly' | 'quarterly' | 'all_time';
  year?: number;
  month?: number;
  quarter?: number;
  limit?: number;
}

export const rankingApi = {
  // 获取排名列表
  getRankings: async (params?: RankingQueryParams): Promise<Ranking[]> => {
    return createApiMethod<Ranking[]>('get', '/rankings')(params);
  },

  // 获取当前月度排名
  getCurrentMonthRankings: createApiMethod<Ranking[]>('get', '/rankings/current/monthly'),

  // 获取当前季度排名
  getCurrentQuarterRankings: createApiMethod<Ranking[]>('get', '/rankings/current/quarterly'),

  // 获取历史总排名
  getAllTimeRankings: createApiMethod<Ranking[]>('get', '/rankings/all-time'),

  // 获取用户排名
  getUserRanking: async (userId: string, params: RankingQueryParams): Promise<Ranking | null> => {
    return createApiMethodWithParams<Ranking | null, string>('get', (id) => `/rankings/user/${id}`)(userId, params);
  },

  // 获取当前用户排名
  getMyRanking: async (userId: string, params: RankingQueryParams): Promise<Ranking | null> => {
    return createApiMethodWithParams<Ranking | null, string>('get', (id) => `/rankings/user/${id}`)(userId, params);
  },
};
