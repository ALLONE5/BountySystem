export enum TaskStatus {
  NOT_STARTED = 'not_started',
  AVAILABLE = 'available',
  PENDING_ACCEPTANCE = 'pending_acceptance',  // 等待被指定用户接受
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

export enum InvitationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

export enum Visibility {
  PUBLIC = 'public',
  POSITION_ONLY = 'position_only',
  PRIVATE = 'private',
}

export interface Task {
  id: string;
  name: string;
  description: string | null;
  parentId: string | null;
  depth: number;
  isExecutable: boolean;

  // Task attributes
  tags: string[];
  createdAt: Date;
  plannedStartDate: Date | null;
  plannedEndDate: Date | null;
  actualStartDate: Date | null;
  actualEndDate: Date | null;
  estimatedHours: number | null;
  complexity: number | null;
  priority: number | null;
  status: TaskStatus;
  positionId: string | null;
  visibility: Visibility;

  // Bounty information
  bountyAmount: number;
  bountyAlgorithmVersion: string | null;
  isBountySettled: boolean;

  // Subtask publishing fields (new)
  bountyPayerId: string | null;  // User who pays the bounty (for subtasks, this is the parent task assignee)
  isPublished: boolean;           // Whether the task is published and visible in bounty task list
  publishedAt: Date | null;       // Timestamp when the task was published
  publishedBy: string | null;     // User who published the task

  // Task assignment invitation fields (new)
  invitedUserId: string | null;   // User invited to accept this task
  invitationStatus: string | null; // Invitation status: pending, accepted, rejected

  // Relationships
  publisherId: string;
  assigneeId: string | null;
  groupId: string | null;
  groupName?: string;
  projectGroupId?: string | null;
  projectGroupName?: string;
  
  publisher?: any; // UserResponse
  assignee?: any; // UserResponse

  // Progress tracking
  progress: number;
  progressLocked: boolean;

  // Aggregated statistics (for parent tasks)
  aggregatedEstimatedHours: number | null;
  aggregatedComplexity: number | null;

  updatedAt: Date;
}

export interface TaskCreateDTO {
  name: string;
  description?: string;
  parentId?: string;
  publisherId: string;

  // Optional attributes
  tags?: string[];
  plannedStartDate?: Date;
  plannedEndDate?: Date;
  estimatedHours?: number;
  complexity?: number;
  priority?: number;
  positionId?: string;
  visibility?: Visibility;
  assigneeId?: string;
  groupId?: string;
  invitedUserId?: string;  // User to invite for task assignment
}

export interface TaskUpdateDTO {
  name?: string;
  description?: string;
  tags?: string[];
  plannedStartDate?: Date;
  plannedEndDate?: Date;
  estimatedHours?: number;
  complexity?: number;
  priority?: number;
  status?: TaskStatus;
  positionId?: string;
  projectGroupId?: string | null;
  visibility?: Visibility;
  assigneeId?: string | null;
  progress?: number;
  actualStartDate?: Date;
  actualEndDate?: Date;
  bountyAmount?: number;
  bountyPayerId?: string | null;
  isPublished?: boolean;
  publishedAt?: Date | null;
  publishedBy?: string | null;
  invitedUserId?: string | null;
  invitationStatus?: string | null;
}

export interface SubtaskPublishDTO {
  visibility: Visibility;
  bountyAmount: number;
  positionId?: string;
}

export interface TaskStats {
  totalEstimatedHours: number;
  averageComplexity: number;
  totalSubtasks: number;
  completedSubtasks: number;
}

/**
 * Pagination parameters for task queries
 */
export interface PaginationParams {
  page?: number;      // Page number (1-indexed), default: 1
  pageSize?: number;  // Items per page, default: 50, max: 100
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}
