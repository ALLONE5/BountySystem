import React from 'react';
import { Card, Statistic, Row, Col } from 'antd';
import { message } from '../../utils/message';
import {
  DollarOutlined,
  ProjectOutlined,
  CheckCircleOutlined,
  UserOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import { Task, TaskStatus } from '../../types';

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
    <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
      <Col xs={24} sm={12} md={6} lg={4}>
        <Card 
          variant="borderless"
          hoverable 
          style={{ 
            borderLeft: '4px solid #cf1322',
            transition: 'all 0.3s'
          }}
        >
          <Statistic
            title="总悬赏金额"
            value={stats.totalBounty}
            precision={2}
            prefix={<DollarOutlined style={{ fontSize: '20px' }} />}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6} lg={4}>
        <Card 
          variant="borderless"
          hoverable 
          style={{ 
            borderLeft: '4px solid #1890ff',
            transition: 'all 0.3s'
          }}
        >
          <Statistic
            title="发布的任务"
            value={stats.totalTasks}
            prefix={<ProjectOutlined style={{ fontSize: '20px', color: '#1890ff' }} />}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6} lg={4}>
        <Card 
          variant="borderless"
          hoverable 
          style={{ 
            borderLeft: '4px solid #fa8c16',
            transition: 'all 0.3s',
            cursor: stats.pendingAcceptance > 0 ? 'pointer' : 'default'
          }}
          onClick={handlePendingClick}
        >
          <Statistic
            title="待接受"
            value={stats.pendingAcceptance}
            prefix={<UserOutlined style={{ fontSize: '20px' }} />}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6} lg={4}>
        <Card 
          variant="borderless"
          hoverable 
          style={{ 
            borderLeft: '4px solid #faad14',
            transition: 'all 0.3s'
          }}
        >
          <Statistic
            title="进行中"
            value={stats.inProgress}
            prefix={<PlayCircleOutlined style={{ fontSize: '20px' }} />}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6} lg={4}>
        <Card 
          variant="borderless"
          hoverable 
          style={{ 
            borderLeft: '4px solid #52c41a',
            transition: 'all 0.3s'
          }}
        >
          <Statistic
            title="已完成"
            value={stats.completed}
            prefix={<CheckCircleOutlined style={{ fontSize: '20px' }} />}
          />
        </Card>
      </Col>
    </Row>
  );
};