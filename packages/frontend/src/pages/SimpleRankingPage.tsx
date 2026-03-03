import React from 'react';
import { Card, Typography, List, Avatar } from 'antd';
import { TrophyOutlined, CrownOutlined, StarOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const mockRankings = [
  {
    id: '1',
    username: 'developer1',
    totalBounty: 2500,
    completedTasks: 15,
    rank: 1,
  },
  {
    id: '2',
    username: 'designer1',
    totalBounty: 2200,
    completedTasks: 12,
    rank: 2,
  },
  {
    id: '3',
    username: 'manager1',
    totalBounty: 1800,
    completedTasks: 10,
    rank: 3,
  },
  {
    id: '4',
    username: 'developer2',
    totalBounty: 1500,
    completedTasks: 8,
    rank: 4,
  },
];

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1: return <CrownOutlined style={{ color: '#ffd700' }} />;
    case 2: return <TrophyOutlined style={{ color: '#c0c0c0' }} />;
    case 3: return <StarOutlined style={{ color: '#cd7f32' }} />;
    default: return <span style={{ fontWeight: 'bold' }}>#{rank}</span>;
  }
};

export const SimpleRankingPage: React.FC = () => {
  return (
    <div style={{ padding: '20px', minHeight: '100vh', background: '#f0f2f5' }}>
      <Card>
        <Title level={2}>🏆 排行榜</Title>
        <Text type="secondary">查看用户赏金排名</Text>
        
        <List
          style={{ marginTop: '20px' }}
          dataSource={mockRankings}
          renderItem={(user) => (
            <List.Item
              actions={[
                <Text strong>¥{user.totalBounty}</Text>,
                <Text type="secondary">{user.completedTasks}个任务</Text>
              ]}
            >
              <List.Item.Meta
                avatar={
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {getRankIcon(user.rank)}
                    <Avatar>{user.username[0].toUpperCase()}</Avatar>
                  </div>
                }
                title={user.username}
                description={`第${user.rank}名`}
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
};