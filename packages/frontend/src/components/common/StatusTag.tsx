import React from 'react';
import { Tag } from 'antd';
import { TaskStatus, UserRole } from '../../types';

type StatusLike = TaskStatus | UserRole | string;

const taskStatusMap: Record<TaskStatus, { color: string; text: string }> = {
  [TaskStatus.NOT_STARTED]: { color: 'default', text: '未开始' },
  [TaskStatus.AVAILABLE]: { color: 'green', text: '可承接' },
  [TaskStatus.IN_PROGRESS]: { color: 'processing', text: '进行中' },
  [TaskStatus.COMPLETED]: { color: 'success', text: '已完成' },
  [TaskStatus.ABANDONED]: { color: 'error', text: '已放弃' },
};

const roleMap: Record<UserRole, { color: string; text: string }> = {
  [UserRole.USER]: { color: 'default', text: '普通用户' },
  [UserRole.POSITION_ADMIN]: { color: 'blue', text: '职位管理员' },
  [UserRole.SUPER_ADMIN]: { color: 'red', text: '超级管理员' },
};

const applicationStatusMap: Record<string, { color: string; text: string }> = {
  pending: { color: 'orange', text: '待审核' },
  approved: { color: 'green', text: '已批准' },
  rejected: { color: 'red', text: '已拒绝' },
};

const fallback = { color: 'default', text: '' } as const;

interface StatusTagProps {
  value: StatusLike;
  /** optional custom map to override built-ins */
  customMap?: Record<string, { color: string; text: string }>;
}

export const StatusTag: React.FC<StatusTagProps> = ({ value, customMap }) => {
  const map =
    customMap ??
    ((value as any) in taskStatusMap
      ? (taskStatusMap as any)
      : (value as any) in roleMap
        ? (roleMap as any)
        : applicationStatusMap);

  const config = map[value as keyof typeof map] || fallback;
  if (!config.text) return null;
  return <Tag color={config.color}>{config.text}</Tag>;
};
