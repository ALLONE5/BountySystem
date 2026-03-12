/**
 * 看板任务卡片组件
 * 显示单个任务的卡片信息
 */

import React from 'react';
import { Card, Tag } from 'antd';
import { DollarOutlined, FlagOutlined, ClockCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { Task } from '../../types';

interface KanbanCardProps {
  task: Task;
  columnColor: string;
  isDragging: boolean;
  onTaskClick: (task: Task) => void;
}

export const KanbanCard: React.FC<KanbanCardProps> = ({
  task,
  columnColor,
  isDragging,
  onTaskClick
}) => {
  const getPriorityColor = (priority: number | string | undefined): string => {
    const numPriority = typeof priority === 'number' ? priority : 1;
    if (numPriority >= 4) return 'red';
    if (numPriority >= 3) return 'orange';
    return 'blue';
  };

  const getComplexityText = (complexity: number | undefined): string => {
    const levels = ['极简', '简单', '中等', '复杂', '极难'];
    return levels[(complexity || 1) - 1] || '未知';
  };

  return (
    <Card
      size="small"
      className={`kanban-card task-card ${isDragging ? 'kanban-card-dragging' : ''}`}
      hoverable
      style={{
        cursor: 'move',
        borderLeft: `3px solid ${columnColor}`,
      }}
      onClick={() => onTaskClick(task)}
    >
      <div style={{ marginBottom: '12px' }}>
        <div
          className="kanban-card-title"
          style={{
            fontWeight: 600,
            marginBottom: '6px',
            fontSize: '14px',
            lineHeight: '1.4',
          }}
        >
          {task.name}
        </div>
        {task.description && (
          <div
            className="kanban-card-description"
            style={{
              fontSize: '12px',
              marginBottom: '12px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              lineHeight: '1.5',
            }}
          >
            {task.description}
          </div>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          gap: '6px',
          flexWrap: 'wrap',
          marginBottom: '12px',
        }}
      >
        <Tag
          icon={<DollarOutlined />}
          color="red"
          style={{ fontSize: '12px', fontWeight: 600 }}
        >
          ${task.bountyAmount}
        </Tag>
        <Tag
          icon={<FlagOutlined />}
          color={getPriorityColor(task.priority)}
          style={{ fontSize: '12px' }}
        >
          P{typeof task.priority === 'number' ? task.priority : 1}
        </Tag>
        <Tag color="blue" style={{ fontSize: '12px' }}>
          {getComplexityText(task.complexity)}
        </Tag>
      </div>

      <div
        className="kanban-card-date"
        style={{
          fontSize: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          marginBottom: (task.progress || 0) > 0 ? '12px' : 0,
        }}
      >
        <ClockCircleOutlined />
        <span>
          {dayjs(task.plannedEndDate).format('YYYY-MM-DD')}
        </span>
      </div>

      {(task.progress || 0) > 0 && (
        <div>
          <div
            className="kanban-card-progress-label"
            style={{
              fontSize: '12px',
              marginBottom: '6px',
              fontWeight: 500,
            }}
          >
            进度: {task.progress}%
          </div>
      <div
        className="kanban-card-progress-bar"
        style={{
          height: '8px',
          borderRadius: '4px',
          overflow: 'hidden',
        }}
      >
            <div
              style={{
                height: '100%',
                width: `${task.progress}%`,
                backgroundColor: columnColor,
                transition: 'width 0.3s',
                borderRadius: '4px',
              }}
            />
          </div>
        </div>
      )}

      {task.tags && task.tags.length > 0 && (
        <div style={{ marginTop: '12px' }}>
          {task.tags.slice(0, 3).map(tag => (
            <Tag
              key={tag}
              style={{ fontSize: '11px', marginBottom: '4px' }}
            >
              {tag}
            </Tag>
          ))}
        </div>
      )}
    </Card>
  );
};