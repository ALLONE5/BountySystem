import { Comment } from '../../models/Comment.js';

export class CommentMapper {
  /**
   * Map database row to Comment model
   */
  static mapRowToComment(row: any): Comment {
    if (!row) return null;

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
   * Map Comment model to database row
   */
  static mapCommentToRow(comment: Partial<Comment>): any {
    const row: any = {};

    if (comment.id !== undefined) row.id = comment.id;
    if (comment.taskId !== undefined) row.task_id = comment.taskId;
    if (comment.userId !== undefined) row.user_id = comment.userId;
    if (comment.content !== undefined) row.content = comment.content;
    if (comment.createdAt !== undefined) row.created_at = comment.createdAt;
    if (comment.updatedAt !== undefined) row.updated_at = comment.updatedAt;

    return row;
  }

  /**
   * Map array of database rows to Comment models
   */
  static mapRowsToComments(rows: any[]): Comment[] {
    return rows.map(row => this.mapRowToComment(row)).filter(comment => comment !== null);
  }
}