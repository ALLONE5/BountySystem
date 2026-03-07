import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Progress, List, Avatar, Badge, Spin, message } from 'antd';
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
import { 
  systemMonitorApi, 
  SystemStats, 
  OnlineUser, 
  SystemPerformance, 
  ActivityLog 
} from '../../api/systemMonitor';
import './AdminDashboardPage.css';
import { logger } from '../../utils/logger';

export const AdminDashboardPage: React.FC = () => {
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
  const [performance, setPerformance] = useState<SystemPerformance>({
    cpuUsage: 0,
    memoryUsage: 0,
    diskUsage: 0,
    networkLoad: 0,
    uptime: '0分钟'
  });
  const [activities, setActivities] = useState<ActivityLog[]>([]);

  useEffect(() => {
    loadDashboardData();
    // 设置定时刷新
    const interval = setInterval(loadDashboardData, 30000); // 30秒刷新一次
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // 使用新的API获取仪表盘数据
      const dashboardData = await systemMonitorApi.getDashboard();
      
      setStats(dashboardData.stats);
      setOnlineUsers(dashboardData.onlineUsers);
      setPerformance(dashboardData.performance);
      setActivities(dashboardData.activities);
      
      setLoading(false);
    } catch (error) {
      logger.error('Failed to load dashboard data:', error);
      message.error('加载仪表盘数据失败');
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
              styles={{ content: { color: '#1890ff' } }}
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
              styles={{ content: { color: '#52c41a' } }}
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
              styles={{ content: { color: '#faad14' } }}
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
              styles={{ content: { color: '#722ed1' } }}
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
                    percent={performance.cpuUsage} 
                    strokeColor="#52c41a"
                    trailColor="rgba(0,0,0,0.1)"
                  />
                </div>
                
                <div className="metric-item">
                  <div className="metric-label">内存使用率</div>
                  <Progress 
                    percent={performance.memoryUsage} 
                    strokeColor="#1890ff"
                    trailColor="rgba(0,0,0,0.1)"
                  />
                </div>
                
                <div className="metric-item">
                  <div className="metric-label">磁盘使用率</div>
                  <Progress 
                    percent={performance.diskUsage} 
                    strokeColor="#faad14"
                    trailColor="rgba(0,0,0,0.1)"
                  />
                </div>
                
                <div className="metric-item">
                  <div className="metric-label">网络负载</div>
                  <Progress 
                    percent={performance.networkLoad} 
                    strokeColor="#722ed1"
                    trailColor="rgba(0,0,0,0.1)"
                  />
                </div>
                
                <div className="metric-item">
                  <div className="metric-label">系统运行时间</div>
                  <div className="uptime-display">{performance.uptime}</div>
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
              dataSource={activities}
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