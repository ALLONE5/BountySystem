export interface TaskReview {
  id: string;
  taskId: string;
  reviewerId: string;
  rating: number | null;
  comment: string | null;
  extraBounty: number;
  createdAt: Date;
}

export interface TaskReviewCreateDTO {
  taskId: string;
  reviewerId: string;
  rating?: number;
  comment?: string;
  extraBounty?: number;
}
