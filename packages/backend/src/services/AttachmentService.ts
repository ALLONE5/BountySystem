
import { Pool } from 'pg';
import { Attachment, AttachmentCreateDTO } from '../models/Attachment.js';

export class AttachmentService {
  constructor(private pool: Pool) {}

  async createAttachment(data: AttachmentCreateDTO): Promise<Attachment> {
    const query = `
      INSERT INTO task_attachments (task_id, uploader_id, file_name, file_url, file_type, file_size)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const params = [
      data.taskId,
      data.uploaderId,
      data.fileName,
      data.fileUrl,
      data.fileType,
      data.fileSize
    ];
    const result = await this.pool.query(query, params);
    return this.mapRowToAttachment(result.rows[0]);
  }

  async getAttachmentsByTask(taskId: string): Promise<Attachment[]> {
    const query = `
      SELECT ta.*, u.username, a.image_url as avatar_url
      FROM task_attachments ta
      JOIN users u ON ta.uploader_id = u.id
      LEFT JOIN avatars a ON u.avatar_id = a.id
      WHERE ta.task_id = $1
      ORDER BY ta.created_at DESC
    `;
    const result = await this.pool.query(query, [taskId]);
    return result.rows.map(this.mapRowToAttachment);
  }

  private mapRowToAttachment(row: any): Attachment {
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
}
