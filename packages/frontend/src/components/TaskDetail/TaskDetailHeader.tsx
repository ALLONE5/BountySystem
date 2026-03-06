/**
 * 任务详情头部组件
 * 显示任务标题和基本信息
 */

import React from 'react';
import { Typography, Tag } from 'antd';
import { Task } from '../../types';

const { Title } = Typography;

interface TaskDetailHeaderProps {
  task: Task | null;
}

export const TaskDetailHeader: React.FC<TaskDetailHeaderProps> = ({ task }) => {
  if (!task) return null;

  return (
    <Title level={4} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
      {task.name}
      {task.depth === 1 && (
        <Tag color="blue" style={{ marginLeft: 8 }}>子任务</Tag>
      )}
    </Title>
  );
};