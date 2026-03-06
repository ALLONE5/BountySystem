/**
 * 任务卡片组件
 * 显示单个任务的信息
 */

import React from 'react';
import { Card, Space, Tag, Avatar, Button, Modal, Typography } from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  GroupOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { Task } from '../../types';

const { Title, Text, Paragraph } = Typography;

interface TaskCardProps {
  task: Task;
  onViewDetail: (task: Task) => void;
  onAcceptTask: (taskId: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onViewDetail,
  onAcceptTask
}) => {
  const getComplexityColor = (complexity: number | undefined) => {
    const colors = ['green', 'blue', 'orange', 'red', 'purple'];
    return colors[(complexity || 1) - 1] || 'default';
  };

  const getPriorityColor = (priority: number | string | undefined) => {
    const colors = ['default', 'blue', 'orange', 'red', 'magenta'];
    const numPriority = typeof priority === 'number' ? priority : 1;
    return colors[numPriority - 1] || 'default';
  };

  const isGroupTask = !!task.groupName;
  const isProjectTask = !!task.projectGroupName;

  const handleAcceptClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    Modal.confirm({
      title: '确定要承接这个任务吗？',
      content: task.name,
      onOk: () => onAcceptTask(task.id),
    });
  };

  return (
    <Card
      hoverable
      onClick={() => onViewDetail(task)}
      className="task-card"
      style={{ 
        marginBottom: 16,
        borderLeft: isGroupTask ? '4px solid #1890ff' : isProjectTask ? '4px solid #722ed1' : '4px solid transparent',
        transition: 'all 0.3s ease',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <Space align="start" style={{ width: '100%', justifyContent: 'space-between' }}>
            <Title level={4} style={{ marginBottom: 8, marginTop: 0 }}>
              {task.name}
            </Title>
            {isGroupTask && (
              <Tag color="blue" icon={<TeamOutlined />}>组群任务</Tag>
            )}
            {isProjectTask && (
              <Tag color="purple" icon={<GroupOutlined />}>项目任务</Tag>
            )}
          </Space>
          
          <Space size={8} style={{ marginBottom: 12 }}>
            <Avatar
              size={24}
              src={task.publisher?.avatarUrl || undefined}
              icon={!task.publisher?.avatarUrl ? <UserOutlined /> : undefined}
            />
            <Text type="secondary">
              {task.publisher?.username || '未知'}
            </Text>
            {isGroupTask && (
              <Tag color="blue">{task.groupName}</Tag>
            )}
            {isProjectTask && (
              <Tag color="purple">{task.projectGroupName}</Tag>
            )}
          </Space>
          
          <Paragraph
            ellipsis={{ rows: 2 }}
            style={{ color: '#666', marginBottom: 12 }}
          >
            {task.description || '无描述'}
          </Paragraph>
          
          <Space wrap>
            <Tag color={getComplexityColor(task.complexity)}>
              复杂度: {task.complexity || 1}/5
            </Tag>
            <Tag color={getPriorityColor(task.priority)}>
              优先级: {typeof task.priority === 'number' ? task.priority : 1}/5
            </Tag>
            {task.positionName && (
              <Tag icon={<UserOutlined />}>{task.positionName}</Tag>
            )}
            {task.tags && task.tags.map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </Space>
        </div>
        
        <div style={{ marginLeft: 24, textAlign: 'right', minWidth: 140 }}>
          <div style={{ 
            fontSize: 28, 
            fontWeight: 700, 
            color: '#f5222d',
            marginBottom: 8,
            lineHeight: 1,
          }}>
            ${Number(task.bountyAmount || 0).toFixed(2)}
          </div>
          <Space orientation="vertical" size={4} style={{ width: '100%' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              <ClockCircleOutlined /> {dayjs(task.plannedEndDate).format('MM-DD')}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              <ThunderboltOutlined /> {task.estimatedHours}h
            </Text>
          </Space>
          <Button
            type="primary"
            size="small"
            style={{ marginTop: 12, width: '100%' }}
            onClick={handleAcceptClick}
          >
            承接任务
          </Button>
        </div>
      </div>
    </Card>
  );
};