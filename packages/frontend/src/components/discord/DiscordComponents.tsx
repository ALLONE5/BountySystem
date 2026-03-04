import React from 'react';
import { Card, Button, Avatar, Badge, Tag, Progress } from 'antd';
import { UserOutlined, ClockCircleOutlined, DollarOutlined } from '@ant-design/icons';
import './DiscordComponents.css';

// Discord 风格卡片
export const DiscordCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  title?: string;
  extra?: React.ReactNode;
}> = ({ children, className = '', hoverable = true, title, extra }) => {
  return (
    <Card
      className={`discord-card ${className}`}
      hoverable={hoverable}
      title={title}
      extra={extra}
      bordered={false}
    >
      {children}
    </Card>
  );
};

// Discord 风格按钮
export const DiscordButton: React.FC<{
  children: React.ReactNode;
  type?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  size?: 'small' | 'middle' | 'large';
  block?: boolean;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}> = ({ 
  children, 
  type = 'primary', 
  size = 'middle', 
  block = false,
  disabled = false,
  loading = false,
  icon,
  onClick,
  className = ''
}) => {
  return (
    <Button
      className={`discord-button discord-button-${type} ${className}`}
      size={size}
      block={block}
      disabled={disabled}
      loading={loading}
      icon={icon}
      onClick={onClick}
    >
      {children}
    </Button>
  );
};

// Discord 风格任务卡片
export const DiscordTaskCard: React.FC<{
  task: {
    id: string;
    title: string;
    description: string;
    bounty: number;
    status: string;
    priority: string;
    assignee?: {
      username: string;
      avatarUrl?: string;
    };
    publisher: {
      username: string;
      avatarUrl?: string;
    };
    createdAt: string;
    deadline?: string;
    progress?: number;
    tags?: string[];
  };
  onView?: (taskId: string) => void;
  onEdit?: (taskId: string) => void;
  onAssign?: (taskId: string) => void;
}> = ({ task, onView, onEdit, onAssign }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'blue';
      case 'in_progress': return 'orange';
      case 'completed': return 'green';
      case 'cancelled': return 'red';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'blue';
      default: return 'default';
    }
  };

  return (
    <DiscordCard className="discord-task-card" hoverable>
      <div className="task-header">
        <div className="task-title-section">
          <h4 className="task-title">{task.title}</h4>
          <div className="task-meta">
            <Tag color={getStatusColor(task.status)}>{task.status}</Tag>
            <Tag color={getPriorityColor(task.priority)}>{task.priority}</Tag>
            {task.tags?.map(tag => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </div>
        </div>
        <div className="task-bounty">
          <DollarOutlined />
          <span>{task.bounty}</span>
        </div>
      </div>

      <div className="task-description">
        {task.description}
      </div>

      {task.progress !== undefined && (
        <div className="task-progress">
          <Progress percent={task.progress} size="small" />
        </div>
      )}

      <div className="task-users">
        <div className="task-publisher">
          <Avatar 
            size="small" 
            src={task.publisher.avatarUrl} 
            icon={<UserOutlined />} 
          />
          <span>发布者: {task.publisher.username}</span>
        </div>
        {task.assignee && (
          <div className="task-assignee">
            <Avatar 
              size="small" 
              src={task.assignee.avatarUrl} 
              icon={<UserOutlined />} 
            />
            <span>执行者: {task.assignee.username}</span>
          </div>
        )}
      </div>

      <div className="task-footer">
        <div className="task-time">
          <ClockCircleOutlined />
          <span>创建于 {new Date(task.createdAt).toLocaleDateString()}</span>
          {task.deadline && (
            <span>截止 {new Date(task.deadline).toLocaleDateString()}</span>
          )}
        </div>
        <div className="task-actions">
          {onView && (
            <DiscordButton type="secondary" size="small" onClick={() => onView(task.id)}>
              查看
            </DiscordButton>
          )}
          {onEdit && (
            <DiscordButton type="primary" size="small" onClick={() => onEdit(task.id)}>
              编辑
            </DiscordButton>
          )}
          {onAssign && (
            <DiscordButton type="success" size="small" onClick={() => onAssign(task.id)}>
              指派
            </DiscordButton>
          )}
        </div>
      </div>
    </DiscordCard>
  );
};

// Discord 风格用户卡片
export const DiscordUserCard: React.FC<{
  user: {
    id: string;
    username: string;
    email?: string;
    avatarUrl?: string;
    role: string;
    bounty: number;
    tasksCompleted: number;
    rank?: number;
    isOnline?: boolean;
  };
  showActions?: boolean;
  onView?: (userId: string) => void;
  onEdit?: (userId: string) => void;
}> = ({ user, showActions = true, onView, onEdit }) => {
  return (
    <DiscordCard className="discord-user-card" hoverable>
      <div className="user-header">
        <div className="user-avatar-section">
          <Badge 
            dot 
            status={user.isOnline ? 'success' : 'default'}
            offset={[-8, 8]}
          >
            <Avatar 
              size={64} 
              src={user.avatarUrl} 
              icon={<UserOutlined />} 
            />
          </Badge>
        </div>
        <div className="user-info">
          <h4 className="user-name">{user.username}</h4>
          {user.email && <p className="user-email">{user.email}</p>}
          <Tag color="blue">{user.role}</Tag>
          {user.rank && <Tag color="gold">排名 #{user.rank}</Tag>}
        </div>
      </div>

      <div className="user-stats">
        <div className="stat-item">
          <span className="stat-label">总赏金</span>
          <span className="stat-value">{user.bounty}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">完成任务</span>
          <span className="stat-value">{user.tasksCompleted}</span>
        </div>
      </div>

      {showActions && (
        <div className="user-actions">
          {onView && (
            <DiscordButton type="secondary" size="small" onClick={() => onView(user.id)}>
              查看资料
            </DiscordButton>
          )}
          {onEdit && (
            <DiscordButton type="primary" size="small" onClick={() => onEdit(user.id)}>
              编辑
            </DiscordButton>
          )}
        </div>
      )}
    </DiscordCard>
  );
};

// Discord 风格统计卡片
export const DiscordStatsCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'primary' | 'success' | 'warning' | 'danger';
}> = ({ title, value, icon, trend, color = 'primary' }) => {
  return (
    <DiscordCard className={`discord-stats-card stats-${color}`}>
      <div className="stats-header">
        <div className="stats-icon">{icon}</div>
        <div className="stats-info">
          <h4 className="stats-title">{title}</h4>
          <div className="stats-value">{value}</div>
        </div>
      </div>
      {trend && (
        <div className={`stats-trend ${trend.isPositive ? 'positive' : 'negative'}`}>
          <span>{trend.isPositive ? '↗' : '↘'} {Math.abs(trend.value)}%</span>
        </div>
      )}
    </DiscordCard>
  );
};