import { Pool } from 'pg';
import { logger } from '../config/logger.js';
import {
  Ranking,
  RankingCreateDTO,
  RankingPeriod,
  RankingQueryDTO,
  UserRankingInfo,
} from '../models/Ranking.js';
import { UserResponse } from '../models/User.js';
import { AppError } from '../utils/errors.js';
import { DatabaseOptimizationService } from './DatabaseOptimizationService.js';
export class RankingService {
  constructor(private pool: Pool) {}

  /**
   * Calculate and update rankings for a specific period
   */
  async calculateRankings(
    period: RankingPeriod,
    year: number,
    month?: number,
    quarter?: number
  ): Promise<Ranking[]> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Build the WHERE clause based on period
      let dateFilter = '';
      const params: any[] = [];
      let paramIndex = 1;

      if (period === RankingPeriod.MONTHLY) {
        if (!month) {
          throw new AppError('VALIDATION_ERROR', 'Month is required for monthly rankings', 400);
        }
        // Use actual_end_date if available, otherwise fall back to updated_at
        dateFilter = `
          AND EXTRACT(YEAR FROM COALESCE(t.actual_end_date, t.updated_at)) = $${paramIndex++}
          AND EXTRACT(MONTH FROM COALESCE(t.actual_end_date, t.updated_at)) = $${paramIndex++}
        `;
        params.push(year, month);
      } else if (period === RankingPeriod.QUARTERLY) {
        if (!quarter) {
          throw new AppError('VALIDATION_ERROR', 'Quarter is required for quarterly rankings', 400);
        }
        // Use actual_end_date if available, otherwise fall back to updated_at
        dateFilter = `
          AND EXTRACT(YEAR FROM COALESCE(t.actual_end_date, t.updated_at)) = $${paramIndex++}
          AND EXTRACT(QUARTER FROM COALESCE(t.actual_end_date, t.updated_at)) = $${paramIndex++}
        `;
        params.push(year, quarter);
      } else if (period === RankingPeriod.ALL_TIME) {
        // No date filter for all-time rankings
        dateFilter = '';
      }

      // Calculate total bounty and completed tasks count for each user (including users with 0 completed tasks)
      const bountyQuery = `
        SELECT
          u.id AS user_id,
          COALESCE(SUM(CASE
            WHEN t.status = 'completed'
              AND t.assignee_id IS NOT NULL
              ${dateFilter}
            THEN t.bounty_amount ELSE 0 END), 0) AS total_bounty,
          COALESCE(SUM(CASE
            WHEN t.status = 'completed'
              AND t.assignee_id IS NOT NULL
              ${dateFilter}
            THEN 1 ELSE 0 END), 0) AS completed_tasks_count
        FROM users u
        LEFT JOIN tasks t ON t.assignee_id = u.id
        GROUP BY u.id
        ORDER BY total_bounty DESC, u.id ASC
      `;

      const bountyResult = await client.query(bountyQuery, params);

      // Delete existing rankings for this period
      const deleteQuery = `
        DELETE FROM rankings
        WHERE period = $1
          AND year = $2
          ${month ? 'AND month = $3' : ''}
          ${quarter ? 'AND quarter = $3' : ''}
      `;
      const deleteParams = [period, year];
      if (month) deleteParams.push(month);
      if (quarter) deleteParams.push(quarter);
      
      await client.query(deleteQuery, deleteParams);

      // Insert new rankings with proper rank handling (same bounty = same rank)
      const rankings: Ranking[] = [];
      let currentRank = 1;
      let previousBounty: number | null = null;
      
      for (let i = 0; i < bountyResult.rows.length; i++) {
        const row = bountyResult.rows[i];
        const currentBounty = parseFloat(row.total_bounty);
        
        // If bounty is different from previous, update rank to current position
        if (previousBounty !== null && currentBounty !== previousBounty) {
          currentRank = i + 1;
        }
        
        const insertQuery = `
          INSERT INTO rankings (user_id, period, year, month, quarter, total_bounty, completed_tasks_count, rank)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING *
        `;
        const insertParams = [
          row.user_id,
          period,
          year,
          month || null,
          quarter || null,
          row.total_bounty,
          row.completed_tasks_count,
          currentRank,
        ];

        const result = await client.query(insertQuery, insertParams);
        rankings.push(this.mapRowToRanking(result.rows[0]));
        
        previousBounty = currentBounty;
      }

      await client.query('COMMIT');
      return rankings;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get rankings for a specific period
   */
  async getRankings(query: RankingQueryDTO): Promise<UserRankingInfo[]> {
    const { period, year, month, quarter, userId, limit } = query;

    let whereClause = 'WHERE r.period = $1';
    const params: any[] = [period];
    let paramIndex = 2;

    if (year) {
      whereClause += ` AND r.year = $${paramIndex++}`;
      params.push(year);
    }

    if (month) {
      whereClause += ` AND r.month = $${paramIndex++}`;
      params.push(month);
    }

    if (quarter) {
      whereClause += ` AND r.quarter = $${paramIndex++}`;
      params.push(quarter);
    }

    if (userId) {
      whereClause += ` AND r.user_id = $${paramIndex++}`;
      params.push(userId);
    }

    let limitClause = '';
    if (limit) {
      limitClause = `LIMIT $${paramIndex++}`;
      params.push(limit);
    }

    const query_text = `
      SELECT 
        r.user_id,
        r.total_bounty,
        r.completed_tasks_count,
        r.rank,
        r.period,
        r.year,
        r.month,
        r.quarter,
        u.id as "user.id",
        u.username as "user.username",
        u.email as "user.email",
        u.avatar_id as "user.avatarId",
        u.role as "user.role",
        u.created_at as "user.createdAt",
        u.last_login as "user.lastLogin",
        a.image_url as "user.avatarUrl"
      FROM rankings r
      JOIN users u ON r.user_id = u.id
      LEFT JOIN avatars a ON u.avatar_id = a.id
      ${whereClause}
      ORDER BY r.rank ASC
      ${limitClause}
    `;

    const result = await this.pool.query(query_text, params);
    return result.rows.map((row) => this.mapRowToUserRankingInfo(row));
  }

