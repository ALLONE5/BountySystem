import React, { useEffect, useState } from 'react';
import {
  Typography,
  Card,
  Table,
  Tabs,
  Avatar,
  Tag,
  Space,
  Select,
  Row,
  Col,
  Statistic,
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

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

export const RankingPage: React.FC = () => {
  const { user } = useAuthStore();
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [myRanking, setMyRanking] = useState<Ranking | null>(null);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState<'monthly' | 'quarterly' | 'all_time'>('monthly');
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [quarter, setQuarter] = useState(Math.ceil((new Date().getMonth() + 1) / 3));

  useEffect(() => {
    loadRankings();
  }, [period, year, month, quarter]);

  const loadRankings = async () => {
    try {
      setLoading(true);
      const params: any = { period, year };
      
      if (period === 'monthly') {
        params.month = month;
      } else if (period === 'quarterly') {
        params.quarter = quarter;
      }

      const [rankingsData, myRankingData] = await Promise.all([
        rankingApi.getRankings(params).catch(() => []),
        user ? rankingApi.getMyRanking(user.id, params).catch(() => null) : Promise.resolve(null),
      ]);

      setRankings(rankingsData || []);
      setMyRanking(myRankingData);
    } catch (error) {
      console.error('Failed to load rankings:', error);
      // Don't show error message - empty rankings are acceptable
      setRankings([]);
      setMyRanking(null);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) {
      return <CrownOutlined style={{ color: '#FFD700', fontSize: 24 }} />;
    } else if (rank === 2) {
      return <TrophyOutlined style={{ color: '#C0C0C0', fontSize: 24 }} />;
    } else if (rank === 3) {
      return <TrophyOutlined style={{ color: '#CD7F32', fontSize: 24 }} />;
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
      align: 'center',
      render: (rank: number) => getRankIcon(rank),
    },
    {
      title: '用户',
      key: 'user',
      width: 250,
      render: (_, record) => (
        <Space size={12}>
          <Avatar
            size={48}
            icon={<UserOutlined />}
            src={record.user?.avatarUrl}
            style={{ border: '2px solid #f0f0f0' }}
          />
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>
              {record.user?.username || '未知用户'}
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.user?.email}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: '累计赏金',
      dataIndex: 'totalBounty',
      key: 'totalBounty',
      width: 180,
      align: 'right',
      render: (amount: number) => (
        <span style={{ fontSize: 20, fontWeight: 700, color: '#f5222d' }}>
          ${amount.toFixed(2)}
        </span>
      ),
    },
    {
      title: '任务完成数',
      dataIndex: 'completedTasksCount',
      key: 'completedTasksCount',
      width: 150,
      align: 'center',
      render: (count: number) => (
        <Tag color="blue">{count || 0} 个任务</Tag>
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'calculatedAt',
      key: 'calculatedAt',
      width: 150,
      render: (date: Date) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
  ];

  const getPeriodText = () => {
    if (period === 'monthly') {
      return `${year}年${month}月`;
    } else if (period === 'quarterly') {
      return `${year}年第${quarter}季度`;
    }
    return '总累积';
  };

  const renderMyRankingCard = () => {
    if (!myRanking) {
      const getNoRankingMessage = () => {
        if (period === 'monthly') {
          return `${year}年${month}月未参与排名`;
        } else if (period === 'quarterly') {
          return `${year}年第${quarter}季度未参与排名`;
        }
        return '总累积期间未参与排名';
      };

      return (
        <Card style={{ textAlign: 'center', padding: '24px 0' }}>
          <Text type="secondary" style={{ fontSize: 16 }}>{getNoRankingMessage()}</Text>
        </Card>
      );
    }

    const rankColor = getRankColor(myRanking.rank) || '#1890ff';

    return (
      <Card
        style={{
          background: `linear-gradient(135deg, ${rankColor} 0%, ${rankColor}dd 100%)`,
          color: 'white',
          borderLeft: `8px solid ${rankColor}`,
        }}
        className="stat-card"
      >
        <Row gutter={24} align="middle">
          <Col xs={24} sm={8} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 64, marginBottom: 8 }}>
              {myRanking.rank === 1 && <CrownOutlined style={{ color: '#FFD700' }} />}
              {myRanking.rank === 2 && <TrophyOutlined style={{ color: '#C0C0C0' }} />}
              {myRanking.rank === 3 && <TrophyOutlined style={{ color: '#CD7F32' }} />}
              {myRanking.rank > 3 && <TrophyOutlined />}
            </div>
            <Text style={{ color: 'white', fontSize: 20, fontWeight: 600 }}>
              第 {myRanking.rank} 名
            </Text>
          </Col>
          <Col xs={12} sm={8}>
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14 }}>累计赏金</span>}
              value={myRanking.totalBounty}
              precision={2}
              prefix="$"
              styles={{ content: { color: 'white', fontSize: 28, fontWeight: 700 } }}
            />
          </Col>
          <Col xs={12} sm={8}>
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14 }}>统计周期</span>}
              value={getPeriodText()}
              styles={{ content: { color: 'white', fontSize: 18, fontWeight: 600 } }}
            />
          </Col>
        </Row>
      </Card>
    );
  };

  return (
    <div className="page-container fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <Title level={2} style={{ margin: 0 }}>
            <TrophyOutlined /> 赏金排名
          </Title>
          <Text type="secondary">查看用户赏金排行榜</Text>
        </div>
      </div>

      {/* 我的排名卡片 */}
      <div style={{ marginBottom: 24 }}>
        {loading ? (
          <Card>
            <Spin />
          </Card>
        ) : (
          renderMyRankingCard()
        )}
      </div>

      {/* 排名列表 */}
      <Card>
        <Tabs
          activeKey={period}
          onChange={(key) => setPeriod(key as any)}
          tabBarExtraContent={
            <Space>
              {period !== 'all_time' && (
                <>
                  <Select
                    value={year}
                    onChange={setYear}
                    style={{ width: 100 }}
                  >
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                      <Option key={y} value={y}>
                        {y}年
                      </Option>
                    ))}
                  </Select>
                  {period === 'monthly' && (
                    <Select
                      value={month}
                      onChange={setMonth}
                      style={{ width: 80 }}
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                        <Option key={m} value={m}>
                          {m}月
                        </Option>
                      ))}
                    </Select>
                  )}
                  {period === 'quarterly' && (
                    <Select
                      value={quarter}
                      onChange={setQuarter}
                      style={{ width: 100 }}
                    >
                      <Option value={1}>第1季度</Option>
                      <Option value={2}>第2季度</Option>
                      <Option value={3}>第3季度</Option>
                      <Option value={4}>第4季度</Option>
                    </Select>
                  )}
                </>
              )}
            </Space>
          }
        >
          <TabPane tab="本月排名" key="monthly">
            <Table
              columns={columns}
              dataSource={rankings}
              rowKey={(record) => `${record.userId}-${record.period}`}
              loading={loading}
              pagination={{
                showSizeChanger: true,
                showTotal: (total) => `共 ${total} 名用户`,
              }}
              rowClassName={(record) =>
                record.userId === user?.id ? 'highlight-row' : ''
              }
            />
          </TabPane>
          <TabPane tab="本季度排名" key="quarterly">
            <Table
              columns={columns}
              dataSource={rankings}
              rowKey={(record) => `${record.userId}-${record.period}`}
              loading={loading}
              pagination={{
                showSizeChanger: true,
                showTotal: (total) => `共 ${total} 名用户`,
              }}
              rowClassName={(record) =>
                record.userId === user?.id ? 'highlight-row' : ''
              }
            />
          </TabPane>
          <TabPane tab="总累积排名" key="all_time">
            <Table
              columns={columns}
              dataSource={rankings}
              rowKey={(record) => `${record.userId}-${record.period}`}
              loading={loading}
              pagination={{
                showSizeChanger: true,
                showTotal: (total) => `共 ${total} 名用户`,
              }}
              rowClassName={(record) =>
                record.userId === user?.id ? 'highlight-row' : ''
              }
            />
          </TabPane>
        </Tabs>
      </Card>

      <style>{`
        .highlight-row {
          background-color: #e6f7ff !important;
        }
        .highlight-row:hover {
          background-color: #bae7ff !important;
        }
      `}</style>
    </div>
  );
};
