import { ImprovedBaseRepository } from './ImprovedBaseRepository.js';
import { Comment } from '../models/Comment.js';
import { HandleError } from '../utils/decorators/handleError.js';

export class CommentRepository extends ImprovedBaseRepository<Comment> {
  protected tableName = 'task_comments';

  protected mapRowToModel(row: any): Comment {
    return {
      id: row.id,
      taskId: row.task_id,
      userId: row.user_id,
      content: row.content,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      user: row.username ? {
        id: row.user_id,
        username: row.username,
        avatarUrl: row.avatar_url
      } : undefined
    };
  }

  /**
   * Get comments by task ID with user information
   */
  @HandleError({ context: 'CommentRepository.findByTaskId' })
  async findByTaskId(taskId: string): Promise<Comment[]> {
    return this.executeQuery('findByTaskId', async () => {
      const query = `
        SELECT 
          c.id,
          c.task_id, 
          c.user_id,
          c.content,
          c.created_at,
          c.updated_at,
          u.username,
          a.image_url as avatar_url
        FROM task_comments c
        INNER JOIN users u ON c.user_id = u.id
        LEFT JOIN avatars a ON u.avatar_id = a.id
        WHERE c.task_id = $1
        ORDER BY c.created_at ASC
      `;

      const result = await this.pool.query(query, [taskId]);
      return result.rows.map(row => this.mapRowToModel(row));
    }, { taskId });
  }

  /**
   * Get comments by user ID
   */
  @HandleError({ context: 'CommentRepository.findByUserId' })
  async findByUserId(userId: string, limit?: number): Promise<Comment[]> {
    return this.executeQuery('findByUserId', async () => {
      const query = `
        SELECT 
          c.id,
          c.task_id,
          c.user_id, 
          c.content,
          c.created_at,
          c.updated_at,
          u.username,
          a.image_url as avatar_url
        FROM task_comments c
        INNER JOIN users u ON c.user_id = u.id
        LEFT JOIN avatars a ON u.avatar_id = a.id
        WHERE c.user_id = $1
        ORDER BY c.created_at DESC
        ${limit ? `LIMIT ${limit}` : ''}
      `;

      const result = await this.pool.query(query, [userId]);
      return result.rows.map(row => this.mapRowToModel(row));
    }, { userId, limit });
  }

  /**
   * Count comments by task ID
   */
  @HandleError({ context: 'CommentRepository.countByTaskId' })
  async countByTaskId(taskId: string): Promise<number> {
    return this.executeQuery('countByTaskId', async () => {
      const query = `
        SELECT COUNT(*) as count
        FROM task_comments
        WHERE task_id = $1
      `;

      const result = await this.pool.query(query, [taskId]);
      return parseInt(result.rows[0]?.count || '0');
    }, { taskId });
  }
}
