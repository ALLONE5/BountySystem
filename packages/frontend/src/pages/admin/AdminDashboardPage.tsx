import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Progress, List, Avatar, Badge, Spin } from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  FileTextOutlined,
  DollarOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import './AdminDashboardPage.css';

interface SystemStats {
  totalUsers: number;
  onlineUsers: number;
  totalTasks: number;
  activeTasks: number;
  totalBounty: number;
  completedTasks: number;
}

interface OnlineUser {
  id: string;
  username: string;
  avatarUrl?: string;
  lastActive: string;
  status: 'online' | 'away' | 'busy';
}

export const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    onlineUsers: 0,
    totalTasks: 0,
    activeTasks: 0,
    totalBounty: 0,
    completedTasks: 0,
  });
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);

  useEffect(() => {
    loadDashboardData();
    // 设置定时刷新
    const interval = setInterval(loadDashboardData, 30000); // 30秒刷新一次
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // 模拟数据加载 - 实际项目中应该调用API
      setTimeout(() => {
        setStats({
          totalUsers: 1247,
          onlineUsers: 89,
          totalTasks: 3456,
          activeTasks: 234,
          totalBounty: 125678.50,
          completedTasks: 2890,
        });
        
        setOnlineUsers([
          { id: '1', username: 'Alice', status: 'online', lastActive: '刚刚' },
          { id: '2', username: 'Bob', status: 'away', lastActive: '5分钟前' },
          { id: '3', username: 'Charlie', status: 'busy', lastActive: '2分钟前' },
          { id: '4', username: 'Diana', status: 'online', lastActive: '1分钟前' },
          { id: '5', username: 'Eve', status: 'away', lastActive: '10分钟前' },
        ]);
        
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return '#52c41a';
      case 'away': return '#faad14';
      case 'busy': return '#f5222d';
      default: return '#d9d9d9';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return '在线';
      case 'away': return '离开';
      case 'busy': return '忙碌';
      default: return '离线';
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard-loading">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>监控仪表盘</h1>
        <p>系统运行状态总览</p>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[24, 24]} className="stats-row">
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card users-card">
            <Statistic
              title="总用户数"
              value={stats.totalUsers}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
            <div className="stat-extra">
              <span className="online-count">
                在线: {stats.onlineUsers}
              </span>
            </div>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card tasks-card">
            <Statistic
              title="任务总数"
              value={stats.totalTasks}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
            <div className="stat-extra">
              <span className="active-count">
                活跃: {stats.activeTasks}
              </span>
            </div>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card bounty-card">
            <Statistic
              title="总赏金池"
              value={stats.totalBounty}
              prefix={<DollarOutlined />}
              precision={2}
              valueStyle={{ color: '#faad14' }}
            />
            <div className="stat-extra">
              <span className="currency">CNY</span>
            </div>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card completion-card">
            <Statistic
              title="完成任务"
              value={stats.completedTasks}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
            <div className="stat-extra">
              <Progress 
                percent={Math.round((stats.completedTasks / stats.totalTasks) * 100)} 
                size="small" 
                showInfo={false}
                strokeColor="#722ed1"
              />
            </div>
          </Card>
        </Col>
      </Row>

      {/* 详细监控面板 */}
      <Row gutter={[24, 24]} className="monitoring-row">
        {/* 在线用户列表 */}
        <Col xs={24} lg={12}>
          <Card 
            title={
              <div className="card-title">
                <TeamOutlined />
                <span>在线用户</span>
                <Badge count={stats.onlineUsers} style={{ marginLeft: 8 }} />
              </div>
            }
            className="monitoring-card online-users-card"
          >
            <List
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
                          src={user.avatarUrl} 
                          icon={<UserOutlined />}
                          size={40}
                        />
                      </Badge>
                    }
                    title={
                      <div className="user-title">
                        <span className="username">{user.username}</span>
                        <span 
                          className="status-badge"
                          style={{ color: getStatusColor(user.status) }}
                        >
                          {getStatusText(user.status)}
                        </span>
                      </div>
                    }
                    description={
                      <div className="user-description">
                        <ClockCircleOutlined />
                        <span>最后活跃: {user.lastActive}</span>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* 系统性能监控 */}
        <Col xs={24} lg={12}>
          <Card 
            title={
              <div className="card-title">
                <TrophyOutlined />
                <span>系统性能</span>
              </div>
            }
            className="monitoring-card performance-card"
          >
            <div className="performance-metrics">
              <div className="metric-item">
                <div className="metric-label">CPU 使用率</div>
                <Progress 
                  percent={45} 
                  strokeColor="#52c41a"
                  trailColor="rgba(0,0,0,0.1)"
                />
              </div>
              
              <div className="metric-item">
                <div className="metric-label">内存使用率</div>
                <Progress 
                  percent={68} 
                  strokeColor="#1890ff"
                  trailColor="rgba(0,0,0,0.1)"
                />
              </div>
              
              <div className="metric-item">
                <div className="metric-label">磁盘使用率</div>
                <Progress 
                  percent={32} 
                  strokeColor="#faad14"
                  trailColor="rgba(0,0,0,0.1)"
                />
              </div>
              
              <div className="metric-item">
                <div className="metric-label">网络负载</div>
                <Progress 
                  percent={23} 
                  strokeColor="#722ed1"
                  trailColor="rgba(0,0,0,0.1)"
                />
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 实时活动监控 */}
      <Row gutter={[24, 24]} className="activity-row">
        <Col span={24}>
          <Card 
            title={
              <div className="card-title">
                <ExclamationCircleOutlined />
                <span>实时活动</span>
              </div>
            }
            className="monitoring-card activity-card"
          >
            <List
              dataSource={[
                { id: 1, type: 'task_created', user: 'Alice', action: '创建了新任务', time: '2分钟前', status: 'success' },
                { id: 2, type: 'task_completed', user: 'Bob', action: '完成了任务', time: '5分钟前', status: 'success' },
                { id: 3, type: 'user_login', user: 'Charlie', action: '登录系统', time: '8分钟前', status: 'info' },
                { id: 4, type: 'bounty_awarded', user: 'Diana', action: '获得赏金奖励', time: '12分钟前', status: 'warning' },
                { id: 5, type: 'group_joined', user: 'Eve', action: '加入了项目组', time: '15分钟前', status: 'info' },
              ]}
              renderItem={(activity) => (
                <List.Item className="activity-item">
                  <div className="activity-content">
                    <div className="activity-main">
                      <span className="activity-user">{activity.user}</span>
                      <span className="activity-action">{activity.action}</span>
                    </div>
                    <div className="activity-time">
                      <ClockCircleOutlined />
                      <span>{activity.time}</span>
                    </div>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};