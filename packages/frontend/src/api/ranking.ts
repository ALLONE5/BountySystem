import { createApiMethod, createApiMethodWithParams } from './createApiClient';
import { Ranking } from '../types';
import { logger } from '../utils/logger';

export interface RankingQueryParams {
  period: 'monthly' | 'quarterly' | 'all_time';
  year?: number;
  month?: number;
  quarter?: number;
  limit?: number;
}

// 获取当前用户ID的辅助函数
const getCurrentUserId = (): string | null => {
  try {
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      const parsed = JSON.parse(authStorage);
      return parsed?.state?.user?.id || null;
    }
  } catch (error) {
    logger.warn('Failed to get current user ID:', error);
  }
  return null;
};

export const rankingApi = {
  // 获取排名列表
  getRankings: async (params?: RankingQueryParams): Promise<{ rankings: Ranking[], myRanking: Ranking | null }> => {
    const rankings = await createApiMethod<Ranking[]>('get', '/rankings')(params);
    
    // 获取当前用户ID
    const currentUserId = getCurrentUserId();
    
    // 在排行榜数据中查找当前用户的排名
    let myRanking: Ranking | null = null;
    if (currentUserId && rankings && rankings.length > 0) {
      myRanking = rankings.find(ranking => ranking.userId === currentUserId) || null;
    }
    
    return {
      rankings: rankings || [],
      myRanking
    };
  },

  // 获取当前月度排名
  getCurrentMonthRankings: createApiMethod<Ranking[]>('get', '/rankings/current/monthly'),

  // 获取当前季度排名
  getCurrentQuarterRankings: createApiMethod<Ranking[]>('get', '/rankings/current/quarterly'),

  // 获取历史总排名
  getAllTimeRankings: createApiMethod<Ranking[]>('get', '/rankings/all-time'),

  // 获取用户排名
  getUserRanking: async (userId: string, params: RankingQueryParams): Promise<Ranking | null> => {
    try {
      return await createApiMethodWithParams<Ranking | null, string>('get', (id) => `/rankings/user/${id}`)(userId, { 
        ...params,
        headers: { 'X-Skip-Error-Message': '404' }
      });
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  // 获取当前用户排名
  getMyRanking: async (userId: string, params: RankingQueryParams): Promise<Ranking | null> => {
    try {
      return await createApiMethodWithParams<Ranking | null, string>('get', (id) => `/rankings/user/${id}`)(userId, { 
        ...params,
        headers: { 'X-Skip-Error-Message': '404' }
      });
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },
};
