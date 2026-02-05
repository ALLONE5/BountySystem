/**
 * 状态徽章组件
 */
import React from 'react';
import { Tag } from 'antd';
import { TaskStatus } from '../../types';
import { colors } from '../../styles/design-tokens';

interface StatusBadgeProps {
  status: TaskStatus;
  size?: 'small' | 'default';
}

const statusConfig: Record<TaskStatus, { text: string; color: string }> = {
  not_started: { text: '未开始', color: colors.status.notStarted },
  available: { text: '可承接', color: colors.status.available },
  in_progress: { text: '进行中', color: colors.status.inProgress },
  completed: { text: '已完成', color: colors.status.completed },
  abandoned: { text: '已放弃', color: colors.status.abandoned },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'default' }) => {
  const config = statusConfig[status];
  
  return (
    <Tag 
      color={config.color}
      style={{ 
        margin: 0,
        fontSize: size === 'small' ? 12 : 14,
        fontWeight: 500,
      }}
    >
      {config.text}
    </Tag>
  );
};
