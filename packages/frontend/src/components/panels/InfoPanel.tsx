import React, { useState, useEffect } from 'react';
import { Card, List, Avatar, Badge, Divider, Button, Space, Statistic } from 'antd';
import {
  UserOutlined,
  TrophyOutlined,
  FireOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  BellOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../store/authStore';
import { useNotificationContext } from '../../contexts/NotificationContext';
import './InfoPanel.css';

interface InfoPanelProps {
  className?: string;
}

export const InfoPanel: React.FC<InfoPanelProps> = ({ className }) => {
  const { user } = useAuthStore();
  const { notifications } = useNotificationContext();
  
  // 模拟数据 - 实际项目中应该从 API 获取
  const [onlineUsers] = useState([
    { id: 1, username: 'hunter_001', avatar: null, status: 'online' },
    { id: 2, username: 'bounty_master', avatar: null, status: 'online' },
    { id: 3, username: 'task_expert', avatar: null, status: 'away' },
    { id: 4, username: 'code_ninja', avatar: null, status: 'online' },
  ]);

  const [recentActivities] = useState([
    {
      id: 1,
      type: 'task_completed',
      user: 'hunter_001',
      content: '完成了任务 "API 接口开发"',
      time: '2分钟前',
      bounty: 500,
    },
    {
      id: 2,
      type: 'task_published',
      user: 'bounty_master',
      content: '发布了新任务 "UI 设计优化"',
      time: '5分钟前',
      bounty: 800,
    },
    {
      id: 3,
      type: 'user_joined',
      user: 'new_hunter',
      content: '加入了平台',
      time: '10分钟前',
    },
    {
      id: 4,
      type: 'ranking_update',
      user: 'top_hunter',
      content: '登上了排行榜第一名',
      time: '15分钟前',
    },
  ]);

  const [stats] = useState({
    totalBounty: 12500,
    activeTasks: 23,
    onlineUsers: 156,
    completedToday: 8,
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'task_completed':
        return <FireOutlined style={{ color: '#57f287' }} />;
      case 'task_published':
        return <BellOutlined style={{ color: '#5865f2' }} />;
      case 'user_joined':
        return <UserOutlined style={{ color: '#fee75c' }} />;
      case 'ranking_update':
        return <TrophyOutlined style={{ color: '#ed4245' }} />;
      default:
        return <ClockCircleOutlined />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return '#57f287';
      case 'away':
        return '#fee75c';
      case 'busy':
        return '#ed4245';
      default:
        return '#72767d';
    }
  };

  return (
    <div className={`info-panel ${className || ''}`}>
      {/* 实时统计 */}
      <Card className="stats-card glass-card" title="实时统计" size="small">
        <div className="stats-grid">
          <Statistic
            title="总赏金池"
            value={stats.totalBounty}
            prefix="¥"
            valueStyle={{ color: '#57f287', fontSize: '16px' }}
          />
          <Statistic
            title="活跃任务"
            value={stats.activeTasks}
            valueStyle={{ color: '#5865f2', fontSize: '16px' }}
          />
          <Statistic
            title="在线用户"
            value={stats.onlineUsers}
            valueStyle={{ color: '#fee75c', fontSize: '16px' }}
          />
          <Statistic
            title="今日完成"
            value={stats.completedToday}
            valueStyle={{ color: '#ed4245', fontSize: '16px' }}
          />
        </div>
      </Card>

      <Divider style={{ margin: '16px 0' }} />

      {/* 在线用户 */}
      <Card 
        className="online-users-card glass-card" 
        title={
          <Space>
            <TeamOutlined />
            在线用户
            <Badge count={onlineUsers.length} showZero color="#57f287" />
          </Space>
        }
        size="small"
      >
        <List
          className="online-users-list"
          dataSource={onlineUsers}
          renderItem={(user) => (
            <List.Item className="online-user-item">
              <List.Item.Meta
                avatar={
                  <Badge
                    dot
                    color={getStatusColor(user.status)}
                    offset={[-2, 2]}
                  >
                    <Avatar
                      src={user.avatar}
                      icon={<UserOutlined />}
                      size={32}
                    />
                  </Badge>
                }
                title={
                  <span className="username">{user.username}</span>
                }
                description={
                  <span className="user-status" style={{ color: getStatusColor(user.status) }}>
                    {user.status === 'online' ? '在线' : user.status === 'away' ? '离开' : '忙碌'}
                  </span>
                }
              />
            </List.Item>
          )}
        />
      </Card>

      <Divider style={{ margin: '16px 0' }} />

      {/* 最近活动 */}
      <Card 
        className="recent-activities-card glass-card" 
        title={
          <Space>
            <ClockCircleOutlined />
            最近活动
          </Space>
        }
        size="small"
        extra={
          <Button type="link" size="small">
            查看全部
          </Button>
        }
      >
        <List
          className="activities-list"
          dataSource={recentActivities}
          renderItem={(activity) => (
            <List.Item className="activity-item">
              <List.Item.Meta
                avatar={getActivityIcon(activity.type)}
                title={
                  <div className="activity-content">
                    <span className="activity-user">{activity.user}</span>
                    <span className="activity-text">{activity.content}</span>
                  </div>
                }
                description={
                  <div className="activity-meta">
                    <span className="activity-time">{activity.time}</span>
                    {activity.bounty && (
                      <span className="activity-bounty">
                        +¥{activity.bounty}
                      </span>
                    )}
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Card>

      {/* 快捷操作 */}
      <Card className="quick-actions-card glass-card" title="快捷操作" size="small">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Button type="primary" block icon={<BellOutlined />}>
            发布任务
          </Button>
          <Button block icon={<TrophyOutlined />}>
            查看排行榜
          </Button>
          <Button block icon={<TeamOutlined />}>
            加入组群
          </Button>
        </Space>
      </Card>
    </div>
  );
};