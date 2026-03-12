import React from 'react';
import { Tag } from 'antd';
import { TaskStatus, UserRole, InvitationStatus } from '../../types';
import { 
  getTaskStatusConfig, 
  getApplicationStatusConfig, 
  getInvitationStatusConfig,
  ApplicationStatus,
  type StatusConfig 
} from '../../utils/statusConfig';

type StatusLike = TaskStatus | UserRole | InvitationStatus | ApplicationStatus | string;

// Keep role map for UserRole (not part of statusConfig utility)
const roleMap: Record<UserRole, { color: string; text: string }> = {
  [UserRole.USER]: { color: 'default', text: '普通用户' },
  [UserRole.POSITION_ADMIN]: { color: 'blue', text: '职位管理员' },
  [UserRole.SUPER_ADMIN]: { color: 'red', text: '超级管理员' },
  [UserRole.DEVELOPER]: { color: 'purple', text: '开发者' },
};

const fallback = { color: 'default', text: '' } as const;

interface StatusTagProps {
  value: StatusLike;
  /** optional custom map to override built-ins */
  customMap?: Record<string, { color: string; text: string }>;
}

/**
 * StatusTag component - displays status with appropriate color and text
 * 
 * Now uses centralized statusConfig utility for task, application, and invitation statuses.
 * This eliminates duplication and ensures consistent status display across the application.
 * 
 * Requirements: 4.1, 4.2 - Use centralized status configuration
 */
export const StatusTag: React.FC<StatusTagProps> = ({ value, customMap }) => {
  let config: StatusConfig | { color: string; text: string };

  if (customMap) {
    // Use custom map if provided
    config = customMap[value as string] || fallback;
  } else {
    // Use centralized statusConfig for known status types
    if (Object.values(TaskStatus).includes(value as TaskStatus)) {
      config = getTaskStatusConfig(value as TaskStatus);
    } else if (Object.values(InvitationStatus).includes(value as InvitationStatus)) {
      config = getInvitationStatusConfig(value as InvitationStatus);
    } else if (Object.values(ApplicationStatus).includes(value as ApplicationStatus)) {
      config = getApplicationStatusConfig(value as ApplicationStatus);
    } else if (Object.values(UserRole).includes(value as UserRole)) {
      // Keep existing role mapping (not part of statusConfig)
      config = roleMap[value as UserRole] || fallback;
    } else {
      // Fallback for unknown status types
      config = fallback;
    }
  }

  if (!config.text) return null;
  return <Tag color={config.color}>{config.text}</Tag>;
};
