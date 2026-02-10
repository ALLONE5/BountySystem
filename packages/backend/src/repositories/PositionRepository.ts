import { PoolClient } from 'pg';
import { BaseRepository, IRepository } from './BaseRepository.js';
import { Position, PositionApplication, ApplicationStatus } from '../models/Position.js';
import { Validator } from '../utils/Validator.js';
import { logger } from '../config/logger.js';

/**
 * Position Repository Interface
 * Extends base repository with position-specific queries
 */
export interface IPositionRepository extends IRepository<Position> {
  findByTask(taskId: string): Promise<Position[]>;
  findByUser(userId: string): Promise<Position[]>;
  findWithApplications(positionId: string): Promise<Position & { applications: PositionApplication[] }>;
  updateRanking(positionId: string, ranking: number): Promise<Position>;
}

/**
 * Position Repository
 * Handles all database operations for positions
 */
export class PositionRepository extends BaseRepository<Position> implements IPositionRepository {
  constructor() {
    super('positions');
  }

  /**
   * Get all column names for the positions table
   */
  protected getColumns(): string[] {
    return [
      'id',
      'name',
      'description',
      'required_skills',
      'created_at',
      'updated_at'
    ];
  }

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
   * Validate position data before create/update
   */
  protected validateData(data: Partial<Position>, isUpdate: boolean = false): void {
    if (!isUpdate) {
      // Required fields for creation
      Validator.required(data.name, 'name');
    }

    // Validate name length if provided
    if (data.name) {
      Validator.minLength(data.name, 1, 'name');
      Validator.maxLength(data.name, 255, 'name');
    }

    // Validate required_skills is an array if provided
    if (data.requiredSkills !== undefined && !Array.isArray(data.requiredSkills)) {
      throw new Error('requiredSkills must be an array');
    }
  }

  /**
   * Find positions by task
   * Note: In the current schema, tasks reference positions via position_id,
   * not the other way around. This method finds the position referenced by a task.
   */
  async findByTask(taskId: string): Promise<Position[]> {
    try {
      Validator.required(taskId, 'taskId');

      const query = `
        SELECT DISTINCT ${this.getColumns().map(col => `p.${col}`).join(', ')}
        FROM ${this.tableName} p
        INNER JOIN tasks t ON t.position_id = p.id
        WHERE t.id = $1
      `;

      const rows = await this.executeQuery<any>(query, [taskId]);
      return rows.map(row => this.mapRowToModel(row));
    } catch (error) {
      logger.error('Error finding positions by task', { 
        error: error instanceof Error ? error.message : String(error),
        taskId 
      });
      throw error;
    }
  }

  /**
   * Find positions by user
   * Returns positions that a user has been granted
   */
  async findByUser(userId: string): Promise<Position[]> {
    try {
      Validator.required(userId, 'userId');

      const query = `
        SELECT ${this.getColumns().map(col => `p.${col}`).join(', ')}
        FROM ${this.tableName} p
        INNER JOIN user_positions up ON up.position_id = p.id
        WHERE up.user_id = $1
        ORDER BY up.granted_at DESC
      `;

      const rows = await this.executeQuery<any>(query, [userId]);
      return rows.map(row => this.mapRowToModel(row));
    } catch (error) {
      logger.error('Error finding positions by user', { 
        error: error instanceof Error ? error.message : String(error),
        userId 
      });
      throw error;
    }
  }

  /**
   * Find position with applications
   */
  async findWithApplications(positionId: string): Promise<Position & { applications: PositionApplication[] }> {
    try {
      Validator.required(positionId, 'positionId');

      const position = await this.findById(positionId);
      
      if (!position) {
        throw new Error('Position not found');
      }

      // Fetch applications for this position
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

      const applicationRows = await this.executeQuery<any>(applicationsQuery, [positionId]);
      
      const applications: PositionApplication[] = applicationRows.map(row => ({
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

      return {
        ...position,
        applications
      };
    } catch (error) {
      logger.error('Error finding position with applications', { 
        error: error instanceof Error ? error.message : String(error),
        positionId 
      });
      throw error;
    }
  }

  /**
   * Update position ranking
   * Note: The current schema doesn't have a ranking field on positions.
   * This is a placeholder that does nothing until the schema is extended.
   */
  async updateRanking(positionId: string, ranking: number): Promise<Position> {
    try {
      Validator.required(positionId, 'positionId');
      Validator.required(ranking, 'ranking');

      if (ranking < 0) {
        throw new Error('Ranking must be non-negative');
      }

      // Verify position exists
      const position = await this.findById(positionId);
      
      if (!position) {
        throw new Error('Position not found');
      }

      // Current schema doesn't have a ranking field on positions
      logger.warn('updateRanking: positions table does not have a ranking column', { positionId });
      
      // Return the position unchanged as a placeholder
      return position;
    } catch (error) {
      logger.error('Error updating position ranking', { 
        error: error instanceof Error ? error.message : String(error),
        positionId,
        ranking 
      });
      throw error;
    }
  }
}
