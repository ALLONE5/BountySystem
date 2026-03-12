import { ImprovedBaseRepository } from './ImprovedBaseRepository.js';
import { TaskAssistant } from '../models/TaskAssistant.js';
import { HandleError } from '../utils/decorators/handleError.js';

export class TaskAssistantRepository extends ImprovedBaseRepository<TaskAssistant> {
  protected tableName = 'task_assistants';

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

  /**
   * Get assistants by task ID with user information
   */
  @HandleError({ context: 'TaskAssistantRepository.findByTaskId' })
  async findByTaskId(taskId: string): Promise<TaskAssistant[]> {
    return this.executeQuery('findByTaskId', async () => {
      const query = `
        SELECT 
          ta.id,
          ta.task_id,
          ta.user_id,
          ta.allocation_type,
          ta.allocation_value,
          ta.added_at,
          u.username,
          u.email,
          a.image_url as avatar_url
        FROM task_assistants ta
        INNER JOIN users u ON ta.user_id = u.id
        LEFT JOIN avatars a ON u.avatar_id = a.id
        WHERE ta.task_id = $1
        ORDER BY ta.added_at ASC
      `;

      const result = await this.pool.query(query, [taskId]);
      return result.rows.map(row => this.mapRowToModel(row));
    }, { taskId });
  }

  /**
   * Get assistants by user ID
   */
  @HandleError({ context: 'TaskAssistantRepository.findByUserId' })
  async findByUserId(userId: string, limit?: number): Promise<TaskAssistant[]> {
    return this.executeQuery('findByUserId', async () => {
      const query = `
        SELECT 
          ta.id,
          ta.task_id,
          ta.user_id,
          ta.allocation_type,
          ta.allocation_value,
          ta.added_at,
          u.username,
          u.email,
          a.image_url as avatar_url
        FROM task_assistants ta
        INNER JOIN users u ON ta.user_id = u.id
        LEFT JOIN avatars a ON u.avatar_id = a.id
        WHERE ta.user_id = $1
        ORDER BY ta.added_at DESC
        ${limit ? `LIMIT ${limit}` : ''}
      `;

      const result = await this.pool.query(query, [userId]);
      return result.rows.map(row => this.mapRowToModel(row));
    }, { userId, limit });
  }

  /**
   * Check if user is already an assistant for a task
   */
  @HandleError({ context: 'TaskAssistantRepository.existsByTaskAndUser' })
  async existsByTaskAndUser(taskId: string, userId: string): Promise<boolean> {
    return this.executeQuery('existsByTaskAndUser', async () => {
      const query = `
        SELECT COUNT(*) as count
        FROM task_assistants
        WHERE task_id = $1 AND user_id = $2
      `;

      const result = await this.pool.query(query, [taskId, userId]);
      return parseInt(result.rows[0]?.count || '0') > 0;
    }, { taskId, userId });
  }

  /**
   * Remove assistant by task and user
   */
  @HandleError({ context: 'TaskAssistantRepository.removeByTaskAndUser' })
  async removeByTaskAndUser(taskId: string, userId: string): Promise<void> {
    return this.executeQuery('removeByTaskAndUser', async () => {
      const query = `DELETE FROM task_assistants WHERE task_id = $1 AND user_id = $2`;
      await this.pool.query(query, [taskId, userId]);
    }, { taskId, userId });
  }

  /**
   * Get total allocation for a task
   */
  @HandleError({ context: 'TaskAssistantRepository.getTotalAllocationByTask' })
  async getTotalAllocationByTask(taskId: string): Promise<{ percentage: number; fixed: number }> {
    return this.executeQuery('getTotalAllocationByTask', async () => {
      const query = `
        SELECT 
          allocation_type,
          SUM(allocation_value) as total
        FROM task_assistants
        WHERE task_id = $1
        GROUP BY allocation_type
      `;

      const result = await this.pool.query(query, [taskId]);
      
      const allocation = { percentage: 0, fixed: 0 };
      result.rows.forEach(row => {
        if (row.allocation_type === 'percentage') {
          allocation.percentage = parseFloat(row.total || '0');
        } else if (row.allocation_type === 'fixed') {
          allocation.fixed = parseFloat(row.total || '0');
        }
      });

      return allocation;
    }, { taskId });
  }

  /**
   * Count assistants by task ID
   */
  @HandleError({ context: 'TaskAssistantRepository.countByTaskId' })
  async countByTaskId(taskId: string): Promise<number> {
    return this.executeQuery('countByTaskId', async () => {
      const query = `
        SELECT COUNT(*) as count
        FROM task_assistants
        WHERE task_id = $1
      `;

      const result = await this.pool.query(query, [taskId]);
      return parseInt(result.rows[0]?.count || '0');
    }, { taskId });
  }
}
