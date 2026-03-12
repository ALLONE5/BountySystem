/**
 * 仪表盘快速操作组件
 * 提供常用功能的快速访问入口
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TaskStats } from '../../types';

interface DashboardQuickActionsProps {
  stats: TaskStats | null;
  assignedTasksList: any[];
}

export const DashboardQuickActions: React.FC<DashboardQuickActionsProps> = ({
  stats,
  assignedTasksList
}) => {
  const navigate = useNavigate();

  const upcomingTasks = assignedTasksList.filter(t => {
    const deadline = new Date(t.plannedEndDate || '');
    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays > 0 && t.status !== 'completed';
  }).length;

  return (
    <div className="quick-actions">
      <div className="quick-actions-header">
        <h3 className="quick-actions-title">快速操作</h3>
        <div className="quick-stats">
          <span className="quick-stat">
            <span className="quick-stat-value">
              {(stats?.publishedInProgress || 0) + (stats?.assignedInProgress || 0)}
            </span>
            <span className="quick-stat-label">进行中</span>
          </span>
          <span className="quick-stat">
            <span className="quick-stat-value">{upcomingTasks}</span>
            <span className="quick-stat-label">本周到期</span>
          </span>
        </div>
      </div>
      <div className="actions-grid">
        <div className="action-card primary" onClick={() => navigate('/tasks/create')}>
          <div className="action-icon">➕</div>
          <div className="action-title">发布任务</div>
          <div className="action-description">创建新的任务并设置赏金</div>
        </div>
        <div className="action-card" onClick={() => navigate('/bounty-tasks')}>
          <div className="action-icon">🔍</div>
          <div className="action-title">浏览任务</div>
          <div className="action-description">查找感兴趣的任务</div>
        </div>
        <div className="action-card" onClick={() => navigate('/ranking')}>
          <div className="action-icon">🏆</div>
          <div className="action-title">排行榜</div>
          <div className="action-description">查看赏金排行榜</div>
        </div>
        <div className="action-card" onClick={() => navigate('/my/groups')}>
          <div className="action-icon">👥</div>
          <div className="action-title">我的团队</div>
          <div className="action-description">管理项目组和成员</div>
        </div>
        <div className="action-card" onClick={() => navigate('/tasks/assigned')}>
          <div className="action-icon">📋</div>
          <div className="action-title">我的任务</div>
          <div className="action-description">查看承接的任务</div>
        </div>
        <div className="action-card" onClick={() => navigate('/notifications')}>
          <div className="action-icon">🔔</div>
          <div className="action-title">消息通知</div>
          <div className="action-description">查看系统通知</div>
        </div>
      </div>
    </div>
  );
};