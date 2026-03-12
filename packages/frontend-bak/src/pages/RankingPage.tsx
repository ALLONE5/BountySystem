import React, { useState } from 'react';
import { Card, Spin } from 'antd';
import { TrophyOutlined } from '@ant-design/icons';
import { rankingApi } from '../api/ranking';
import { useAuthStore } from '../store/authStore';
import { Ranking } from '../types';
import { useDataFetch } from '../hooks/useDataFetch';
import { MyRankingCard } from '../components/Ranking/MyRankingCard';
import { RankingTabs } from '../components/Ranking/RankingTabs';
import './RankingPage.css';

export const RankingPage: React.FC = () => {
  const { user } = useAuthStore();
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [myRanking, setMyRanking] = useState<Ranking | null>(null);
  const [activeTab, setActiveTab] = useState<'monthly' | 'quarterly' | 'all_time'>('monthly');
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [quarter, setQuarter] = useState(Math.ceil((new Date().getMonth() + 1) / 3));

  const { loading } = useDataFetch(
    async () => {
      const params: any = { period: activeTab, year };
      
      if (activeTab === 'monthly') {
        params.month = month;
      } else if (activeTab === 'quarterly') {
        params.quarter = quarter;
      }

      const data = await rankingApi.getRankings(params);
      setRankings(data.rankings || []);
      setMyRanking(data.myRanking || null);
      return data;
    },
    [activeTab, year, month, quarter],
    {
      errorMessage: '加载排行榜失败',
      context: 'RankingPage.loadRankings'
    }
  );

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
          <MyRankingCard
            myRanking={myRanking}
            activeTab={activeTab}
            year={year}
            month={month}
            quarter={quarter}
          />
        )}
      </div>

      {/* 排名列表 */}
      <RankingTabs
        activeTab={activeTab}
        rankings={rankings}
        loading={loading}
        currentUserId={user?.id}
        year={year}
        month={month}
        quarter={quarter}
        onTabChange={setActiveTab}
        onYearChange={setYear}
        onMonthChange={setMonth}
        onQuarterChange={setQuarter}
      />
    </div>
  );
};