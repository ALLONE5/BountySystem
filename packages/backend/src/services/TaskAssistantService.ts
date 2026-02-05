
import { Pool } from 'pg';
import { TaskAssistant, TaskAssistantCreateDTO } from '../models/TaskAssistant.js';
import { AppError } from '../utils/errors.js';

export class TaskAssistantService {
  constructor(private pool: Pool) {}

  async addAssistant(data: TaskAssistantCreateDTO): Promise<TaskAssistant> {
    // Check if user is already an assistant
    const checkQuery = 'SELECT * FROM task_assistants WHERE task_id = $1 AND user_id = $2';
    const checkResult = await this.pool.query(checkQuery, [data.taskId, data.userId]);
    if (checkResult.rows.length > 0) {
      throw new AppError('CONFLICT', 'User is already an assistant for this task', 409);
    }

    const query = `
      INSERT INTO task_assistants (task_id, user_id, allocation_type, allocation_value)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const result = await this.pool.query(query, [
      data.taskId,
      data.userId,
      data.allocationType,
      data.allocationValue
    ]);
    
    // Fetch user details to return complete object
    return this.getAssistant(result.rows[0].id);
  }

  async getAssistant(id: string): Promise<TaskAssistant> {
    const query = `
      SELECT ta.*, u.username, u.email, a.image_url as avatar_url
      FROM task_assistants ta
      JOIN users u ON ta.user_id = u.id
      LEFT JOIN avatars a ON u.avatar_id = a.id
      WHERE ta.id = $1
    `;
    const result = await this.pool.query(query, [id]);
    if (result.rows.length === 0) {
      throw new AppError('NOT_FOUND', 'Assistant not found', 404);
    }
    return this.mapRowToAssistant(result.rows[0]);
  }

  async getAssistantsByTask(taskId: string): Promise<TaskAssistant[]> {
    const query = `
      SELECT ta.*, u.username, u.email, a.image_url as avatar_url
      FROM task_assistants ta
      JOIN users u ON ta.user_id = u.id
      LEFT JOIN avatars a ON u.avatar_id = a.id
      WHERE ta.task_id = $1
      ORDER BY ta.added_at ASC
    `;
    const result = await this.pool.query(query, [taskId]);
    return result.rows.map(this.mapRowToAssistant);
  }

  async removeAssistant(taskId: string, userId: string): Promise<void> {
    const query = 'DELETE FROM task_assistants WHERE task_id = $1 AND user_id = $2';
    await this.pool.query(query, [taskId, userId]);
  }

  private mapRowToAssistant(row: any): any {
    return {
      id: row.id,
      user_id: row.user_id,
      username: row.username,
      avatar_url: row.avatar_url,
      bounty_allocation: parseFloat(row.allocation_value),
      // Keep backward compatibility if needed, but frontend expects the above
      taskId: row.task_id,
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
}
