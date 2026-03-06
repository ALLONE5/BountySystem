import { PoolClient } from 'pg';
import { BaseRepository } from './BaseRepository.js';
import { Attachment } from '../models/Attachment.js';
import { QueryBuilder } from '../utils/QueryBuilder.js';
import { Validator } from '../utils/Validator.js';

export class AttachmentRepository extends BaseRepository<Attachment> {
  constructor() {
    super('task_attachments');
  }

  protected getColumns(): string[] {
    return [
      'id',
      'task_id',
      'uploader_id',
      'file_name',
      'file_url',
      'file_type',
      'file_size',
      'created_at'
    ];
  }

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

  protected validateData(data: Partial<Attachment>, isUpdate?: boolean): void {
    if (!isUpdate) {
      Validator.required(data.taskId, 'taskId');
      Validator.required(data.uploaderId, 'uploaderId');
      Validator.required(data.fileName, 'fileName');
      Validator.required(data.fileUrl, 'fileUrl');
      Validator.required(data.fileType, 'fileType');
      Validator.required(data.fileSize, 'fileSize');
    }

    if (data.fileName !== undefined) {
      Validator.string(data.fileName, 'fileName');
      Validator.maxLength(data.fileName, 255, 'fileName');
    }

    if (data.fileUrl !== undefined) {
      Validator.string(data.fileUrl, 'fileUrl');
      Validator.maxLength(data.fileUrl, 500, 'fileUrl');
    }

    if (data.fileType !== undefined) {
      Validator.string(data.fileType, 'fileType');
      Validator.maxLength(data.fileType, 100, 'fileType');
    }

    if (data.fileSize !== undefined) {
      Validator.positive(data.fileSize, 'fileSize');
    }
  }

  /**
   * Get attachments by task ID with uploader information
   */
  async findByTaskId(taskId: string, client?: PoolClient): Promise<Attachment[]> {
    const query = new QueryBuilder()
      .select(
        'ta.id',
        'ta.task_id',
        'ta.uploader_id',
        'ta.file_name',
        'ta.file_url',
        'ta.file_type',
        'ta.file_size',
        'ta.created_at',
        'u.username',
        'a.image_url as avatar_url'
      )
      .from('task_attachments ta')
      .innerJoin('users u', 'ta.uploader_id = u.id')
      .leftJoin('avatars a', 'u.avatar_id = a.id')
      .where('ta.task_id = $1')
      .orderBy('ta.created_at', 'DESC')
      .build();

    const rows = await this.executeQuery(query, [taskId], client);
    return rows.map(row => this.mapRowToModel(row));
  }

  /**
   * Get attachments by uploader ID
   */
  async findByUploaderId(uploaderId: string, limit?: number, client?: PoolClient): Promise<Attachment[]> {
    const queryBuilder = new QueryBuilder()
      .select(
        'ta.id',
        'ta.task_id',
        'ta.uploader_id',
        'ta.file_name',
        'ta.file_url',
        'ta.file_type',
        'ta.file_size',
        'ta.created_at',
        'u.username',
        'a.image_url as avatar_url'
      )
      .from('task_attachments ta')
      .innerJoin('users u', 'ta.uploader_id = u.id')
      .leftJoin('avatars a', 'u.avatar_id = a.id')
      .where('ta.uploader_id = $1')
      .orderBy('ta.created_at', 'DESC');

    if (limit) {
      queryBuilder.limit(limit);
    }

    const query = queryBuilder.build();
    const rows = await this.executeQuery(query, [uploaderId], client);
    return rows.map(row => this.mapRowToModel(row));
  }

  /**
   * Get attachments by file type
   */
  async findByFileType(fileType: string, limit?: number, client?: PoolClient): Promise<Attachment[]> {
    const queryBuilder = new QueryBuilder()
      .select(...this.getColumns().map(col => `task_attachments.${col}`))
      .from('task_attachments')
      .where('file_type = $1')
      .orderBy('created_at', 'DESC');

    if (limit) {
      queryBuilder.limit(limit);
    }

    const query = queryBuilder.build();
    const rows = await this.executeQuery(query, [fileType], client);
    return rows.map(row => this.mapRowToModel(row));
  }

  /**
   * Count attachments by task ID
   */
  async countByTaskId(taskId: string, client?: PoolClient): Promise<number> {
    const query = new QueryBuilder()
      .select('COUNT(*) as count')
      .from('task_attachments')
      .where('task_id = $1')
      .build();

    const rows = await this.executeQuery(query, [taskId], client);
    return parseInt(rows[0]?.count || '0');
  }

  /**
   * Get total file size by task ID
   */
  async getTotalFileSizeByTaskId(taskId: string, client?: PoolClient): Promise<number> {
    const query = new QueryBuilder()
      .select('COALESCE(SUM(file_size), 0) as total_size')
      .from('task_attachments')
      .where('task_id = $1')
      .build();

    const rows = await this.executeQuery(query, [taskId], client);
    return parseInt(rows[0]?.total_size || '0');
  }
}