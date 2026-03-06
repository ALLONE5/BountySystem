/**
 * 仪表盘活动组件
 * 显示最近活动和任务提醒
 */

import React from 'react';
import { Button } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

interface DashboardActivityProps {
  assignedTasksList: any[];
}

export const DashboardActivity: React.FC<DashboardActivityProps> = ({
  assignedTasksList
}) => {
  const navigate = useNavigate();

  const upcomingTasks = assignedTasksList.filter(t => {
    const deadline = new Date(t.plannedEndDate || '');
    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays > 0 && t.status !== 'completed';
  });

  return (
    <div className="recent-activity">
      <div className="activity-card">
        <div className="activity-header">
          <h3 className="activity-title">最近活动</h3>
          <Button type="link" size="small" onClick={() => navigate('/notifications')}>
            查看全部
          </Button>
        </div>
        <div className="activity-list">
          {assignedTasksList.slice(0, 5).map((task) => (
            <div key={task.id} className="activity-item">
              <div className="activity-avatar">
                <UserOutlined />
              </div>
              <div className="activity-content">
                <div className="activity-text">
                  {task.status === 'completed' ? '完成了任务' : '正在进行任务'} "{task.name || task.title}"
                </div>
                <div className="activity-time">
                  {dayjs(task.updatedAt || task.createdAt).fromNow()}
                </div>
              </div>
              <div className={`activity-status ${task.status === 'completed' ? 'completed' : 'active'}`}></div>
            </div>
          ))}
          {assignedTasksList.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <div className="empty-title">暂无活动</div>
              <div className="empty-description">开始承接任务来查看活动记录</div>
            </div>
          )}
        </div>
      </div>

      <div className="notifications-card">
        <div className="notifications-header">
          <h3 className="notifications-title">任务提醒</h3>
        </div>
        <div className="notifications-list">
          {upcomingTasks.slice(0, 3).map((task) => {
            const deadline = new Date(task.plannedEndDate || '');
            const now = new Date();
            const diffTime = deadline.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            return (
              <div key={task.id} className="notification-item">
                <div className="notification-icon urgent">⚠️</div>
                <div className="notification-content">
                  <div className="notification-text">
                    任务 "{task.name || task.title}" 将在 {diffDays} 天后到期
                  </div>
                  <div className="notification-time">
                    截止时间: {dayjs(task.plannedEndDate).format('MM-DD HH:mm')}
                  </div>
                </div>
              </div>
            );
          })}
          {upcomingTasks.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">🔔</div>
              <div className="empty-title">暂无提醒</div>
              <div className="empty-description">所有任务都在正常进度中</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};