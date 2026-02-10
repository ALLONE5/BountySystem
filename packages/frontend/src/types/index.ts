// 用户角色
export enum UserRole {
  USER = 'user',
  POSITION_ADMIN = 'position_admin',
  SUPER_ADMIN = 'super_admin'
}

// 任务状态
export enum TaskStatus {
  NOT_STARTED = 'not_started',
  AVAILABLE = 'available',
  PENDING_ACCEPTANCE = 'pending_acceptance',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed'
}

// 邀请状态
export enum InvitationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected'
}

// 可见性
export enum Visibility {
  PUBLIC = 'public',
  POSITION_ONLY = 'position_only',
  PRIVATE = 'private'
}

// 交易类型
export enum TransactionType {
  TASK_COMPLETION = 'task_completion',
  EXTRA_REWARD = 'extra_reward',
  ASSISTANT_SHARE = 'assistant_share',
  REFUND = 'refund'
}

// 用户接口
export interface User {
  id: string;
  username: string;
  email: string;
  avatarId: string;
  avatarUrl?: string;
  role: UserRole;
  balance: number;
  positions: Position[];
  managedPositions?: Position[];
  createdAt: Date;
  lastLogin: Date;
}

// 岗位接口
export interface Position {
  id: string;
  name: string;
  description: string;
  adminIds: string[];
  requiredSkills: string[];
}

// 任务接口
export interface Task {
  id: string;
  name: string;
  description: string | null;
  parentId: string | null;
  depth: number;
  isExecutable: boolean;
  tags: string[];
  createdAt: Date;
  plannedStartDate: Date;
  plannedEndDate: Date;
  actualStartDate: Date | null;
  actualEndDate: Date | null;
  estimatedHours: number;
  complexity: number;
  priority: number;
  status: TaskStatus;
  positionId: string | null;
  positionName?: string;
  visibility: Visibility;
  bountyAmount: number;
  bountyAlgorithmVersion: string;
  bountyPayerId?: string | null;
  isPublished: boolean;
  publishedAt?: Date | null;
  publishedBy?: string | null;
  publisherId: string;
  assigneeId: string | null;
  groupId: string | null;
  groupName?: string;
  projectGroupId?: string | null;
  projectGroupName?: string;
  dependencies: string[];
  progress: number;
  publisher?: User;
  assignee?: User;
  invitedUserId?: string | null;
  invitationStatus?: InvitationStatus | null;
}

// 通知接口
export interface Notification {
  id: string;
  userId: string | null;
  type: string;
  title: string;
  message: string;
  relatedTaskId: string | null;
  isRead: boolean;
  createdAt: Date;
  senderId: string | null;
}

// 排名接口
export interface Ranking {
  userId: string;
  period: 'monthly' | 'quarterly' | 'all_time';
  year: number;
  month: number | null;
  quarter: number | null;
  totalBounty: number;
  completedTasksCount?: number;
  rank: number;
  calculatedAt: Date;
  user?: User;
}

// 认证响应
export interface AuthResponse {
  token: string;
  user: User;
}

// 登录请求
export interface LoginRequest {
  username: string;
  password: string;
}

// 注册请求
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

// 任务统计
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

// 任务组群
export interface TaskGroup {
  id: string;
  name: string;
  creatorId: string;
  memberIds: string[];
  members?: User[];
  tasks?: Task[];
  createdAt: Date;
  creatorName?: string;
  creatorAvatarUrl?: string;
}