  /**
   * Get user's ranking for a specific period
   */
  async getUserRanking(
    userId: string,
    period: RankingPeriod,
    year?: number,
    month?: number,
    quarter?: number
  ): Promise<UserRankingInfo | null> {
    const rankings = await this.getRankings({
      period,
      year,
      month,
      quarter,
      userId,
      limit: 1,
    });

    return rankings.length > 0 ? rankings[0] : null;
  }

  /**
   * Get current month rankings
   */
  async getCurrentMonthRankings(limit?: number): Promise<UserRankingInfo[]> {
    const now = new Date();
    return this.getRankings({
      period: RankingPeriod.MONTHLY,
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      limit,
    });
  }

  /**
   * Get current quarter rankings
   */
  async getCurrentQuarterRankings(limit?: number): Promise<UserRankingInfo[]> {
    const now = new Date();
    const quarter = Math.floor(now.getMonth() / 3) + 1;
    return this.getRankings({
      period: RankingPeriod.QUARTERLY,
      year: now.getFullYear(),
      quarter,
      limit,
    });
  }

  /**
   * Get all-time rankings
   */
  async getAllTimeRankings(limit?: number): Promise<UserRankingInfo[]> {
    const now = new Date();
    // 保持与计算时使用的年份一致，避免跨年份的历史全量记录重复返回
    return this.getRankings({
      period: RankingPeriod.ALL_TIME,
      year: now.getFullYear(),
      limit,
    });
  }

  /**
   * Calculate rankings for current month
   */
  async calculateCurrentMonthRankings(): Promise<Ranking[]> {
    const now = new Date();
    const rankings = await this.calculateRankings(
      RankingPeriod.MONTHLY,
      now.getFullYear(),
      now.getMonth() + 1
    );
    
    // Refresh materialized view for performance
    try {
      await DatabaseOptimizationService.refreshCurrentMonthRankings();
    } catch (error) {
      logger.warn('Failed to refresh materialized view:', error);
    }
    
    return rankings;
  }

  /**
   * Calculate rankings for current quarter
   */
  async calculateCurrentQuarterRankings(): Promise<Ranking[]> {
    const now = new Date();
    const quarter = Math.floor(now.getMonth() / 3) + 1;
    return this.calculateRankings(
      RankingPeriod.QUARTERLY,
      now.getFullYear(),
      undefined,
      quarter
    );
  }

  /**
   * Calculate all-time rankings
   */
  async calculateAllTimeRankings(): Promise<Ranking[]> {
    const now = new Date();
    return this.calculateRankings(
      RankingPeriod.ALL_TIME,
      now.getFullYear()
    );
  }

  /**
   * Update all rankings (monthly, quarterly, all-time)
   */
  async updateAllRankings(): Promise<{
    monthly: Ranking[];
    quarterly: Ranking[];
    allTime: Ranking[];
  }> {
    const monthly = await this.calculateCurrentMonthRankings();
    const quarterly = await this.calculateCurrentQuarterRankings();
    const allTime = await this.calculateAllTimeRankings();

    return { monthly, quarterly, allTime };
  }

  private mapRowToRanking(row: any): Ranking {
    return {
      id: row.id,
      userId: row.user_id,
      period: row.period,
      year: row.year,
      month: row.month,
      quarter: row.quarter,
      totalBounty: parseFloat(row.total_bounty),
      completedTasksCount: row.completed_tasks_count ? parseInt(row.completed_tasks_count) : 0,
      rank: row.rank,
      calculatedAt: row.calculated_at,
    };
  }

  private mapRowToUserRankingInfo(row: any): UserRankingInfo {
    const user: UserResponse | undefined = row['user.id']
      ? {
          id: row['user.id'],
          username: row['user.username'],
          email: row['user.email'],
          avatarId: row['user.avatarId'],
          avatarUrl: row['user.avatarUrl'],
          role: row['user.role'],
          createdAt: row['user.createdAt'],
          lastLogin: row['user.lastLogin'],
        }
      : undefined;

    return {
      userId: row.user_id,
      username: row['user.username'] ?? row.username,
      avatarId: row['user.avatarId'] ?? row.avatar_id,
      avatarUrl: row['user.avatarUrl'],
      totalBounty: parseFloat(row.total_bounty),
      completedTasksCount: row.completed_tasks_count ? parseInt(row.completed_tasks_count) : 0,
      rank: row.rank,
      period: row.period,
      year: row.year,
      month: row.month,
      quarter: row.quarter,
      user,
    };
  }
}
