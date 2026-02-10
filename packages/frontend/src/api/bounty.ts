import { createApiMethod, createApiMethodWithParams } from './createApiClient';
import apiClient from './client';
import { TransactionType } from '../types';

export interface BountyAlgorithm {
  id: string;
  version: string;
  baseAmount: number;
  urgencyWeight: number;
  importanceWeight: number;
  durationWeight: number;
  remainingDaysWeight?: number;
  formula: string;
  effectiveFrom: Date;
  createdBy: string;
  createdAt: Date;
}

export interface BountyAlgorithmCreateDTO {
  version: string;
  baseAmount: number;
  urgencyWeight: number;
  importanceWeight: number;
  durationWeight: number;
  remainingDaysWeight?: number;
  formula: string;
  effectiveFrom?: Date;
}

/**
 * Query options for fetching transaction history
 */
export interface TransactionHistoryQueryOptions {
  page: number;           // Current page (1-indexed)
  limit: number;          // Items per page (default: 20)
  type?: TransactionType; // Optional filter by transaction type
}

/**
 * Summary statistics for user bounty transactions
 */
export interface BountySummary {
  totalEarned: number;   // Sum of all incoming transactions
  totalSpent: number;    // Sum of all outgoing transactions
  netBalance: number;    // totalEarned - totalSpent
  transactionCount: number;
}

/**
 * Bounty transaction with task details
 */
export interface BountyTransactionWithDetails {
  id: string;
  taskId: string;
  fromUserId: string | null;
  toUserId: string;
  amount: number;
  type: TransactionType;
  description: string | null;
  createdAt: Date;
  taskName: string;
  fromUsername: string | null;
  toUsername: string;
}

/**
 * Response structure for transaction history queries
 */
export interface TransactionHistoryResponse {
  transactions: BountyTransactionWithDetails[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
  summary: BountySummary;
}

export const bountyApi = {
  // 获取所有赏金算法
  getAllAlgorithms: createApiMethod<BountyAlgorithm[]>('get', 'bounty/algorithms'),

  // 获取当前生效的算法
  getCurrentAlgorithm: createApiMethod<BountyAlgorithm>('get', 'bounty/algorithms/current'),

  // 获取指定版本的算法
  getAlgorithmByVersion: createApiMethodWithParams<BountyAlgorithm, string>('get', (version) => `bounty/algorithms/${version}`),

  // 创建新的赏金算法
  createAlgorithm: createApiMethod<BountyAlgorithm>('post', 'bounty/algorithms'),

  /**
   * Get paginated transaction history for a user
   * 
   * @param userId - The user ID to fetch transactions for
   * @param page - Current page (1-indexed, default: 1)
   * @param limit - Items per page (default: 20)
   * @param type - Optional filter by transaction type
   * @returns Promise with transaction history response
   */
  getUserTransactionHistory: async (
    userId: string,
    page: number = 1,
    limit: number = 20,
    type?: TransactionType
  ): Promise<TransactionHistoryResponse> => {
    // Build query parameters
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    // Add type filter if provided and not 'all'
    if (type && type !== 'all' as any) {
      params.append('type', type);
    }
    
    // Make API request
    const response = await apiClient.get(
      `/bounty-history/${userId}?${params.toString()}`
    );
    
    return response.data;
  },
};
