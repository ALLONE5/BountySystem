
import { Pool } from 'pg';
import { Comment, CommentCreateDTO } from '../models/Comment.js';
import { AppError } from '../utils/errors.js';

export class CommentService {
  constructor(private pool: Pool) {}

  async createComment(data: CommentCreateDTO): Promise<Comment> {
    const query = `
      INSERT INTO task_comments (task_id, user_id, content)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const result = await this.pool.query(query, [data.taskId, data.userId, data.content]);
    return this.mapRowToComment(result.rows[0]);
  }

  async getCommentsByTask(taskId: string): Promise<Comment[]> {
    const query = `
      SELECT c.*, u.username, a.image_url as avatar_url
      FROM task_comments c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN avatars a ON u.avatar_id = a.id
      WHERE c.task_id = $1
      ORDER BY c.created_at ASC
    `;
    const result = await this.pool.query(query, [taskId]);
    return result.rows.map(this.mapRowToComment);
  }

  private mapRowToComment(row: any): Comment {
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
}
