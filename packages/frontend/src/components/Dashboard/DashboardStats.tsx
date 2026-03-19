/**
 * 仪表盘统计卡片组件
 * 显示任务统计、赏金信息等关键指标
 */

import React from 'react';
import { Card } from 'antd';
import { FileTextOutlined, CheckSquareOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { TaskStats } from '../../types';

interface DashboardStatsProps {
  stats: TaskStats | null;
  monthlyBounty: number;
  quarterlyBounty: number;
  allTimeBounty: number;
  monthlyHasData: boolean;
  quarterlyHasData: boolean;
  allTimeHasData: boolean;
  assignedTasksList: any[];
  onHistoryDrawerOpen: () => void;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  stats,
  monthlyBounty,
  quarterlyBounty,
  allTimeBounty,
  monthlyHasData,
  quarterlyHasData,
  allTimeHasData,
  assignedTasksList,
  onHistoryDrawerOpen
}) => {
  const navigate = useNavigate();

  return (
    <div className="stats-grid">
      <Card className="stat-card" onClick={() => navigate('/my/bounties')}>
        <div className="stat-header">
          <div className="stat-icon primary">
            <FileTextOutlined />
          </div>
          <div className="stat-trend up">
            <span>↑ +12%</span>
          </div>
        </div>
        <div className="stat-content">
          <div className="stat-value">{stats?.publishedTotal || 0}</div>
          <div className="stat-label">发布的任务</div>
          <div className="stat-description">
            进行中 {stats?.publishedInProgress || 0} · 已完成 {stats?.publishedCompleted || 0}
          </div>
        </div>
      </Card>

      <Card className="stat-card" onClick={() => navigate('/my/tasks')}>
        <div className="stat-header">
          <div className="stat-icon success">
            <CheckSquareOutlined />
          </div>
          <div className="stat-trend up">
            <span>↑ +8%</span>
          </div>
        </div>
        <div className="stat-content">
          <div className="stat-value">{stats?.assignedTotal || 0}</div>
          <div className="stat-label">承接的任务</div>
          <div className="stat-description">
            进行中 {stats?.assignedInProgress || 0} · 已完成 {stats?.assignedCompleted || 0}
          </div>
        </div>
      </Card>

      <Card
        className="stat-card"
        hoverable
        onClick={onHistoryDrawerOpen}
      >
        <div className="stat-content">
          <div className="stat-icon">
            💰
          </div>
          <div className="stat-info">
            <div className="stat-value">
              {monthlyHasData ? `${monthlyBounty.toFixed(2)}` : '未参与'}
            </div>
            <div className="stat-label">当月赏金</div>
            <div className="stat-details">
              <span>
                {quarterlyHasData ? `当季 ${quarterlyBounty.toFixed(2)}` : '当季未参与'}
              </span>
              <span>
                {allTimeHasData ? `累计 ${allTimeBounty.toFixed(2)}` : '累计未参与'}
              </span>
            </div>
          </div>
        </div>
      </Card>

      <Card className="stat-card stat-card-info">
        <div className="stat-content">
          <div className="stat-icon">
            📊
          </div>
          <div className="stat-info">
            <div className="stat-value">
              {stats?.assignedTotal
                ? ((stats.assignedCompleted / stats.assignedTotal) * 100).toFixed(1)
                : 0}%
            </div>
            <div className="stat-label">任务完成率</div>
            <div className="stat-details">
              <span>总计 {stats?.assignedTotal || 0} 个任务</span>
            </div>
          </div>
        </div>
      </Card>

      <Card className="stat-card">
        <div className="stat-header">
          <div className="stat-icon warning">
            ⏰
          </div>
          <div className="stat-trend up">
            <span>本周</span>
          </div>
        </div>
        <div className="stat-content">
          <div className="stat-value">
            {assignedTasksList.filter(t => {
              const deadline = new Date(t.plannedEndDate || '');
              const now = new Date();
              const diffTime = deadline.getTime() - now.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              return diffDays <= 7 && diffDays > 0 && t.status !== 'completed';
            }).length}
          </div>
          <div className="stat-label">即将到期</div>
          <div className="stat-description">
            7天内需完成的任务
          </div>
        </div>
      </Card>

      <Card className="stat-card">
        <div className="stat-header">
          <div className="stat-icon info">
            🔄
          </div>
          <div className="stat-trend up">
            <span>活跃</span>
          </div>
        </div>
        <div className="stat-content">
          <div className="stat-value">
            {(stats?.publishedInProgress || 0) + (stats?.assignedInProgress || 0)}
          </div>
          <div className="stat-label">进行中任务</div>
          <div className="stat-description">
            发布 {stats?.publishedInProgress || 0} · 承接 {stats?.assignedInProgress || 0}
          </div>
        </div>
      </Card>
    </div>
  );
};
