import { PoolClient } from 'pg';
import { ImprovedBaseRepository } from './ImprovedBaseRepository.js';
import { Position, PositionApplication, ApplicationStatus } from '../models/Position.js';
import { Validator } from '../utils/Validator.js';
import { logger } from '../config/logger.js';

/**
 * Position Repository Interface
 * Extends base repository with position-specific queries
 */
export interface IPositionRepository {
  findById(id: string): Promise<Position | null>;
  findAll(filters?: Record<string, any>): Promise<Position[]>;
  create(data: Partial<Position>): Promise<Position>;
  update(id: string, data: Partial<Position>): Promise<Position | null>;
  delete(id: string): Promise<boolean>;
  findByTask(taskId: string): Promise<Position[]>;
  findByUser(userId: string): Promise<Position[]>;
  findWithApplications(positionId: string): Promise<Position & { applications: PositionApplication[] }>;
  updateRanking(positionId: string, ranking: number): Promise<Position>;
}

/**
 * Position Repository
 * Handles all database operations for positions
 */
export class PositionRepository extends ImprovedBaseRepository<Position> implements IPositionRepository {
  protected tableName = 'positions';

  /**
   * Transform database row to Position model
   */
  protected mapRowToModel(row: any): Position {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      requiredSkills: row.required_skills || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  /**
   * Find positions by task
   */
  async findByTask(taskId: string): Promise<Position[]> {
    return this.executeQuery('findByTask', async () => {
      Validator.required(taskId, 'taskId');

      const query = `
        SELECT DISTINCT p.*
        FROM ${this.tableName} p
        INNER JOIN tasks t ON t.position_id = p.id
        WHERE t.id = $1
      `;

      const result = await this.pool.query(query, [taskId]);
      return result.rows.map(row => this.mapRowToModel(row));
    }, { taskId });
  }

  /**
   * Find positions by user
   */
  async findByUser(userId: string): Promise<Position[]> {
    return this.executeQuery('findByUser', async () => {
      Validator.required(userId, 'userId');

      const query = `
        SELECT p.*
        FROM ${this.tableName} p
        INNER JOIN user_positions up ON up.position_id = p.id
        WHERE up.user_id = $1
        ORDER BY up.granted_at DESC
      `;

      const result = await this.pool.query(query, [userId]);
      return result.rows.map(row => this.mapRowToModel(row));
    }, { userId });
  }

  /**
   * Find position with applications
   */
  async findWithApplications(positionId: string): Promise<Position & { applications: PositionApplication[] }> {
    return this.executeQuery('findWithApplications', async () => {
      Validator.required(positionId, 'positionId');

      const position = await this.findById(positionId);
      if (!position) {
        throw new Error('Position not found');
      }

      const applicationsQuery = `
        SELECT 
          pa.id,
          pa.user_id,
          pa.position_id,
          pa.reason,
          pa.status,
          pa.reviewed_by,
          pa.review_comment,
          pa.created_at,
          pa.reviewed_at,
          pa.updated_at
        FROM position_applications pa
        WHERE pa.position_id = $1
        ORDER BY pa.created_at DESC
      `;

      const result = await this.pool.query(applicationsQuery, [positionId]);
      const applications: PositionApplication[] = result.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        positionId: row.position_id,
        reason: row.reason,
        status: row.status as ApplicationStatus,
        reviewedBy: row.reviewed_by,
        reviewComment: row.review_comment,
        createdAt: row.created_at,
        reviewedAt: row.reviewed_at,
        updatedAt: row.updated_at
      }));

      return { ...position, applications };
    }, { positionId });
  }

  /**
   * Update position ranking
   */
  async updateRanking(positionId: string, ranking: number): Promise<Position> {
    return this.executeQuery('updateRanking', async () => {
      Validator.required(positionId, 'positionId');
      Validator.required(ranking, 'ranking');

      if (ranking < 0) {
        throw new Error('Ranking must be non-negative');
      }

      const position = await this.findById(positionId);
      if (!position) {
        throw new Error('Position not found');
      }

      // Current schema doesn't have a ranking field on positions
      logger.warn('updateRanking: positions table does not have a ranking column', { positionId });
      return position;
    }, { positionId, ranking });
  }
}
