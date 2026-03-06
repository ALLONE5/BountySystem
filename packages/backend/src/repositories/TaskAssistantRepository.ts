import { PoolClient } from 'pg';
import { BaseRepository } from './BaseRepository.js';
import { TaskAssistant } from '../models/TaskAssistant.js';
import { QueryBuilder } from '../utils/QueryBuilder.js';
import { Validator } from '../utils/Validator.js';

export class TaskAssistantRepository extends BaseRepository<TaskAssistant> {
  constructor() {
    super('task_assistants');
  }

  protected getColumns(): string[] {
    return [
      'id',
      'task_id',
      'user_id',
      'allocation_type',
      'allocation_value',
      'added_at'
    ];
  }

  protected mapRowToModel(row: any): TaskAssistant {
    return {
      id: row.id,
      taskId: row.task_id,
      userId: row.user_id,
      allocationType: row.allocation_type,
      allocationValue: parseFloat(row.allocation_value),
      addedAt: row.added_at,
      user: row.username ? {
        id: row.user_id,
        username: row.username,
        email: row.email,
        avatarUrl: row.avatar_url
      } : undefined
    };
  }

  protected validateData(data: Partial<TaskAssistant>, isUpdate?: boolean): void {
    if (!isUpdate) {
      Validator.required(data.taskId, 'taskId');
      Validator.required(data.userId, 'userId');
      Validator.required(data.allocationType, 'allocationType');
      Validator.required(data.allocationValue, 'allocationValue');
    }

    if (data.allocationType !== undefined) {
      const validTypes = ['percentage', 'fixed'];
      if (!validTypes.includes(data.allocationType)) {
        throw new Error(`Invalid allocation type. Must be one of: ${validTypes.join(', ')}`);
      }
    }

    if (data.allocationValue !== undefined) {
      Validator.positive(data.allocationValue, 'allocationValue');
      
      if (data.allocationType === 'percentage' && data.allocationValue > 100) {
        throw new Error('Percentage allocation cannot exceed 100%');
      }
    }
  }

  /**
   * Get assistants by task ID with user information
   */
  async findByTaskId(taskId: string, client?: PoolClient): Promise<TaskAssistant[]> {
    const query = new QueryBuilder()
      .select(
        'ta.id',
        'ta.task_id',
        'ta.user_id',
        'ta.allocation_type',
        'ta.allocation_value',
        'ta.added_at',
        'u.username',
        'u.email',
        'a.image_url as avatar_url'
      )
      .from('task_assistants ta')
      .innerJoin('users u', 'ta.user_id = u.id')
      .leftJoin('avatars a', 'u.avatar_id = a.id')
      .where('ta.task_id = $1')
      .orderBy('ta.added_at', 'ASC')
      .build();

    const rows = await this.executeQuery(query, [taskId], client);
    return rows.map(row => this.mapRowToModel(row));
  }

  /**
   * Get assistants by user ID
   */
  async findByUserId(userId: string, limit?: number, client?: PoolClient): Promise<TaskAssistant[]> {
    const queryBuilder = new QueryBuilder()
      .select(
        'ta.id',
        'ta.task_id',
        'ta.user_id',
        'ta.allocation_type',
        'ta.allocation_value',
        'ta.added_at',
        'u.username',
        'u.email',
        'a.image_url as avatar_url'
      )
      .from('task_assistants ta')
      .innerJoin('users u', 'ta.user_id = u.id')
      .leftJoin('avatars a', 'u.avatar_id = a.id')
      .where('ta.user_id = $1')
      .orderBy('ta.added_at', 'DESC');

    if (limit) {
      queryBuilder.limit(limit);
    }

    const query = queryBuilder.build();
    const rows = await this.executeQuery(query, [userId], client);
    return rows.map(row => this.mapRowToModel(row));
  }

  /**
   * Check if user is already an assistant for a task
   */
  async existsByTaskAndUser(taskId: string, userId: string, client?: PoolClient): Promise<boolean> {
    const query = new QueryBuilder()
      .select('COUNT(*) as count')
      .from('task_assistants')
      .where('task_id = $1')
      .andWhere('user_id = $2')
      .build();

    const rows = await this.executeQuery(query, [taskId, userId], client);
    return parseInt(rows[0]?.count || '0') > 0;
  }

  /**
   * Remove assistant by task and user
   */
  async removeByTaskAndUser(taskId: string, userId: string, client?: PoolClient): Promise<void> {
    const query = `DELETE FROM task_assistants WHERE task_id = $1 AND user_id = $2`;
    await this.executeQuery(query, [taskId, userId], client);
  }

  /**
   * Get total allocation for a task
   */
  async getTotalAllocationByTask(taskId: string, client?: PoolClient): Promise<{ percentage: number; fixed: number }> {
    const query = new QueryBuilder()
      .select(
        'allocation_type',
        'SUM(allocation_value) as total'
      )
      .from('task_assistants')
      .where('task_id = $1')
      .groupBy('allocation_type')
      .build();

    const rows = await this.executeQuery(query, [taskId], client);
    
    const result = { percentage: 0, fixed: 0 };
    rows.forEach(row => {
      if (row.allocation_type === 'percentage') {
        result.percentage = parseFloat(row.total || '0');
      } else if (row.allocation_type === 'fixed') {
        result.fixed = parseFloat(row.total || '0');
      }
    });

    return result;
  }

  /**
   * Count assistants by task ID
   */
  async countByTaskId(taskId: string, client?: PoolClient): Promise<number> {
    const query = new QueryBuilder()
      .select('COUNT(*) as count')
      .from('task_assistants')
      .where('task_id = $1')
      .build();

    const rows = await this.executeQuery(query, [taskId], client);
    return parseInt(rows[0]?.count || '0');
  }
}