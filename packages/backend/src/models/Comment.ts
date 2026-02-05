
export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
}

export interface CommentCreateDTO {
  taskId: string;
  userId: string;
  content: string;
}
