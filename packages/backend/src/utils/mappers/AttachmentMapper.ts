import { Attachment } from '../../models/Attachment.js';

export class AttachmentMapper {
  /**
   * Map database row to Attachment model
   */
  static mapRowToAttachment(row: any): Attachment {
    if (!row) return undefined as any;

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
   * Map Attachment model to database row
   */
  static mapAttachmentToRow(attachment: Partial<Attachment>): any {
    const row: any = {};

    if (attachment.id !== undefined) row.id = attachment.id;
    if (attachment.taskId !== undefined) row.task_id = attachment.taskId;
    if (attachment.uploaderId !== undefined) row.uploader_id = attachment.uploaderId;
    if (attachment.fileName !== undefined) row.file_name = attachment.fileName;
    if (attachment.fileUrl !== undefined) row.file_url = attachment.fileUrl;
    if (attachment.fileType !== undefined) row.file_type = attachment.fileType;
    if (attachment.fileSize !== undefined) row.file_size = attachment.fileSize;
    if (attachment.createdAt !== undefined) row.created_at = attachment.createdAt;

    return row;
  }

  /**
   * Map array of database rows to Attachment models
   */
  static mapRowsToAttachments(rows: any[]): Attachment[] {
    return rows.map(row => this.mapRowToAttachment(row)).filter(attachment => attachment !== null);
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get file extension from filename
   */
  static getFileExtension(fileName: string): string {
    return fileName.split('.').pop()?.toLowerCase() || '';
  }

  /**
   * Check if file type is image
   */
  static isImageFile(fileType: string): boolean {
    const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    return imageTypes.includes(fileType.toLowerCase());
  }

  /**
   * Check if file type is document
   */
  static isDocumentFile(fileType: string): boolean {
    const documentTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv'
    ];
    return documentTypes.includes(fileType.toLowerCase());
  }
}