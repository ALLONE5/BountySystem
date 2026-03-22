// Authentication Types
export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  avatarId?: string;
  bounty: number;
  positions?: Position[];
  managedPositions?: Position[];
  createdAt: string;
  updatedAt: string;
}

// User Role Types
export enum UserRole {
  USER = 'user',
  POSITION_ADMIN = 'position_admin',
  SUPER_ADMIN = 'super_admin',
  DEVELOPER = 'developer'
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

// Task Types
export interface Task {
  id: string;
  name: string;
  title: string;
  description: string;
  bounty: number;
  bountyAmount?: number;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled' | 'not_started' | 'abandoned' | TaskStatus;
  priority: 'low' | 'medium' | 'high' | number;
  publisherId: string;
  assigneeId?: string;
  projectGroupId?: string;
  parentTaskId?: string;
  parentId?: string;
  deadline?: string;
  plannedStartDate?: string;
  plannedEndDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  estimatedHours?: number;
  progress?: number;
  complexity?: number;
  visibility?: string | Visibility;
  positionId?: string;
  positionName?: string;
  groupName?: string;
  groupId?: string;
  projectGroupName?: string;
  depth?: number;
  invitedUserId?: string;
  invitationStatus?: InvitationStatus;
  isPublished?: boolean;
  createdAt: string;
  updatedAt: string;
  publisher?: User;
  assignee?: User;
  projectGroup?: ProjectGroup;
  subtasks?: Task[];
  tags?: string[];
}

// Task Status Types
export enum TaskStatus {
  NOT_STARTED = 'not_started',
  AVAILABLE = 'available',
  PENDING_ACCEPTANCE = 'pending_acceptance',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  ABANDONED = 'abandoned'
}

// Invitation Status Types
export enum InvitationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected'
}

// Visibility Types
export enum Visibility {
  PUBLIC = 'public',
  POSITION_ONLY = 'position_only',
  PRIVATE = 'private'
}

// Task Statistics Types
export interface TaskStats {
  publishedTotal: number;
  publishedNotStarted: number;
  publishedInProgress: number;
  publishedCompleted: number;
  assignedTotal: number;
  assignedInProgress: number;
  assignedCompleted: number;
  totalBountyEarned: number;
}

// Project Group Types
export interface ProjectGroup {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  owner?: User;
  members?: User[];
  tasks?: Task[];
}

// Task Group Types
export interface TaskGroup {
  id: string;
  name: string;
  creatorId: string;
  creatorName?: string;
  creatorAvatarUrl?: string;
  memberIds?: string[];
  members?: User[];
  createdAt: string;
  updatedAt: string;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  relatedTaskId?: string;
  createdAt: string;
  updatedAt: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Form Types
export interface TaskFormData {
  title: string;
  description: string;
  bounty: number;
  priority: 'low' | 'medium' | 'high';
  deadline?: string;
  projectGroupId?: string;
  tags?: string[];
}

export interface UserFormData {
  username: string;
  email: string;
  role?: string;
  avatarUrl?: string;
}

export interface ProjectGroupFormData {
  name: string;
  description: string;
  isPublic: boolean;
}

// Filter and Search Types
export interface TaskFilters {
  status?: string[];
  priority?: string[];
  publisherId?: string;
  assigneeId?: string;
  projectGroupId?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface UserFilters {
  role?: string[];
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Theme Types - re-exported from styles/themes (single source of truth)
export type { ThemeMode } from '../styles/themes';

// System Config Types
export interface SystemConfig {
  id: string;
  key: string;
  value: string;
  description?: string;
  type: 'string' | 'number' | 'boolean' | 'json';
  createdAt: string;
  updatedAt: string;
}

// Bounty Transaction Types
export enum TransactionType {
  TASK_COMPLETION = 'task_completion',
  EXTRA_REWARD = 'extra_reward',
  ASSISTANT_SHARE = 'assistant_share',
  REFUND = 'refund'
}

// Bounty Transaction Interface
export interface BountyTransaction {
  id: string;
  fromUserId?: string;
  toUserId: string;
  amount: number;
  type: TransactionType;
  description?: string;
  taskId?: string;
  createdAt: string;
  updatedAt: string;
}

// Ranking Types
export interface Ranking {
  id?: string;
  userId: string;
  username?: string;
  avatarId?: string | null;
  avatarUrl?: string;
  totalBounty: number;
  completedTasksCount?: number;
  completedTasks?: number; // 兼容字段
  totalPoints?: number; // 兼容字段
  rank: number;
  period?: 'monthly' | 'quarterly' | 'all_time';
  year?: number;
  month?: number | null;
  quarter?: number | null;
  createdAt?: string;
  updatedAt?: string;
  user?: {
    id: string;
    username: string;
    email?: string;
    avatarId?: string | null;
    avatarUrl?: string;
    role?: string;
    createdAt?: Date;
    lastLogin?: Date | null;
  };
}

// Position Application Types
export interface PositionApplication {
  id: string;
  userId: string;
  positionId: string;
  status: 'pending' | 'approved' | 'rejected';
  applicationReason?: string;
  reason?: string;
  reviewComment?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
  user?: User;
  position?: Position;
}

export interface ReviewApplicationRequest {
  approved: boolean;
  reviewComment?: string;
}

// Position Types
export interface Position {
  id: string;
  name: string;
  description: string;
  requirements?: string;
  responsibilities?: string;
  requiredSkills?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}