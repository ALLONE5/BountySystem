import React, { useState, useEffect } from 'react';
import { Row, Col, Typography, Space, Button, List, Avatar, Badge, message, Spin } from 'antd';
import {
  UserOutlined,
  FileTextOutlined,
  TeamOutlined,
  TrophyOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { taskApi } from '../api/task';
import { userApi } from '../api/user';
import { 
  DiscordCard, 
  DiscordButton, 
  DiscordTaskCard, 
  DiscordUserCard, 
  DiscordStatsCard 
} from '../components/discord/DiscordComponents';

const { Title, Text } = Typography;

interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  totalBounty: number;
  rank: number;
  onlineUsers: number;
}

interface RecentTask {
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
}

interface OnlineUser {
  id: string;
  username: string;
  avatarUrl?: string;
  status: 'online' | 'away' | 'busy';
}

export const DiscordDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentTasks, setRecentTasks] = useState<RecentTask[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // 模拟加载数据
      const mockStats: DashboardStats = {
        totalTasks: 156,
        completedTasks: 89,
        inProgressTasks: 23,
        totalBounty: 12450,
        rank: 5,
        onlineUsers: 42,
      };

      const mockTasks: RecentTask[] = [
        {
          id: '1',
          title: '优化用户界面响应速度',
          description: '需要对现有的用户界面进行性能优化，提升响应速度和用户体验。',
          bounty: 500,
          status: 'in_progress',
          priority: 'high',
          publisher: {
            username: 'ProjectManager',
            avatarUrl: undefined,
          },
          assignee: {
            username: user?.username || 'Unknown',
            avatarUrl: user?.avatarUrl,
          },
          createdAt: new Date().toISOString(),
          progress: 65,
          tags: ['前端', 'React', '性能优化'],
        },
        {
          id: '2',
          title: '数据库查询优化',
          description: '优化数据库查询语句，提升系统整体性能。',
          bounty: 800,
          status: 'open',
          priority: 'medium',
          publisher: {
            username: 'TechLead',
            avatarUrl: undefined,
          },
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          tags: ['后端', 'SQL', '数据库'],
        },
        {
          id: '3',
          title: '移动端适配',
          description: '为现有网站添加移动端适配，确保在各种设备上的良好体验。',
          bounty: 600,
          status: 'completed',
          priority: 'medium',
          publisher: {
            username: 'Designer',
            avatarUrl: undefined,
          },
          assignee: {
            username: 'FrontendDev',
            avatarUrl: undefined,
          },
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          progress: 100,
          tags: ['前端', '响应式', 'CSS'],
        },
      ];

      const mockOnlineUsers: OnlineUser[] = [
        { id: '1', username: 'Alice', status: 'online' },
        { id: '2', username: 'Bob', status: 'away' },
        { id: '3', username: 'Charlie', status: 'online' },
        { id: '4', username: 'Diana', status: 'busy' },
      ];

      const mockActivities = [
        { id: '1', text: '用户 Alice 完成了任务 "API接口开发"', time: '2分钟前', type: 'success' },
        { id: '2', text: '新任务 "UI设计优化" 已发布', time: '5分钟前', type: 'info' },
        { id: '3', text: '用户 Bob 加入了项目组 "前端开发团队"', time: '10分钟前', type: 'info' },
        { id: '4', text: '任务 "数据库迁移" 即将到期', time: '15分钟前', type: 'warning' },
      ];

      setStats(mockStats);
      setRecentTasks(mockTasks);
      setOnlineUsers(mockOnlineUsers);
      setActivities(mockActivities);
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleTaskView = (taskId: string) => {
    // 这里可以打开任务详情抽屉或导航到任务详情页
    message.info(`查看任务 ${taskId}`);
  };

  const handleTaskEdit = (taskId: string) => {
    navigate(`/tasks/edit/${taskId}`);
  };

  const handleTaskAssign = (taskId: string) => {
    message.info(`指派任务 ${taskId}`);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="discord-dashboard">
      {/* 欢迎区域 */}
      <DiscordCard className="welcome-section" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Avatar size={64} src={user?.avatarUrl} icon={<UserOutlined />} />
          <div>
            <Title level={2} style={{ margin: 0, color: 'var(--discord-text-primary)' }}>
              欢迎回来, {user?.username}! 👋
            </Title>
            <Text style={{ color: 'var(--discord-text-secondary)' }}>
              今天是个完成任务的好日子，让我们开始工作吧！
            </Text>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <Space>
              <DiscordButton 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => navigate('/tasks/create')}
              >
                发布新任务
              </DiscordButton>
              <DiscordButton 
                type="secondary"
                onClick={() => navigate('/tasks/browse')}
              >
                浏览任务
              </DiscordButton>
            </Space>
          </div>
        </div>
      </DiscordCard>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <DiscordStatsCard
            title="总任务数"
            value={stats?.totalTasks || 0}
            icon={<FileTextOutlined />}
            color="primary"
            trend={{ value: 12, isPositive: true }}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <DiscordStatsCard
            title="已完成"
            value={stats?.completedTasks || 0}
            icon={<CheckCircleOutlined />}
            color="success"
            trend={{ value: 8, isPositive: true }}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <DiscordStatsCard
            title="总赏金"
            value={`¥${stats?.totalBounty || 0}`}
            icon={<DollarOutlined />}
            color="warning"
            trend={{ value: 15, isPositive: true }}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <DiscordStatsCard
            title="当前排名"
            value={`#${stats?.rank || 0}`}
            icon={<TrophyOutlined />}
            color="danger"
            trend={{ value: 2, isPositive: false }}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* 最近任务 */}
        <Col xs={24} lg={16}>
          <DiscordCard 
            title="最近任务" 
            extra={
              <DiscordButton 
                type="secondary" 
                size="small"
                onClick={() => navigate('/tasks/published')}
              >
                查看全部
              </DiscordButton>
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {recentTasks.map(task => (
                <DiscordTaskCard
                  key={task.id}
                  task={task}
                  onView={handleTaskView}
                  onEdit={handleTaskEdit}
                  onAssign={handleTaskAssign}
                />
              ))}
            </div>
          </DiscordCard>
        </Col>

        {/* 侧边栏信息 */}
        <Col xs={24} lg={8}>
          {/* 在线用户 */}
          <DiscordCard 
            title="在线用户" 
            style={{ marginBottom: 16 }}
            extra={<Badge count={onlineUsers.length} showZero />}
          >
            <List
              size="small"
              dataSource={onlineUsers}
              renderItem={user => (
                <List.Item style={{ padding: '8px 0', border: 'none' }}>
                  <List.Item.Meta
                    avatar={
                      <Badge 
                        dot 
                        status={
                          user.status === 'online' ? 'success' : 
                          user.status === 'away' ? 'warning' : 'error'
                        }
                      >
                        <Avatar size="small" src={user.avatarUrl} icon={<UserOutlined />} />
                      </Badge>
                    }
                    title={
                      <span style={{ color: 'var(--discord-text-primary)', fontSize: '14px' }}>
                        {user.username}
                      </span>
                    }
                  />
                </List.Item>
              )}
            />
          </DiscordCard>

          {/* 最新动态 */}
          <DiscordCard title="最新动态">
            <List
              size="small"
              dataSource={activities}
              renderItem={activity => (
                <List.Item style={{ padding: '8px 0', border: 'none' }}>
                  <div style={{ width: '100%' }}>
                    <div style={{ 
                      color: 'var(--discord-text-secondary)', 
                      fontSize: '13px',
                      marginBottom: '4px'
                    }}>
                      {activity.text}
                    </div>
                    <div style={{ 
                      color: 'var(--discord-text-muted)', 
                      fontSize: '11px' 
                    }}>
                      {activity.time}
                    </div>
                  </div>
                </List.Item>
              )}
            />
          </DiscordCard>
        </Col>
      </Row>
    </div>
  );
};