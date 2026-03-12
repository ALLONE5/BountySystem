import React from 'react';
import { Card, Row, Col } from 'antd';
import { TrophyOutlined } from '@ant-design/icons';
import { Ranking } from '../../types';

interface MyRankingCardProps {
  myRanking: Ranking | null;
  activeTab: 'monthly' | 'quarterly' | 'all_time';
  year: number;
  month: number;
  quarter: number;
}

export const MyRankingCard: React.FC<MyRankingCardProps> = ({
  myRanking,
  activeTab,
  year,
  month,
  quarter,
}) => {
  const getRankColor = (rank: number) => {
    if (rank === 1) return '#FFD700';
    if (rank === 2) return '#C0C0C0';
    if (rank === 3) return '#CD7F32';
    return undefined;
  };

  const getPeriodText = () => {
    if (activeTab === 'monthly') {
      return `${year}年${month}月`;
    } else if (activeTab === 'quarterly') {
      return `${year}年第${quarter}季度`;
    }
    return '总累积';
  };

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