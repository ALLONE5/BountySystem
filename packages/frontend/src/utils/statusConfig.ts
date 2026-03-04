/**
 * Centralized status configuration utility
 * 
 * This module provides consistent status-to-display mappings (colors, text, icons)
 * for all status types used throughout the application.
 * 
 * Requirements: 4.5 - Status mapping configuration for task, application, and invitation statuses
 */

import { TaskStatus, InvitationStatus } from '../types';

/**
 * Status configuration interface
 */
export interface StatusConfig {
  /** Ant Design color preset or hex color */
  color: string;
  /** Display text for the status */
  text: string;
  /** Optional icon name (Ant Design icon) */
  icon?: string;
}

/**
 * Application status enum (matches backend ApplicationStatus)
 * Used for position application status tracking
 */
export enum ApplicationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

/**
 * Task status configuration mapping
 */
const TASK_STATUS_CONFIG: Record<TaskStatus, StatusConfig> = {
  [TaskStatus.NOT_STARTED]: {
    color: 'default',
    text: '未开始',
    icon: 'ClockCircleOutlined',
  },
  [TaskStatus.AVAILABLE]: {
    color: 'success',
    text: '可承接',
    icon: 'CheckCircleOutlined',
  },
  [TaskStatus.PENDING_ACCEPTANCE]: {
    color: 'orange',
    text: '待接受',
    icon: 'ClockCircleOutlined',
  },
  [TaskStatus.IN_PROGRESS]: {
    color: 'processing',
    text: '进行中',
    icon: 'SyncOutlined',
  },
  [TaskStatus.COMPLETED]: {
    color: 'success',
    text: '已完成',
    icon: 'CheckCircleOutlined',
  },
  [TaskStatus.ABANDONED]: {
    color: 'error',
    text: '已放弃',
    icon: 'CloseCircleOutlined',
  },
};

/**
 * Application status configuration mapping
 */
const APPLICATION_STATUS_CONFIG: Record<ApplicationStatus, StatusConfig> = {
  [ApplicationStatus.PENDING]: {
    color: 'orange',
    text: '待审核',
    icon: 'ClockCircleOutlined',
  },
  [ApplicationStatus.APPROVED]: {
    color: 'success',
    text: '已批准',
    icon: 'CheckCircleOutlined',
  },
  [ApplicationStatus.REJECTED]: {
    color: 'error',
    text: '已拒绝',
    icon: 'CloseCircleOutlined',
  },
};

/**
 * Invitation status configuration mapping
 */
const INVITATION_STATUS_CONFIG: Record<InvitationStatus, StatusConfig> = {
  [InvitationStatus.PENDING]: {
    color: 'orange',
    text: '待接受',
    icon: 'ClockCircleOutlined',
  },
  [InvitationStatus.ACCEPTED]: {
    color: 'green',
    text: '已接受',
    icon: 'CheckOutlined',
  },
  [InvitationStatus.REJECTED]: {
    color: 'red',
    text: '已拒绝',
    icon: 'CloseOutlined',
  },
};

/**
 * Get task status configuration
 * 
 * @param status - Task status value
 * @returns Status configuration with color, text, and optional icon
 * 
 * @example
 * ```typescript
 * const config = getTaskStatusConfig(TaskStatus.IN_PROGRESS);
 * console.log(config.color); // 'processing'
 * console.log(config.text);  // '进行中'
 * ```
 */
export function getTaskStatusConfig(status: TaskStatus): StatusConfig {
  return TASK_STATUS_CONFIG[status] || {
    color: 'default',
    text: '未知',
  };
}

/**
 * Get application status configuration
 * 
 * @param status - Application status value
 * @returns Status configuration with color, text, and optional icon
 * 
 * @example
 * ```typescript
 * const config = getApplicationStatusConfig(ApplicationStatus.PENDING);
 * console.log(config.color); // 'orange'
 * console.log(config.text);  // '待审核'
 * ```
 */
export function getApplicationStatusConfig(status: ApplicationStatus): StatusConfig {
  return APPLICATION_STATUS_CONFIG[status] || {
    color: 'default',
    text: '未知',
  };
}

/**
 * Get invitation status configuration
 * 
 * @param status - Invitation status value
 * @returns Status configuration with color, text, and optional icon
 * 
 * @example
 * ```typescript
 * const config = getInvitationStatusConfig(InvitationStatus.PENDING);
 * console.log(config.color); // 'orange'
 * console.log(config.text);  // '待接受'
 * ```
 */
export function getInvitationStatusConfig(status: InvitationStatus): StatusConfig {
  return INVITATION_STATUS_CONFIG[status] || {
    color: 'default',
    text: '未知',
  };
}
