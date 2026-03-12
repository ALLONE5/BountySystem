/**
 * 仪表盘图表组件
 * 显示任务趋势和进度概览
 */

import React from 'react';
import dayjs from 'dayjs';
import { TaskStats } from '../../types';

interface DashboardChartsProps {
  stats: TaskStats | null;
  monthlyBounty: number;
  monthlyHasData: boolean;
}

export const DashboardCharts: React.FC<DashboardChartsProps> = ({
  stats,
  monthlyBounty,
  monthlyHasData
}) => {
  return (
    <>
      {/* 任务趋势 */}
      <div className="task-trends">
        <div className="trends-card">
          <div className="trends-header">
            <h3 className="trends-title">任务趋势</h3>
            <div className="trends-legend">
              <div className="legend-item">
                <div className="legend-color primary"></div>
                <span>承接任务</span>
              </div>
              <div className="legend-item">
                <div className="legend-color secondary"></div>
                <span>发布任务</span>
              </div>
            </div>
          </div>
          <div className="trends-content">
            <div className="trends-chart">
              <div className="chart-bars">
                {[...Array(7)].map((_, index) => {
                  const assignedHeight = Math.random() * 60 + 20;
                  const publishedHeight = Math.random() * 40 + 10;
                  const dayName = dayjs().subtract(6 - index, 'day').format('ddd');
                  
                  return (
                    <div key={index} className="chart-bar-group">
                      <div className="chart-bars-container">
                        <div 
                          className="chart-bar assigned" 
                          style={{ height: `${assignedHeight}%` }}
                        ></div>
                        <div 
                          className="chart-bar published" 
                          style={{ height: `${publishedHeight}%` }}
                        ></div>
                      </div>
                      <div className="chart-label">{dayName}</div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="trends-summary">
              <div className="summary-item">
                <div className="summary-value">
                  {((stats?.assignedInProgress || 0) / Math.max(stats?.assignedTotal || 1, 1) * 100).toFixed(0)}%
                </div>
                <div className="summary-label">承接任务活跃度</div>
              </div>
              <div className="summary-item">
                <div className="summary-value">
                  {((stats?.publishedInProgress || 0) / Math.max(stats?.publishedTotal || 1, 1) * 100).toFixed(0)}%
                </div>
                <div className="summary-label">发布任务活跃度</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 进度概览 */}
      <div className="progress-overview">
        <div className="progress-card">
          <div className="progress-header">
            <h3 className="progress-title">本月进度概览</h3>
            <div className="progress-period">
              {dayjs().format('YYYY年MM月')}
            </div>
          </div>
          <div className="progress-content">
            <div className="progress-item">
              <div className="progress-info">
                <span className="progress-label">任务完成率</span>
                <span className="progress-value">
                  {stats?.assignedTotal
                    ? ((stats.assignedCompleted / stats.assignedTotal) * 100).toFixed(1)
                    : 0}%
                </span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ 
                    width: `${stats?.assignedTotal
                      ? (stats.assignedCompleted / stats.assignedTotal) * 100
                      : 0}%` 
                  }}
                ></div>
              </div>
            </div>
            
            <div className="progress-item">
              <div className="progress-info">
                <span className="progress-label">发布任务完成率</span>
                <span className="progress-value">
                  {stats?.publishedTotal
                    ? ((stats.publishedCompleted / stats.publishedTotal) * 100).toFixed(1)
                    : 0}%
                </span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill secondary" 
                  style={{ 
                    width: `${stats?.publishedTotal
                      ? (stats.publishedCompleted / stats.publishedTotal) * 100
                      : 0}%` 
                  }}
                ></div>
              </div>
            </div>

            <div className="progress-stats">
              <div className="progress-stat">
                <div className="progress-stat-value">{stats?.assignedCompleted || 0}</div>
                <div className="progress-stat-label">已完成承接</div>
              </div>
              <div className="progress-stat">
                <div className="progress-stat-value">{stats?.publishedCompleted || 0}</div>
                <div className="progress-stat-label">已完成发布</div>
              </div>
              <div className="progress-stat">
                <div className="progress-stat-value">
                  {monthlyHasData ? monthlyBounty.toFixed(0) : '0'}
                </div>
                <div className="progress-stat-label">本月赏金</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};