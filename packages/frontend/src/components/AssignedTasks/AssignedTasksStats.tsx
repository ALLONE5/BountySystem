/**
 * 承接任务统计组件
 * 显示任务统计卡片
 */

import React from 'react';
import { Card, Row, Col, Statistic } from 'antd';
import {
  ClockCircleOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { Task, TaskStatus } from '../../types';

interface AssignedTasksStatsProps {
  tasks: Task[];
}

export const AssignedTasksStats: React.FC<AssignedTasksStatsProps> = ({ tasks }) => {
  // 计算统计数据
  const stats = {
    total: tasks.length,
    inProgress: tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length,
    completed: tasks.filter(t => t.status === TaskStatus.COMPLETED).length,
    totalBounty: tasks.reduce((sum, t) => sum + (Number(t.bountyAmount) || 0), 0),
  };

  return (
    <Row gutter={16} style={{ marginBottom: 24 }}>
      <Col xs={24} sm={12} lg={6}>
        <Card className="stat-card" style={{ borderLeft: '4px solid #1890ff' }}>
          <Statistic
            title="总任务数"
            value={stats.total}
            prefix={<ClockCircleOutlined style={{ color: '#1890ff', fontSize: 20 }} />}
            styles={{ content: { fontSize: 24, fontWeight: 600 } }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card className="stat-card" style={{ borderLeft: '4px solid #faad14' }}>
          <Statistic
            title="进行中"
            value={stats.inProgress}
            prefix={<PlayCircleOutlined style={{ color: '#faad14', fontSize: 20 }} />}
            styles={{ content: { fontSize: 24, fontWeight: 600 } }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card className="stat-card" style={{ borderLeft: '4px solid #52c41a' }}>
          <Statistic
            title="已完成"
            value={stats.completed}
            prefix={<CheckCircleOutlined style={{ color: '#52c41a', fontSize: 20 }} />}
            styles={{ content: { fontSize: 24, fontWeight: 600 } }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card className="stat-card" style={{ borderLeft: '4px solid #f5222d' }}>
          <Statistic
            title="总赏金"
            value={stats.totalBounty}
            prefix="$"
            precision={2}
            styles={{ content: { fontSize: 24, fontWeight: 600, color: '#f5222d' } }}
          />
        </Card>
      </Col>
    </Row>
  );
};