import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Tabs,
  Avatar,
  Select,
  Row,
  Col,
  Spin,
} from 'antd';
import {
  TrophyOutlined,
  CrownOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { rankingApi } from '../api/ranking';
import { useAuthStore } from '../store/authStore';
import { Ranking } from '../types';
import './RankingPage.css';

const { Option } = Select;

export const RankingPage: React.FC = () => {
  const { user } = useAuthStore();
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [myRanking, setMyRanking] = useState<Ranking | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'monthly' | 'quarterly' | 'all_time'>('monthly');
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [quarter, setQuarter] = useState(Math.ceil((new Date().getMonth() + 1) / 3));

  useEffect(() => {
    loadRankings();
  }, [activeTab, year, month, quarter]);

  const loadRankings = async () => {
    try {
      setLoading(true);
      const params: any = { period: activeTab, year };
      
      if (activeTab === 'monthly') {
        params.month = month;
      } else if (activeTab === 'quarterly') {
        params.quarter = quarter;
      }

      const data = await rankingApi.getRankings(params);
      setRankings(data.rankings || []);
      setMyRanking(data.myRanking || null);
    } catch (error) {
      console.error('Failed to load rankings:', error);
      setRankings([]);
      setMyRanking(null);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) {
      return <CrownOutlined style={{ color: '#FFD700', fontSize: 20 }} />;
    } else if (rank === 2) {
      return <CrownOutlined style={{ color: '#C0C0C0', fontSize: 18 }} />;
    } else if (rank === 3) {
      return <CrownOutlined style={{ color: '#CD7F32', fontSize: 16 }} />;
    }
    return <span style={{ fontSize: 18, fontWeight: 'bold' }}>{rank}</span>;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return '#FFD700';
    if (rank === 2) return '#C0C0C0';
    if (rank === 3) return '#CD7F32';
    return undefined;
  };

  const columns: ColumnsType<Ranking> = [
    {
      title: '排名',
      dataIndex: 'rank',
      key: 'rank',
      width: 80,
      render: (rank: number) => (
        <div className="rank-cell">
          {getRankIcon(rank)}
        </div>
      ),
    },
    {
      title: '用户',
      key: 'user',
      render: (_, record) => (
        <div className="user-cell">
          <Avatar
            size={40}
            src={record.user?.avatarUrl}
            icon={<UserOutlined />}
          />
          <div className="user-info">
            <div className="username">{record.user?.username || '未知用户'}</div>
            <div className="user-id">ID: {record.userId}</div>
          </div>
        </div>
      ),
    },
    {
      title: '总赏金',
      dataIndex: 'totalBounty',
      key: 'totalBounty',
      width: 120,
      render: (bounty: number) => (
        <span className="bounty-amount">
          ${bounty?.toFixed(2) || '0.00'}
        </span>
      ),
      sorter: (a, b) => (a.totalBounty || 0) - (b.totalBounty || 0),
    },
    {
      title: '统计信息',
      key: 'stats',
      render: (_, record) => (
        <div className="stats-display">
          <div className="stat-badge">
            任务: {record.completedTasksCount || record.completedTasks || 0}
          </div>
          <div className="stat-badge">
            积分: {record.totalPoints || record.totalBounty || 0}
          </div>
        </div>
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 120,
      render: (date: string) => dayjs(date).format('MM-DD HH:mm'),
    },
  ];

  const getPeriodText = () => {
    if (activeTab === 'monthly') {
      return `${year}年${month}月`;
    } else if (activeTab === 'quarterly') {
      return `${year}年第${quarter}季度`;
    }
    return '总累积';
  };

  const renderMyRankingCard = () => {
    if (!myRanking) {
      const periodText = () => {
        if (activeTab === 'monthly') {
          return `${year}年${month}月未参与排名`;
        } else if (activeTab === 'quarterly') {
          return `${year}年第${quarter}季度未参与排名`;
        }
        return '总累积期间未参与排名';
      };

      return (
        <Card className="ranking-card no-ranking-card">
          <div className="no-ranking-content">
            <TrophyOutlined className="no-ranking-icon" />
            <h3 className="no-ranking-title">暂无排名</h3>
            <p className="no-ranking-description">{periodText()}</p>
          </div>
        </Card>
      );
    }

    const rankColor = getRankColor(myRanking.rank);
    const isTopThree = myRanking.rank <= 3;

    return (
      <Card className={`ranking-card my-ranking-card ${isTopThree ? 'top-three' : ''}`}>
        <div className="ranking-gradient" style={{ background: `linear-gradient(135deg, ${rankColor}20, ${rankColor}10)` }} />
        <div className="my-ranking-content">
          <div className="my-ranking-header">
            <h3 className="my-ranking-title">我的排名 - {getPeriodText()}</h3>
            <div className="my-ranking-badge">
              第 {myRanking.rank} 名
            </div>
          </div>
          <Row gutter={24} className="my-ranking-stats">
            <Col span={6}>
              <div className="stat-item">
                <div className="stat-value">${myRanking.totalBounty?.toFixed(2) || '0.00'}</div>
                <div className="stat-label">总赏金</div>
              </div>
            </Col>
            <Col span={6}>
              <div className="stat-item">
                <div className="stat-value">{myRanking.completedTasksCount || myRanking.completedTasks || 0}</div>
                <div className="stat-label">完成任务</div>
              </div>
            </Col>
            <Col span={6}>
              <div className="stat-item">
                <div className="stat-value">{myRanking.totalPoints || myRanking.totalBounty || 0}</div>
                <div className="stat-label">总积分</div>
              </div>
            </Col>
            <Col span={6}>
              <div className="stat-item">
                <div className="stat-value">{myRanking.rank}</div>
                <div className="stat-label">当前排名</div>
              </div>
            </Col>
          </Row>
        </div>
      </Card>
    );
  };

  return (
    <div className="ranking-page animate-fade-in-up">
      {/* 页面头部 */}
      <div className="page-header">
        <div className="header-content">
          <div className="header-title">
            <TrophyOutlined className="header-icon" />
            <h1>赏金排行榜</h1>
          </div>
          <p className="header-subtitle">查看用户赏金排行榜和竞争情况</p>
        </div>
      </div>

      {/* 我的排名卡片 */}
      <div className="my-ranking-section">
        {loading ? (
          <Card className="loading-card">
            <Spin size="large" />
          </Card>
        ) : (
          renderMyRankingCard()
        )}
      </div>

      {/* 排名列表 */}
      <Card className="ranking-list-card">
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as 'monthly' | 'quarterly' | 'all_time')}
          className="ranking-tabs"
          tabBarExtraContent={
            <div className="tab-controls">
              {activeTab !== 'all_time' && (
                <>
                  <Select
                    value={year}
                    onChange={setYear}
                    className="year-select"
                  >
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                      <Option key={y} value={y}>
                        {y}年
                      </Option>
                    ))}
                  </Select>
                  {activeTab === 'monthly' && (
                    <Select
                      value={month}
                      onChange={setMonth}
                      className="month-select"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                        <Option key={m} value={m}>
                          {m}月
                        </Option>
                      ))}
                    </Select>
                  )}
                  {activeTab === 'quarterly' && (
                    <Select
                      value={quarter}
                      onChange={setQuarter}
                      className="quarter-select"
                    >
                      <Option value={1}>第1季度</Option>
                      <Option value={2}>第2季度</Option>
                      <Option value={3}>第3季度</Option>
                      <Option value={4}>第4季度</Option>
                    </Select>
                  )}
                </>
              )}
            </div>
          }
          items={[
            {
              key: 'monthly',
              label: '本月排名',
              children: (
                <Table
                  columns={columns}
                  dataSource={rankings}
                  rowKey={(record) => `${record.userId}-${record.period}`}
                  loading={loading}
                  pagination={{
                    showSizeChanger: true,
                    showTotal: (total) => `共 ${total} 名用户`,
                    pageSize: 20,
                  }}
                  rowClassName={(record) =>
                    record.userId === user?.id ? 'highlight-row' : ''
                  }
                  className="ranking-table"
                />
              )
            },
            {
              key: 'quarterly',
              label: '本季度排名',
              children: (
                <Table
                  columns={columns}
                  dataSource={rankings}
                  rowKey={(record) => `${record.userId}-${record.period}`}
                  loading={loading}
                  pagination={{
                    showSizeChanger: true,
                    showTotal: (total) => `共 ${total} 名用户`,
                    pageSize: 20,
                  }}
                  rowClassName={(record) =>
                    record.userId === user?.id ? 'highlight-row' : ''
                  }
                  className="ranking-table"
                />
              )
            },
            {
              key: 'all_time',
              label: '总累积排名',
              children: (
                <Table
                  columns={columns}
                  dataSource={rankings}
                  rowKey={(record) => `${record.userId}-${record.period}`}
                  loading={loading}
                  pagination={{
                    showSizeChanger: true,
                    showTotal: (total) => `共 ${total} 名用户`,
                    pageSize: 20,
                  }}
                  rowClassName={(record) =>
                    record.userId === user?.id ? 'highlight-row' : ''
                  }
                  className="ranking-table"
                />
              )
            }
          ]}
        />
      </Card>
    </div>
  );
};