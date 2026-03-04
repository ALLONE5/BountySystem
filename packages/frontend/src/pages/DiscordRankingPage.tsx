import React, { useState, useEffect } from 'react';
import { Row, Col, Table, Avatar, Tag, Progress, Statistic, Tabs, message, Spin } from 'antd';
import {
  TrophyOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  UserOutlined,
  CrownOutlined,
  StarOutlined,
  FireOutlined,
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { 
  DiscordCard, 
  DiscordUserCard,
  DiscordStatsCard 
} from '../components/discord/DiscordComponents';
import { logger } from '../utils/logger';

const { TabPane } = Tabs;

interface RankingUser {
  id: string;
  username: string;
  email?: string;
  avatarUrl?: string;
  role: string;
  bounty: number;
  tasksCompleted: number;
  rank: number;
  isOnline?: boolean;
  level: number;
  experience: number;
  badges: string[];
  monthlyBounty: number;
  weeklyBounty: number;
}

interface RankingStats {
  totalUsers: number;
  activeUsers: number;
  totalBounty: number;
  avgBounty: number;
}

export const DiscordRankingPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<RankingUser[]>([]);
  const [stats, setStats] = useState<RankingStats | null>(null);
  const [activeTab, setActiveTab] = useState('total');

  useEffect(() => {
    loadRankingData();
  }, []);

  const loadRankingData = async () => {
    try {
      setLoading(true);
      
      // 模拟排行榜数据
      const mockUsers: RankingUser[] = [
        {
          id: '1',
          username: 'CodeMaster',
          avatarUrl: undefined,
          role: 'developer',
          bounty: 15420,
          tasksCompleted: 89,
          rank: 1,
          isOnline: true,
          level: 25,
          experience: 8750,
          badges: ['🏆', '💎', '🔥'],
          monthlyBounty: 3200,
          weeklyBounty: 800,
        },
        {
          id: '2',
          username: 'DesignGuru',
          avatarUrl: undefined,
          role: 'designer',
          bounty: 12890,
          tasksCompleted: 67,
          rank: 2,
          isOnline: true,
          level: 22,
          experience: 7340,
          badges: ['🎨', '⭐', '🚀'],
          monthlyBounty: 2800,
          weeklyBounty: 650,
        },
        {
          id: '3',
          username: 'DataWizard',
          avatarUrl: undefined,
          role: 'analyst',
          bounty: 11250,
          tasksCompleted: 54,
          rank: 3,
          isOnline: false,
          level: 20,
          experience: 6800,
          badges: ['📊', '🧠', '💡'],
          monthlyBounty: 2400,
          weeklyBounty: 580,
        },
        {
          id: '4',
          username: 'FullStackDev',
          avatarUrl: undefined,
          role: 'developer',
          bounty: 9870,
          tasksCompleted: 45,
          rank: 4,
          isOnline: true,
          level: 18,
          experience: 5920,
          badges: ['⚡', '🛠️'],
          monthlyBounty: 2100,
          weeklyBounty: 520,
        },
        {
          id: '5',
          username: 'UIExpert',
          avatarUrl: undefined,
          role: 'designer',
          bounty: 8640,
          tasksCompleted: 38,
          rank: 5,
          isOnline: false,
          level: 16,
          experience: 5200,
          badges: ['🎯', '✨'],
          monthlyBounty: 1900,
          weeklyBounty: 480,
        },
        {
          id: '6',
          username: user?.username || 'CurrentUser',
          avatarUrl: user?.avatarUrl,
          role: user?.role || 'user',
          bounty: 7320,
          tasksCompleted: 32,
          rank: 6,
          isOnline: true,
          level: 14,
          experience: 4650,
          badges: ['🌟'],
          monthlyBounty: 1600,
          weeklyBounty: 420,
        },
      ];

      const mockStats: RankingStats = {
        totalUsers: 156,
        activeUsers: 89,
        totalBounty: 245680,
        avgBounty: 1575,
      };

      setUsers(mockUsers);
      setStats(mockStats);
    } catch (error) {
      message.error('加载排行榜失败');
      logger.error('Failed to load ranking data', { error });
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <CrownOutlined style={{ color: '#FFD700' }} />;
      case 2: return <TrophyOutlined style={{ color: '#C0C0C0' }} />;
      case 3: return <TrophyOutlined style={{ color: '#CD7F32' }} />;
      default: return <span style={{ color: 'var(--discord-text-muted)' }}>#{rank}</span>;
    }
  };

  const getRankColor = (rank: number) => {
    if (rank <= 3) return 'gold';
    if (rank <= 10) return 'blue';
    if (rank <= 50) return 'green';
    return 'default';
  };

  const sortUsersByTab = (tabKey: string) => {
    switch (tabKey) {
      case 'monthly':
        return [...users].sort((a, b) => b.monthlyBounty - a.monthlyBounty);
      case 'weekly':
        return [...users].sort((a, b) => b.weeklyBounty - a.weeklyBounty);
      case 'tasks':
        return [...users].sort((a, b) => b.tasksCompleted - a.tasksCompleted);
      default:
        return [...users].sort((a, b) => b.bounty - a.bounty);
    }
  };

  const columns = [
    {
      title: '排名',
      dataIndex: 'rank',
      key: 'rank',
      width: 80,
      render: (rank: number) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {getRankIcon(rank)}
        </div>
      ),
    },
    {
      title: '用户',
      key: 'user',
      render: (record: RankingUser) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar 
            size={40} 
            src={record.avatarUrl} 
            icon={<UserOutlined />}
            style={{ 
              border: record.id === user?.id ? '2px solid var(--discord-accent)' : 'none'
            }}
          />
          <div>
            <div style={{ 
              color: 'var(--discord-text-primary)', 
              fontWeight: record.id === user?.id ? 600 : 400,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              {record.username}
              {record.id === user?.id && <Tag color="blue">你</Tag>}
              {record.isOnline && <div style={{ 
                width: 8, 
                height: 8, 
                borderRadius: '50%', 
                backgroundColor: 'var(--discord-success)' 
              }} />}
            </div>
            <div style={{ 
              color: 'var(--discord-text-secondary)', 
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}>
              Lv.{record.level} • {record.badges.join(' ')}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: '总赏金',
      dataIndex: 'bounty',
      key: 'bounty',
      render: (bounty: number) => (
        <div style={{ color: 'var(--discord-warning)' }}>
          <DollarOutlined /> ¥{bounty.toLocaleString()}
        </div>
      ),
    },
    {
      title: '完成任务',
      dataIndex: 'tasksCompleted',
      key: 'tasksCompleted',
      render: (count: number) => (
        <div style={{ color: 'var(--discord-success)' }}>
          <CheckCircleOutlined /> {count}
        </div>
      ),
    },
    {
      title: '等级进度',
      key: 'progress',
      render: (record: RankingUser) => {
        const nextLevelExp = (record.level + 1) * 400;
        const currentLevelExp = record.level * 400;
        const progress = ((record.experience - currentLevelExp) / (nextLevelExp - currentLevelExp)) * 100;
        
        return (
          <div style={{ width: 120 }}>
            <Progress 
              percent={Math.round(progress)} 
              size="small" 
              showInfo={false}
              strokeColor="var(--discord-accent)"
            />
            <div style={{ 
              fontSize: '11px', 
              color: 'var(--discord-text-muted)',
              marginTop: 2
            }}>
              {record.experience}/{nextLevelExp} EXP
            </div>
          </div>
        );
      },
    },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="discord-ranking">
      {/* 页面标题 */}
      <DiscordCard style={{ marginBottom: 24 }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ margin: 0, color: 'var(--discord-text-primary)' }}>
            🏆 赏金猎人排行榜
          </h2>
          <p style={{ margin: '8px 0 0 0', color: 'var(--discord-text-secondary)' }}>
            展示平台上最优秀的赏金猎人们
          </p>
        </div>
      </DiscordCard>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <DiscordStatsCard
            title="总用户数"
            value={stats?.totalUsers || 0}
            icon={<UserOutlined />}
            color="primary"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <DiscordStatsCard
            title="活跃用户"
            value={stats?.activeUsers || 0}
            icon={<FireOutlined />}
            color="success"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <DiscordStatsCard
            title="总赏金池"
            value={`¥${stats?.totalBounty?.toLocaleString() || 0}`}
            icon={<DollarOutlined />}
            color="warning"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <DiscordStatsCard
            title="平均赏金"
            value={`¥${stats?.avgBounty || 0}`}
            icon={<StarOutlined />}
            color="danger"
          />
        </Col>
      </Row>

      {/* 排行榜内容 */}
      <DiscordCard>
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          size="large"
        >
          <TabPane tab="总排行榜" key="total">
            <Table
              columns={columns}
              dataSource={sortUsersByTab('total')}
              rowKey="id"
              pagination={{ pageSize: 20 }}
              scroll={{ x: 800 }}
              rowClassName={(record) => 
                record.id === user?.id ? 'current-user-row' : ''
              }
            />
          </TabPane>
          
          <TabPane tab="月度排行" key="monthly">
            <Table
              columns={[
                ...columns.slice(0, 2),
                {
                  title: '月度赏金',
                  dataIndex: 'monthlyBounty',
                  key: 'monthlyBounty',
                  render: (bounty: number) => (
                    <div style={{ color: 'var(--discord-warning)' }}>
                      <DollarOutlined /> ¥{bounty.toLocaleString()}
                    </div>
                  ),
                },
                ...columns.slice(3),
              ]}
              dataSource={sortUsersByTab('monthly')}
              rowKey="id"
              pagination={{ pageSize: 20 }}
              scroll={{ x: 800 }}
              rowClassName={(record) => 
                record.id === user?.id ? 'current-user-row' : ''
              }
            />
          </TabPane>
          
          <TabPane tab="周度排行" key="weekly">
            <Table
              columns={[
                ...columns.slice(0, 2),
                {
                  title: '周度赏金',
                  dataIndex: 'weeklyBounty',
                  key: 'weeklyBounty',
                  render: (bounty: number) => (
                    <div style={{ color: 'var(--discord-warning)' }}>
                      <DollarOutlined /> ¥{bounty.toLocaleString()}
                    </div>
                  ),
                },
                ...columns.slice(3),
              ]}
              dataSource={sortUsersByTab('weekly')}
              rowKey="id"
              pagination={{ pageSize: 20 }}
              scroll={{ x: 800 }}
              rowClassName={(record) => 
                record.id === user?.id ? 'current-user-row' : ''
              }
            />
          </TabPane>
          
          <TabPane tab="任务完成榜" key="tasks">
            <Table
              columns={columns}
              dataSource={sortUsersByTab('tasks')}
              rowKey="id"
              pagination={{ pageSize: 20 }}
              scroll={{ x: 800 }}
              rowClassName={(record) => 
                record.id === user?.id ? 'current-user-row' : ''
              }
            />
          </TabPane>
        </Tabs>
      </DiscordCard>

      <style jsx>{`
        .current-user-row {
          background: rgba(88, 101, 242, 0.1) !important;
          border: 1px solid var(--discord-accent);
        }
        
        .current-user-row:hover {
          background: rgba(88, 101, 242, 0.15) !important;
        }
      `}</style>
    </div>
  );
};