import React, { useState } from 'react';
import { Spin } from 'antd';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useAuth } from '../contexts/AuthContext';
import { taskApi } from '../api/task';
import { rankingApi } from '../api/ranking';
import { useDataFetch } from '../hooks/useDataFetch';
import { DashboardHero } from '../components/Dashboard/DashboardHero';
import { DashboardStats } from '../components/Dashboard/DashboardStats';
import { DashboardQuickActions } from '../components/Dashboard/DashboardQuickActions';
import { DashboardCharts } from '../components/Dashboard/DashboardCharts';
import { DashboardActivity } from '../components/Dashboard/DashboardActivity';
import { DashboardReports } from '../components/Dashboard/DashboardReports';
import { BountyHistoryDrawer } from '../components/BountyHistoryDrawer';
import './DashboardPage.css';

// Add relative time plugin
dayjs.extend(relativeTime);

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [historyDrawerVisible, setHistoryDrawerVisible] = useState(false);
  const [monthlyBounty, setMonthlyBounty] = useState(0);
  const [quarterlyBounty, setQuarterlyBounty] = useState(0);
  const [allTimeBounty, setAllTimeBounty] = useState(0);
  const [monthlyHasData, setMonthlyHasData] = useState(true);
  const [quarterlyHasData, setQuarterlyHasData] = useState(true);
  const [allTimeHasData, setAllTimeHasData] = useState(true);
  const [assignedTasksList, setAssignedTasksList] = useState<any[]>([]);

  // 使用 useDataFetch Hook 获取统计数据
  const { data: stats, loading } = useDataFetch(
    async () => {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      const currentQuarter = Math.ceil(currentMonth / 3);

      // 并行加载所有数据
      const [taskStats, , assignedTasks, monthlyRanking, quarterlyRanking, allTimeRanking] = await Promise.all([
        taskApi.getTaskStats(),
        taskApi.getPublishedTasks(),
        taskApi.getAssignedTasks(),
        user ? rankingApi.getMyRanking(user.id, { 
          period: 'monthly', 
          year: currentYear, 
          month: currentMonth 
        }).catch(() => null) : Promise.resolve(null),
        user ? rankingApi.getMyRanking(user.id, { 
          period: 'quarterly', 
          year: currentYear, 
          quarter: currentQuarter 
        }).catch(() => null) : Promise.resolve(null),
        user ? rankingApi.getMyRanking(user.id, { 
          period: 'all_time', 
          year: currentYear 
        }).catch(() => null) : Promise.resolve(null),
      ]);

      // 设置任务列表和赏金数据 - 确保 assignedTasks 是数组
      setAssignedTasksList(Array.isArray(assignedTasks) ? assignedTasks : []);
      setMonthlyBounty(monthlyRanking?.totalBounty || 0);
      setQuarterlyBounty(quarterlyRanking?.totalBounty || 0);
      setAllTimeBounty(allTimeRanking?.totalBounty || 0);
      setMonthlyHasData(!!monthlyRanking);
      setQuarterlyHasData(!!quarterlyRanking);
      setAllTimeHasData(!!allTimeRanking);

      return taskStats;
    },
    [user?.id],
    {
      errorMessage: '加载统计数据失败',
      context: 'DashboardPage.loadStats'
    }
  );

  if (loading) {
    return (
      <div className="dashboard-container">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
          <Spin size="large">
            <div style={{ padding: '20px', textAlign: 'center' }}>加载中...</div>
          </Spin>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <DashboardHero user={user} />
      
      <DashboardStats
        stats={stats || null}
        monthlyBounty={monthlyBounty}
        quarterlyBounty={quarterlyBounty}
        allTimeBounty={allTimeBounty}
        monthlyHasData={monthlyHasData}
        quarterlyHasData={quarterlyHasData}
        allTimeHasData={allTimeHasData}
        assignedTasksList={assignedTasksList}
        onHistoryDrawerOpen={() => setHistoryDrawerVisible(true)}
      />

      <DashboardQuickActions
        stats={stats || null}
        assignedTasksList={assignedTasksList}
      />

      <DashboardCharts
        stats={stats || null}
        monthlyBounty={monthlyBounty}
        monthlyHasData={monthlyHasData}
      />

      <DashboardActivity
        assignedTasksList={assignedTasksList}
      />

      <DashboardReports />

      {/* Bounty History Drawer */}
      {user?.id && (
        <BountyHistoryDrawer
          visible={historyDrawerVisible}
          userId={user.id}
          onClose={() => setHistoryDrawerVisible(false)}
        />
      )}

      <style>{`
        .dashboard-page {
          padding: 0;
          max-width: 1200px;
          margin: 0 auto;
        }

        .dashboard-header {
          margin-bottom: 32px;
        }

        .welcome-section {
          text-align: center;
          padding: 32px 0;
        }

        .welcome-title {
          font-size: 36px;
          font-weight: 800;
          color: var(--color-text-primary);
          margin: 0 0 12px 0;
          background: var(--color-gradient-primary);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          line-height: 1.2;
        }

        .welcome-subtitle {
          font-size: 18px;
          color: var(--color-text-secondary);
          margin: 0;
          font-weight: 400;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
          margin-bottom: 40px;
        }

        .stat-card {
          background: var(--color-bg-glass);
          backdrop-filter: blur(20px);
          border: 1px solid var(--color-border-light);
          border-radius: var(--radius-xl);
          padding: 0;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
          position: relative;
        }

        .stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: var(--color-gradient-primary);
        }

        .stat-card:hover {
          transform: translateY(-8px);
          box-shadow: var(--shadow-xl);
          border-color: var(--color-border-primary);
        }

        .stat-card-primary::before {
          background: var(--color-gradient-primary);
        }

        .stat-card-success::before {
          background: linear-gradient(90deg, var(--color-success), var(--color-info));
        }

        .stat-card-warning::before {
          background: var(--color-gradient-secondary);
        }

        .stat-card-info::before {
          background: var(--color-gradient-accent);
        }

        .stat-content {
          padding: 28px;
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .stat-icon {
          width: 64px;
          height: 64px;
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          background: var(--color-hover);
          color: var(--color-primary);
          flex-shrink: 0;
        }

        .stat-info {
          flex: 1;
        }

        .stat-value {
          font-size: 32px;
          font-weight: 800;
          color: var(--color-text-primary);
          line-height: 1.1;
          margin-bottom: 6px;
        }

        .stat-label {
          font-size: 16px;
          color: var(--color-text-secondary);
          margin-bottom: 12px;
          font-weight: 600;
        }

        .stat-details {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .stat-details span {
          font-size: 13px;
          color: var(--color-text-tertiary);
          font-weight: 500;
        }

        .report-card {
          background: var(--color-bg-glass);
          backdrop-filter: blur(20px);
          border: 1px solid var(--color-border-light);
          border-radius: var(--radius-xl);
          padding: 0;
          overflow: hidden;
        }

        .report-header {
          padding: 32px 32px 0 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 20px;
        }

        .report-title {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 20px;
          font-weight: 700;
          color: var(--color-text-primary);
        }

        .report-controls {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .report-select {
          min-width: 140px;
        }

        .generate-btn {
          background: var(--color-gradient-primary);
          border: none;
          border-radius: var(--radius-md);
          height: 40px;
          font-weight: 600;
          padding: 0 24px;
        }

        .report-content {
          padding: 32px;
        }

        .report-textarea {
          background: var(--color-bg-secondary);
          border: 1px solid var(--color-border-secondary);
          border-radius: var(--radius-lg);
          color: var(--color-text-primary);
          font-family: var(--font-mono);
          font-size: 14px;
          line-height: 1.6;
          resize: vertical;
        }

        .report-textarea:focus {
          border-color: var(--color-primary);
          box-shadow: var(--shadow-glow);
        }

        .report-hint {
          margin-top: 16px;
          font-size: 14px;
          color: var(--color-text-tertiary);
          text-align: center;
          font-style: italic;
        }

        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }

          .stat-content {
            padding: 24px;
          }

          .welcome-title {
            font-size: 28px;
          }

          .welcome-subtitle {
            font-size: 16px;
          }

          .report-header {
            flex-direction: column;
            align-items: stretch;
            padding: 24px 24px 0 24px;
          }

          .report-controls {
            justify-content: space-between;
          }

          .report-content {
            padding: 24px;
          }
        }

        @media (max-width: 480px) {
          .welcome-section {
            padding: 24px 0;
          }

          .stat-content {
            padding: 20px;
            gap: 16px;
          }

          .stat-icon {
            width: 56px;
            height: 56px;
            font-size: 24px;
          }

          .stat-value {
            font-size: 28px;
          }
        }
      `}</style>
    </div>
  );
};