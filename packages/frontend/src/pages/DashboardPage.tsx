import React, { useEffect, useState } from 'react';
import { Card, Button, Select, message, Spin, Input } from 'antd';
import {
  FileTextOutlined,
  CheckSquareOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { useAuth } from '../contexts/AuthContext';
import { taskApi } from '../api/task';
import { rankingApi } from '../api/ranking';
import { TaskStats, Task } from '../types';
import { BountyHistoryDrawer } from '../components/BountyHistoryDrawer';
import './DashboardPage.css';

const { Option } = Select;

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly' | 'total'>('monthly');
  const [generatingReport, setGeneratingReport] = useState(false);
  const [publishedTasksList, setPublishedTasksList] = useState<Task[]>([]);
  const [assignedTasksList, setAssignedTasksList] = useState<Task[]>([]);
  const [reportContent, setReportContent] = useState<string>('');
  const [historyDrawerVisible, setHistoryDrawerVisible] = useState(false);
  const [monthlyBounty, setMonthlyBounty] = useState(0);
  const [quarterlyBounty, setQuarterlyBounty] = useState(0);
  const [allTimeBounty, setAllTimeBounty] = useState(0);
  const [monthlyHasData, setMonthlyHasData] = useState(true);
  const [quarterlyHasData, setQuarterlyHasData] = useState(true);
  const [allTimeHasData, setAllTimeHasData] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      const currentQuarter = Math.ceil(currentMonth / 3);

      // Load both published and assigned tasks to calculate stats
      const [publishedTasks, assignedTasks, monthlyRanking, quarterlyRanking, allTimeRanking] = await Promise.all([
        taskApi.getPublishedTasks(),
        taskApi.getAssignedTasks(),
        user ? rankingApi.getMyRanking(user.id, { 
          period: 'monthly', 
          year: currentYear, 
          month: currentMonth 
        }).catch((_error) => {
          return null;
        }) : Promise.resolve(null),
        user ? rankingApi.getMyRanking(user.id, { 
          period: 'quarterly', 
          year: currentYear, 
          quarter: currentQuarter 
        }).catch((_error) => {
          return null;
        }) : Promise.resolve(null),
        user ? rankingApi.getMyRanking(user.id, { 
          period: 'all_time', 
          year: currentYear 
        }).catch((_error) => {
          return null;
        }) : Promise.resolve(null),
      ]);

      setPublishedTasksList(publishedTasks);
      setAssignedTasksList(assignedTasks);

      // Set bounty data from rankings
      setMonthlyBounty(monthlyRanking?.totalBounty || 0);
      setQuarterlyBounty(quarterlyRanking?.totalBounty || 0);
      setAllTimeBounty(allTimeRanking?.totalBounty || 0);
      
      // Set hasData flags
      setMonthlyHasData(!!monthlyRanking);
      setQuarterlyHasData(!!quarterlyRanking);
      setAllTimeHasData(!!allTimeRanking);

      // Calculate stats from tasks
      const publishedCompleted = publishedTasks.filter((t: Task) => t.status === 'completed').length;
      const publishedInProgress = publishedTasks.filter((t: Task) => t.status === 'in_progress').length;
      const assignedCompleted = assignedTasks.filter((t: Task) => t.status === 'completed').length;
      const assignedInProgress = assignedTasks.filter((t: Task) => t.status === 'in_progress').length;
      const totalBountyEarned = assignedTasks
        .filter((t: Task) => t.status === 'completed')
        .reduce((sum: number, t: Task) => sum + Number(t.bountyAmount || 0), 0);

      setStats({
        publishedTotal: publishedTasks.length,
        publishedNotStarted: publishedTasks.filter((t: Task) => t.status === 'not_started').length,
        publishedInProgress,
        publishedCompleted,
        assignedTotal: assignedTasks.length,
        assignedInProgress,
        assignedCompleted,
        totalBountyEarned,
      });
    } catch (error) {
      message.error('加载统计数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    try {
      setGeneratingReport(true);
      
      const now = dayjs();
      let startDate = now;
      let endDate = now;
      let reportTitle = "任务总报";

      switch (reportType) {
        case 'daily':
          startDate = now.startOf('day');
          endDate = now.endOf('day');
          reportTitle = `任务日报 (${now.format('YYYY-MM-DD')})`;
          break;
        case 'weekly':
          startDate = now.startOf('week');
          endDate = now.endOf('week');
          reportTitle = `任务周报 (${startDate.format('MM-DD')} 至 ${endDate.format('MM-DD')})`;
          break;
        case 'monthly':
          startDate = now.startOf('month');
          endDate = now.endOf('month');
          reportTitle = `任务月报 (${now.format('YYYY-MM')})`;
          break;
        default:
          startDate = dayjs(0);
          endDate = now.add(100, 'year');
          reportTitle = "任务总报";
      }

      const filterTask = (task: Task) => {
        if (reportType === 'total') return true;
        
        const created = dayjs(task.createdAt);
        // Check if created within the period
        const isCreatedInPeriod = created.isAfter(startDate.subtract(1, 'second')) && created.isBefore(endDate.add(1, 'second'));
        
        // Check if completed within the period
        let isCompletedInPeriod = false;
        if (task.status === 'completed' && task.actualEndDate) {
             const completed = dayjs(task.actualEndDate);
             isCompletedInPeriod = completed.isAfter(startDate.subtract(1, 'second')) && completed.isBefore(endDate.add(1, 'second'));
        }
        
        return isCreatedInPeriod || isCompletedInPeriod;
      };

      const filteredAssigned = assignedTasksList.filter(filterTask);
      const filteredPublished = publishedTasksList.filter(filterTask);

      const safeNumber = (value: any) => {
        const n = Number(value);
        return Number.isFinite(n) ? n : 0;
      };

      // Generate Text Report
      let report = `${reportTitle}\n`;
      report += `生成时间: ${now.format('YYYY-MM-DD HH:mm:ss')}\n`;
      report += `----------------------------------------\n\n`;

      report += `【一、统计概览】\n`;
      report += `- 统计周期内承接任务: ${filteredAssigned.length}\n`;
      report += `- 统计周期内发布任务: ${filteredPublished.length}\n`;
      
      const earned = filteredAssigned
        .filter((t: Task) => t.status === 'completed')
        .reduce((sum: number, t: Task) => sum + safeNumber(t.bountyAmount), 0);
      report += `- 周期内获得赏金: ${earned.toFixed(2)}元\n`;
      report += `\n`;

      report += `【二、承接任务详情】\n`;
      if (filteredAssigned.length > 0) {
        filteredAssigned.forEach((task, index) => {
           const statusMap: Record<string, string> = {
             'not_started': '未开始',
             'in_progress': '进行中',
             'completed': '已完成',
             'abandoned': '已放弃'
           };
           const statusStr = statusMap[task.status] || task.status;
           report += `${index + 1}. ${task.name || task.title}\n`;
           report += `   状态: ${statusStr} | 进度: ${task.progress || 0}%\n`;
           report += `   赏金: ${safeNumber(task.bountyAmount).toFixed(2)}元 | 截止: ${task.plannedEndDate ? dayjs(task.plannedEndDate).format('YYYY-MM-DD') : '-'}\n`;
           report += `\n`;
        });
      } else {
        report += `(无相关记录)\n\n`;
      }

      report += `【三、发布任务详情】\n`;
      if (filteredPublished.length > 0) {
        filteredPublished.forEach((task, index) => {
           const statusMap: Record<string, string> = {
             'not_started': '未开始',
             'in_progress': '进行中',
             'completed': '已完成',
             'abandoned': '已放弃'
           };
           const statusStr = statusMap[task.status] || task.status;
           report += `${index + 1}. ${task.name || task.title}\n`;
           report += `   状态: ${statusStr} | 进度: ${task.progress || 0}%\n`;
           report += `   赏金: ${safeNumber(task.bountyAmount).toFixed(2)}元\n`;
           report += `\n`;
        });
      } else {
        report += `(无相关记录)\n`;
      }

      setReportContent(report);
      message.success('报告已生成，请在下方查看');
    } catch (error: any) {
      message.error(`生成报告失败: ${error?.message || '未知错误'}`);
    } finally {
      setGeneratingReport(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Spin size="large">
          <div style={{ padding: '20px', textAlign: 'center' }}>加载中...</div>
        </Spin>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div className="welcome-section">
          <h1 className="welcome-title">
            欢迎回来，{user?.username}！
          </h1>
          <p className="welcome-subtitle">
            这是您的个人工作台，查看最新的任务动态和统计信息
          </p>
        </div>
      </div>
      
      {/* 统计卡片网格 */}
      <div className="stats-grid">
        <Card 
          className="stat-card stat-card-primary"
          hoverable 
          onClick={() => navigate('/tasks/published')}
        >
          <div className="stat-content">
            <div className="stat-icon">
              <FileTextOutlined />
            </div>
            <div className="stat-info">
              <div className="stat-value">{stats?.publishedTotal || 0}</div>
              <div className="stat-label">发布的任务</div>
              <div className="stat-details">
                <span>进行中 {stats?.publishedInProgress || 0}</span>
                <span>已完成 {stats?.publishedCompleted || 0}</span>
              </div>
            </div>
          </div>
        </Card>

        <Card 
          className="stat-card stat-card-success"
          hoverable 
          onClick={() => navigate('/tasks/assigned')}
        >
          <div className="stat-content">
            <div className="stat-icon">
              <CheckSquareOutlined />
            </div>
            <div className="stat-info">
              <div className="stat-value">{stats?.assignedTotal || 0}</div>
              <div className="stat-label">承接的任务</div>
              <div className="stat-details">
                <span>进行中 {stats?.assignedInProgress || 0}</span>
                <span>已完成 {stats?.assignedCompleted || 0}</span>
              </div>
            </div>
          </div>
        </Card>

        <Card
          className="stat-card stat-card-warning"
          hoverable
          onClick={() => {
            if (!historyDrawerVisible && user?.id) {
              setHistoryDrawerVisible(true);
            }
          }}
        >
          <div className="stat-content">
            <div className="stat-icon">
              💰
            </div>
            <div className="stat-info">
              <div className="stat-value">
                {monthlyHasData ? `$${monthlyBounty.toFixed(2)}` : '未参与'}
              </div>
              <div className="stat-label">当月赏金</div>
              <div className="stat-details">
                <span>
                  {quarterlyHasData ? `当季 $${quarterlyBounty.toFixed(2)}` : '当季未参与'}
                </span>
                <span>
                  {allTimeHasData ? `累积 $${allTimeBounty.toFixed(2)}` : '累积未参与'}
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
      </div>

      {/* 报告生成区域 */}
      <Card className="report-card">
        <div className="report-header">
          <div className="report-title">
            <FileTextOutlined />
            <span>生成任务报告</span>
          </div>
          <div className="report-controls">
            <Select
              value={reportType}
              onChange={setReportType}
              className="report-select"
            >
              <Option value="daily">日报</Option>
              <Option value="weekly">周报</Option>
              <Option value="monthly">月报</Option>
              <Option value="total">总报</Option>
            </Select>
            <Button 
              type="primary"
              icon={<FileTextOutlined />} 
              onClick={handleGenerateReport}
              loading={generatingReport}
              className="generate-btn"
            >
              生成报告
            </Button>
          </div>
        </div>
        
        <div className="report-content">
          <Input.TextArea
            value={reportContent}
            placeholder="点击上方按钮生成报告，报告内容将显示在这里..."
            autoSize={{ minRows: 8, maxRows: 20 }}
            readOnly
            className="report-textarea"
          />
          <div className="report-hint">
            报告将包含所选时间段内的任务统计、完成情况和赏金收入等信息
          </div>
        </div>
      </Card>

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