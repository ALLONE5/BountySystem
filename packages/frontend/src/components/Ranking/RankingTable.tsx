import React from 'react';
import { Table, Avatar } from 'antd';
import { CrownOutlined, UserOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { Ranking } from '../../types';

interface RankingTableProps {
  rankings: Ranking[];
  loading: boolean;
  currentUserId?: string;
}

export const RankingTable: React.FC<RankingTableProps> = ({
  rankings,
  loading,
  currentUserId,
}) => {
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

  return (
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
        record.userId === currentUserId ? 'highlight-row' : ''
      }
      className="ranking-table"
    />
  );
};