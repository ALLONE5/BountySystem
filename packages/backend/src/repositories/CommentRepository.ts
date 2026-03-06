import { PoolClient } from 'pg';
import { BaseRepository } from './BaseRepository.js';
import { Comment } from '../models/Comment.js';
import { QueryBuilder } from '../utils/QueryBuilder.js';
import { Validator } from '../utils/Validator.js';

export class CommentRepository extends BaseRepository<Comment> {
  constructor() {
    super('task_comments');
  }

  protected getColumns(): string[] {
    return [
      'id',
      'task_id',
      'user_id', 
      'content',
      'created_at',
      'updated_at'
    ];
  }

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

  protected validateData(data: Partial<Comment>, isUpdate?: boolean): void {
    if (!isUpdate) {
      Validator.required(data.taskId, 'taskId');
      Validator.required(data.userId, 'userId');
      Validator.required(data.content, 'content');
    }

    if (data.content !== undefined) {
      Validator.string(data.content, 'content');
      Validator.maxLength(data.content, 2000, 'content');
    }
  }

  /**
   * Get comments by task ID with user information
   */
  async findByTaskId(taskId: string, client?: PoolClient): Promise<Comment[]> {
    const query = new QueryBuilder()
      .select(
        'c.id',
        'c.task_id', 
        'c.user_id',
        'c.content',
        'c.created_at',
        'c.updated_at',
        'u.username',
        'a.image_url as avatar_url'
      )
      .from('task_comments c')
      .innerJoin('users u', 'c.user_id = u.id')
      .leftJoin('avatars a', 'u.avatar_id = a.id')
      .where('c.task_id = $1')
      .orderBy('c.created_at', 'ASC')
      .build();

    const rows = await this.executeQuery(query, [taskId], client);
    return rows.map(row => this.mapRowToModel(row));
  }

  /**
   * Get comments by user ID
   */
  async findByUserId(userId: string, limit?: number, client?: PoolClient): Promise<Comment[]> {
    const queryBuilder = new QueryBuilder()
      .select(
        'c.id',
        'c.task_id',
        'c.user_id', 
        'c.content',
        'c.created_at',
        'c.updated_at',
        'u.username',
        'a.image_url as avatar_url'
      )
      .from('task_comments c')
      .innerJoin('users u', 'c.user_id = u.id')
      .leftJoin('avatars a', 'u.avatar_id = a.id')
      .where('c.user_id = $1')
      .orderBy('c.created_at', 'DESC');

    if (limit) {
      queryBuilder.limit(limit);
    }

    const query = queryBuilder.build();
    const rows = await this.executeQuery(query, [userId], client);
    return rows.map(row => this.mapRowToModel(row));
  }

  /**
   * Count comments by task ID
   */
  async countByTaskId(taskId: string, client?: PoolClient): Promise<number> {
    const query = new QueryBuilder()
      .select('COUNT(*) as count')
      .from('task_comments')
      .where('task_id = $1')
      .build();

    const rows = await this.executeQuery(query, [taskId], client);
    return parseInt(rows[0]?.count || '0');
  }
}