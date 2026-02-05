import React, { useEffect, useState } from 'react';
import { Typography, Card, Row, Col, Statistic, Button, Space, Select, message, Spin, Input } from 'antd';
import {
  FileTextOutlined,
  CheckSquareOutlined,
  TrophyOutlined,
  RightOutlined,
  PercentageOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { useAuthStore } from '../store/authStore';
import { taskApi } from '../api/task';
import { TaskStats, Task } from '../types';
import { colors, spacing } from '../styles/design-tokens';

const { Title, Text } = Typography;
const { Option } = Select;

export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly' | 'total'>('monthly');
  const [generatingReport, setGeneratingReport] = useState(false);
  const [publishedTasksList, setPublishedTasksList] = useState<Task[]>([]);
  const [assignedTasksList, setAssignedTasksList] = useState<Task[]>([]);
  const [reportContent, setReportContent] = useState<string>('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      // Load both published and assigned tasks to calculate stats
      const [publishedTasks, assignedTasks] = await Promise.all([
        taskApi.getPublishedTasks(),
        taskApi.getAssignedTasks(),
      ]);

      setPublishedTasksList(publishedTasks);
      setAssignedTasksList(assignedTasks);

      // Calculate stats from tasks
      const publishedCompleted = publishedTasks.filter(t => t.status === 'completed').length;
      const publishedInProgress = publishedTasks.filter(t => t.status === 'in_progress').length;
      const assignedCompleted = assignedTasks.filter(t => t.status === 'completed').length;
      const assignedInProgress = assignedTasks.filter(t => t.status === 'in_progress').length;
      const totalBountyEarned = assignedTasks
        .filter(t => t.status === 'completed')
        .reduce((sum, t) => sum + Number(t.bountyAmount || 0), 0);

      setStats({
        publishedTotal: publishedTasks.length,
        publishedNotStarted: publishedTasks.filter(t => t.status === 'not_started').length,
        publishedInProgress,
        publishedCompleted,
        assignedTotal: assignedTasks.length,
        assignedInProgress,
        assignedCompleted,
        totalBountyEarned,
      });
    } catch (error) {
      message.error('加载统计数据失败');
      console.error('Failed to load stats:', error);
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
        .filter(t => t.status === 'completed')
        .reduce((sum, t) => sum + safeNumber(t.bountyAmount), 0);
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
           report += `${index + 1}. ${task.name}\n`;
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
           report += `${index + 1}. ${task.name}\n`;
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
      console.error('Failed to generate report:', error);
    } finally {
      setGeneratingReport(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <Title level={2} style={{ marginBottom: spacing.xs }}>
          欢迎回来，{user?.username}！
        </Title>
        <Text type="secondary">这是您的个人工作台</Text>
      </div>
      
      {/* 任务统计概览 */}
      <Row gutter={[16, 16]} style={{ marginTop: spacing.lg }}>
        <Col xs={24} sm={12} lg={6}>
          <Card 
            hoverable 
            onClick={() => navigate('/tasks/published')}
            style={{ 
              cursor: 'pointer',
              transition: 'all 0.3s',
            }}
          >
            <Statistic
              title="发布的任务"
              value={stats?.publishedTotal || 0}
              prefix={<FileTextOutlined style={{ color: colors.primary }} />}
              suffix={<RightOutlined style={{ fontSize: 14, color: colors.text.disabled }} />}
            />
            <div style={{ 
              marginTop: spacing.sm, 
              fontSize: 12, 
              color: colors.text.secondary,
              display: 'flex',
              justifyContent: 'space-between',
            }}>
              <span>进行中: {stats?.publishedInProgress || 0}</span>
              <span>已完成: {stats?.publishedCompleted || 0}</span>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card 
            hoverable 
            onClick={() => navigate('/tasks/assigned')}
            style={{ 
              cursor: 'pointer',
              transition: 'all 0.3s',
            }}
          >
            <Statistic
              title="承接的任务"
              value={stats?.assignedTotal || 0}
              prefix={<CheckSquareOutlined style={{ color: colors.success }} />}
              suffix={<RightOutlined style={{ fontSize: 14, color: colors.text.disabled }} />}
            />
            <div style={{ 
              marginTop: spacing.sm, 
              fontSize: 12, 
              color: colors.text.secondary,
              display: 'flex',
              justifyContent: 'space-between',
            }}>
              <span>进行中: {stats?.assignedInProgress || 0}</span>
              <span>已完成: {stats?.assignedCompleted || 0}</span>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="累计赏金"
              value={stats?.totalBountyEarned || 0}
              prefix="$"
              precision={2}
              valueStyle={{ color: colors.warning }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="任务完成率"
              value={
                stats?.assignedTotal
                  ? ((stats.assignedCompleted / stats.assignedTotal) * 100).toFixed(1)
                  : 0
              }
              prefix={<PercentageOutlined style={{ color: colors.success }} />}
              suffix="%"
              valueStyle={{ 
                color: stats?.assignedTotal && (stats.assignedCompleted / stats.assignedTotal) >= 0.8 
                  ? colors.success 
                  : colors.warning 
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* 报告生成 */}
      <Card 
        style={{ marginTop: spacing.lg }} 
        title={<span><FileTextOutlined /> 生成任务报告</span>}
      >
        <Space style={{ marginBottom: spacing.md }}>
          <Select
            value={reportType}
            onChange={setReportType}
            style={{ width: 120 }}
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
          >
            生成任务报告
          </Button>
        </Space>
        <Input.TextArea
          value={reportContent}
          placeholder="点击上方按钮生成报告，报告内容将显示在这里..."
          autoSize={{ minRows: 6, maxRows: 15 }}
          readOnly
          style={{ 
            fontFamily: 'monospace',
            backgroundColor: colors.background.light,
          }}
        />
        <Text type="secondary" style={{ display: 'block', marginTop: spacing.sm, fontSize: 12 }}>
          报告将包含所选时间段内的任务统计、完成情况和赏金收入等信息
        </Text>
      </Card>

      {/* 快速操作 */}
      <Card 
        style={{ marginTop: spacing.lg }} 
        title="快速操作"
      >
        <Space wrap size="middle">
          <Button 
            type="primary" 
            icon={<TrophyOutlined />}
            onClick={() => navigate('/tasks/browse')}
          >
            浏览赏金任务
          </Button>
          <Button 
            icon={<FileTextOutlined />}
            onClick={() => navigate('/tasks/published')}
          >
            管理发布任务
          </Button>
          <Button 
            icon={<CheckSquareOutlined />}
            onClick={() => navigate('/tasks/assigned')}
          >
            管理承接任务
          </Button>
          <Button 
            icon={<TrophyOutlined />}
            onClick={() => navigate('/ranking')}
          >
            查看排名
          </Button>
        </Space>
      </Card>
    </div>
  );
};
