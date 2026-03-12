import { ImprovedBaseRepository } from './ImprovedBaseRepository.js';
import { Attachment } from '../models/Attachment.js';
import { HandleError } from '../utils/decorators/handleError.js';

export class AttachmentRepository extends ImprovedBaseRepository<Attachment> {
  protected tableName = 'task_attachments';

  protected mapRowToModel(row: any): Attachment {
    return {
      id: row.id,
      taskId: row.task_id,
      uploaderId: row.uploader_id,
      fileName: row.file_name,
      fileUrl: row.file_url,
      fileType: row.file_type,
      fileSize: row.file_size,
      createdAt: row.created_at,
      uploader: row.username ? {
        id: row.uploader_id,
        username: row.username,
        avatarUrl: row.avatar_url
      } : undefined
    };
  }

  /**
   * Get attachments by task ID with uploader information
   */
  @HandleError({ context: 'AttachmentRepository.findByTaskId' })
  async findByTaskId(taskId: string): Promise<Attachment[]> {
    return this.executeQuery('findByTaskId', async () => {
      const query = `
        SELECT 
          ta.id,
          ta.task_id,
          ta.uploader_id,
          ta.file_name,
          ta.file_url,
          ta.file_type,
          ta.file_size,
          ta.created_at,
          u.username,
          a.image_url as avatar_url
        FROM task_attachments ta
        INNER JOIN users u ON ta.uploader_id = u.id
        LEFT JOIN avatars a ON u.avatar_id = a.id
        WHERE ta.task_id = $1
        ORDER BY ta.created_at DESC
      `;

      const result = await this.pool.query(query, [taskId]);
      return result.rows.map(row => this.mapRowToModel(row));
    }, { taskId });
  }

  /**
   * Get attachments by uploader ID
   */
  @HandleError({ context: 'AttachmentRepository.findByUploaderId' })
  async findByUploaderId(uploaderId: string, limit?: number): Promise<Attachment[]> {
    return this.executeQuery('findByUploaderId', async () => {
      const query = `
        SELECT 
          ta.id,
          ta.task_id,
          ta.uploader_id,
          ta.file_name,
          ta.file_url,
          ta.file_type,
          ta.file_size,
          ta.created_at,
          u.username,
          a.image_url as avatar_url
        FROM task_attachments ta
        INNER JOIN users u ON ta.uploader_id = u.id
        LEFT JOIN avatars a ON u.avatar_id = a.id
        WHERE ta.uploader_id = $1
        ORDER BY ta.created_at DESC
        ${limit ? `LIMIT ${limit}` : ''}
      `;

      const result = await this.pool.query(query, [uploaderId]);
      return result.rows.map(row => this.mapRowToModel(row));
    }, { uploaderId, limit });
  }

  /**
   * Get attachments by file type
   */
  @HandleError({ context: 'AttachmentRepository.findByFileType' })
  async findByFileType(fileType: string, limit?: number): Promise<Attachment[]> {
    return this.executeQuery('findByFileType', async () => {
      const query = `
        SELECT *
        FROM task_attachments
        WHERE file_type = $1
        ORDER BY created_at DESC
        ${limit ? `LIMIT ${limit}` : ''}
      `;

      const result = await this.pool.query(query, [fileType]);
      return result.rows.map(row => this.mapRowToModel(row));
    }, { fileType, limit });
  }

  /**
   * Count attachments by task ID
   */
  @HandleError({ context: 'AttachmentRepository.countByTaskId' })
  async countByTaskId(taskId: string): Promise<number> {
    return this.executeQuery('countByTaskId', async () => {
      const query = `
        SELECT COUNT(*) as count
        FROM task_attachments
        WHERE task_id = $1
      `;

      const result = await this.pool.query(query, [taskId]);
      return parseInt(result.rows[0]?.count || '0');
    }, { taskId });
  }

  /**
   * Get total file size by task ID
   */
  @HandleError({ context: 'AttachmentRepository.getTotalFileSizeByTaskId' })
  async getTotalFileSizeByTaskId(taskId: string): Promise<number> {
    return this.executeQuery('getTotalFileSizeByTaskId', async () => {
      const query = `
        SELECT COALESCE(SUM(file_size), 0) as total_size
        FROM task_attachments
        WHERE task_id = $1
      `;

      const result = await this.pool.query(query, [taskId]);
      return parseInt(result.rows[0]?.total_size || '0');
    }, { taskId });
  }
}
