import { PoolClient } from 'pg';
import { Ranking, RankingPeriod, UserRankingInfo } from '../models/Ranking.js';
import { QueryBuilder } from '../utils/QueryBuilder.js';
import { Validator } from '../utils/Validator.js';
import { pool } from '../config/database.js';
import { logger } from '../config/logger.js';

export class RankingRepository {
  private queryBuilder: QueryBuilder;
  private validator: Validator;

  constructor() {
    this.queryBuilder = new QueryBuilder();
    this.validator = new Validator();
  }

  protected mapRowToModel(row: any): Ranking {
    return {
      id: row.id,
      userId: row.user_id,
      period: row.period,
      year: row.year,
      month: row.month,
      quarter: row.quarter,
      totalBounty: parseFloat(row.total_bounty),
      completedTasksCount: parseInt(row.completed_tasks_count || '0'),
      rank: row.rank,
      calculatedAt: row.calculated_at
    };
  }

  /**
   * Execute a custom query with connection management
   */
  protected async executeQuery<R = any>(
    query: string,
    params?: any[],
    client?: PoolClient
  ): Promise<R[]> {
    const shouldReleaseClient = !client;
    let localClient = client;
    
    try {
      if (!localClient) {
        localClient = await pool.connect();
      }

      const result = await localClient.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error('Error executing query on rankings', { 
        error: error instanceof Error ? error.message : 'Unknown error', 
        query 
      });
      throw error;
    } finally {
      if (shouldReleaseClient && localClient) {
        localClient.release();
      }
    }
  }

  /**
   * Get rankings with user information
   */
  async findRankingsWithUsers(
    period: RankingPeriod,
    year?: number,
    month?: number,
    quarter?: number,
    userId?: string,
    limit?: number,
    client?: PoolClient
  ): Promise<UserRankingInfo[]> {
    const queryBuilder = new QueryBuilder()
      .select(
        'r.user_id',
        'r.total_bounty',
        'r.completed_tasks_count',
        'r.rank',
        'r.period',
        'r.year',
        'r.month',
        'r.quarter',
        'u.id as "user.id"',
        'u.username as "user.username"',
        'u.email as "user.email"',
        'u.avatar_id as "user.avatarId"',
        'u.role as "user.role"',
        'u.created_at as "user.createdAt"',
        'u.last_login as "user.lastLogin"',
        'a.image_url as "user.avatarUrl"'
      )
      .from('rankings r')
      .innerJoin('users u', 'r.user_id = u.id')
      .leftJoin('avatars a', 'u.avatar_id = a.id')
      .where('r.period = $1');

    const params: any[] = [period];
    let paramIndex = 2;

    if (year) {
      queryBuilder.andWhere(`r.year = $${paramIndex++}`);
      params.push(year);
    }

    if (month) {
      queryBuilder.andWhere(`r.month = $${paramIndex++}`);
      params.push(month);
    }

    if (quarter) {
      queryBuilder.andWhere(`r.quarter = $${paramIndex++}`);
      params.push(quarter);
    }

    if (userId) {
      queryBuilder.andWhere(`r.user_id = $${paramIndex++}`);
      params.push(userId);
    }

    queryBuilder.orderBy('r.rank', 'ASC');

    if (limit) {
      queryBuilder.limit(limit);
    }

    const query = queryBuilder.build();
    const rows = await this.executeQuery(query, params, client);
    
    return rows.map(row => this.mapRowToUserRankingInfo(row));
  }

  /**
   * Batch insert rankings
   */
  async batchInsert(rankings: Partial<Ranking>[], client?: PoolClient): Promise<Ranking[]> {
    if (rankings.length === 0) return [];

    const values: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    rankings.forEach(ranking => {
      values.push(`($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++})`);
      params.push(
        ranking.userId,
        ranking.period,
        ranking.year,
        ranking.month || null,
        ranking.quarter || null,
        ranking.totalBounty,
        ranking.completedTasksCount,
        ranking.rank
      );
    });

    const query = `
      INSERT INTO rankings (user_id, period, year, month, quarter, total_bounty, completed_tasks_count, rank)
      VALUES ${values.join(', ')}
      RETURNING *
    `;

    const rows = await this.executeQuery(query, params, client);
    return rows.map(row => this.mapRowToModel(row));
  }

  private mapRowToUserRankingInfo(row: any): UserRankingInfo {
    return {
      userId: row.user_id,
      username: row['user.username'],
      avatarId: row['user.avatarId'],
      avatarUrl: row['user.avatarUrl'],
      totalBounty: parseFloat(row.total_bounty),
      completedTasksCount: parseInt(row.completed_tasks_count || '0'),
      rank: row.rank,
      period: row.period,
      year: row.year,
      month: row.month,
      quarter: row.quarter,
      user: row['user.id'] ? {
        id: row['user.id'],
        username: row['user.username'],
        email: row['user.email'],
        avatarId: row['user.avatarId'],
        role: row['user.role'],
        createdAt: row['user.createdAt'],
        lastLogin: row['user.lastLogin']
      } : undefined
    };
  }
}