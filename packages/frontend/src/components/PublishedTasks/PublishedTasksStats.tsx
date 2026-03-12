import React from 'react';
import { Card, Statistic, Row, Col } from 'antd';
import {
  ProjectOutlined,
  CheckCircleOutlined,
  UserOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import { Task, TaskStatus } from '../../types';
import { message } from '../../utils/message';

interface PublishedTasksStatsProps {
  tasks: Task[];
}

export const PublishedTasksStats: React.FC<PublishedTasksStatsProps> = ({ tasks }) => {
  const stats = React.useMemo(() => ({
    totalTasks: tasks.length,
    totalBounty: tasks.reduce((sum, task) => sum + Number(task.bountyAmount || 0), 0),
    inProgress: tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length,
    completed: tasks.filter(t => t.status === TaskStatus.COMPLETED).length,
    pendingAcceptance: tasks.filter(t => t.status === TaskStatus.PENDING_ACCEPTANCE).length,
  }), [tasks]);

  const handlePendingClick = () => {
    if (stats.pendingAcceptance > 0) {
      message.info('这些任务已指派给用户，等待对方接受');
    }
  };

  return (
    <Row gutter={16} style={{ marginBottom: 24 }}>
      <Col xs={24} sm={12} lg={6}>
        <Card className="stat-card" style={{ borderLeft: '4px solid #f5222d' }}>
          <Statistic
            title="总悬赏金额"
            value={stats.totalBounty}
            prefix="$"
            precision={2}
            styles={{ content: { fontSize: 24, fontWeight: 600, color: '#f5222d' } }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card className="stat-card" style={{ borderLeft: '4px solid #1890ff' }}>
          <Statistic
            title="发布的任务"
            value={stats.totalTasks}
            prefix={<ProjectOutlined style={{ color: '#1890ff', fontSize: 20 }} />}
            styles={{ content: { fontSize: 24, fontWeight: 600 } }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card 
          className="stat-card" 
          style={{ 
            borderLeft: '4px solid #fa8c16',
            cursor: stats.pendingAcceptance > 0 ? 'pointer' : 'default'
          }}
          onClick={handlePendingClick}
        >
          <Statistic
            title="待接受"
            value={stats.pendingAcceptance}
            prefix={<UserOutlined style={{ color: '#fa8c16', fontSize: 20 }} />}
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
    </Row>
  );
};