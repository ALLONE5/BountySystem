import { Pool } from 'pg';
import { logger } from '../config/logger.js';
import {
  BountyTransaction,
  BountyTransactionWithDetails,
  TransactionType,
} from '../models/BountyTransaction.js';
import { AppError } from '../utils/errors.js';

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

/**
 * Service for managing bounty transaction history
 * Follows the pattern established by RankingService
 */
export class BountyHistoryService {
  constructor(private pool: Pool) {}

  /**
   * Get paginated transaction history for a user
   * Returns transactions where user is either sender or receiver
   */
  async getUserTransactionHistory(
    userId: string,
    options: TransactionHistoryQueryOptions
  ): Promise<TransactionHistoryResponse> {
    const { page, limit, type } = options;

    // Validate pagination parameters
    if (page < 1) {
      throw new AppError('VALIDATION_ERROR', 'Page must be greater than 0', 400);
    }
    if (limit < 1 || limit > 100) {
      throw new AppError('VALIDATION_ERROR', 'Limit must be between 1 and 100', 400);
    }

    // Calculate offset
    const offset = (page - 1) * limit;

    // Build WHERE clause
    let whereClause = '(bt.from_user_id = $1 OR bt.to_user_id = $1)';
    const params: any[] = [userId];
    let paramIndex = 2;

    // Add type filter if provided
    if (type) {
      whereClause += ` AND bt.type = $${paramIndex++}`;
      params.push(type);
    }

    // Add pagination parameters
    params.push(limit, offset);

    // Main query with pagination and total count
    const query = `
      SELECT 
        bt.id,
        bt.task_id,
        bt.from_user_id,
        bt.to_user_id,
        bt.amount,
        bt.type,
        bt.description,
        bt.created_at,
        t.name as task_name,
        COUNT(*) OVER() as total_count
      FROM bounty_transactions bt
      LEFT JOIN tasks t ON bt.task_id = t.id
      WHERE ${whereClause}
      ORDER BY bt.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    try {
      const result = await this.pool.query(query, params);

      // Get total count from first row (window function)
      const totalCount = result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0;
      const totalPages = Math.ceil(totalCount / limit);

      // Map rows to BountyTransactionWithDetails
      const transactions = result.rows.map((row) => this.mapRowToTransactionWithDetails(row));

      // Get summary statistics
      const summary = await this.getUserBountySummary(userId, type);

      return {
        transactions,
        pagination: {
          currentPage: page,
          pageSize: limit,
          totalCount,
          totalPages,
        },
        summary,
      };
    } catch (error) {
      logger.error('Error fetching transaction history:', error);
      throw new AppError(
        'DATABASE_ERROR',
        'Failed to fetch transaction history',
        500
      );
    }
  }

  /**
   * Get summary statistics for a user's bounty transactions
   * Optionally filtered by transaction type
   */
  async getUserBountySummary(
    userId: string,
    transactionType?: TransactionType
  ): Promise<BountySummary> {
    // Build WHERE clause
    let whereClause = '(from_user_id = $1 OR to_user_id = $1)';
    const params: any[] = [userId];

    // Add type filter if provided
    if (transactionType) {
      whereClause += ' AND type = $2';
      params.push(transactionType);
    }

    const query = `
      SELECT 
        COALESCE(SUM(CASE WHEN to_user_id = $1 THEN amount ELSE 0 END), 0) as total_earned,
        COALESCE(SUM(CASE WHEN from_user_id = $1 THEN amount ELSE 0 END), 0) as total_spent,
        COUNT(*) as transaction_count
      FROM bounty_transactions
      WHERE ${whereClause}
    `;

    try {
      const result = await this.pool.query(query, params);
      const row = result.rows[0];

      const totalEarned = parseFloat(row.total_earned);
      const totalSpent = parseFloat(row.total_spent);

      return {
        totalEarned,
        totalSpent,
        netBalance: totalEarned - totalSpent,
        transactionCount: parseInt(row.transaction_count),
      };
    } catch (error) {
      logger.error('Error calculating bounty summary:', error);
      throw new AppError(
        'DATABASE_ERROR',
        'Failed to calculate bounty summary',
        500
      );
    }
  }

  /**
   * Map database row to BountyTransactionWithDetails
   */
  private mapRowToTransactionWithDetails(row: any): BountyTransactionWithDetails {
    return {
      id: row.id,
      taskId: row.task_id,
      fromUserId: row.from_user_id,
      toUserId: row.to_user_id,
      amount: parseFloat(row.amount),
      type: row.type as TransactionType,
      description: row.description,
      createdAt: row.created_at,
      taskName: row.task_name || 'Unknown Task',
      fromUsername: null, // Will be populated if needed in future
      toUsername: '', // Will be populated if needed in future
    };
  }
}
