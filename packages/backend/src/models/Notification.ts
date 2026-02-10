export enum NotificationType {
  TASK_ASSIGNED = 'task_assigned',
  DEADLINE_REMINDER = 'deadline_reminder',
  DEPENDENCY_RESOLVED = 'dependency_resolved',
  STATUS_CHANGED = 'status_changed',
  POSITION_APPROVED = 'position_approved',
  POSITION_REJECTED = 'position_rejected',
  REVIEW_REQUIRED = 'review_required',
  BROADCAST = 'broadcast',
  TASK_RECOMMENDATION = 'task_recommendation',
  ACCOUNT_UPDATED = 'account_updated',
  GROUP_INVITATION = 'group_invitation',
  TASK_ASSIGNMENT_INVITATION = 'task_assignment_invitation',
  TASK_ASSIGNMENT_ACCEPTED = 'task_assignment_accepted',
  TASK_ASSIGNMENT_REJECTED = 'task_assignment_rejected',
  BONUS_REWARD = 'bonus_reward',
  ADMIN_ANNOUNCEMENT = 'admin_announcement',
}

export interface Notification {
  id: string;
  userId: string | null; // null for broadcast
  type: NotificationType;
  title: string;
  message: string;
  relatedTaskId: string | null;
  isRead: boolean;
  senderId: string | null; // admin ID for broadcast
  createdAt: Date;
}

export interface NotificationCreateDTO {
  userId?: string | null;
  type: NotificationType;
  title: string;
  message: string;
  relatedTaskId?: string | null;
  senderId?: string | null;
}

export interface NotificationResponse {
  id: string;
  userId: string | null;
  type: NotificationType;
  title: string;
  message: string;
  relatedTaskId: string | null;
  isRead: boolean;
  senderId: string | null;
  createdAt: Date;
}
