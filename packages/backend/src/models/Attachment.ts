
export interface Attachment {
  id: string;
  taskId: string;
  uploaderId: string;
  fileName: string;
  fileUrl: string;
  fileType?: string;
  fileSize?: number;
  createdAt: Date;
  uploader?: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
}

export interface AttachmentCreateDTO {
  taskId: string;
  uploaderId: string;
  fileName: string;
  fileUrl: string;
  fileType?: string;
  fileSize?: number;
}
