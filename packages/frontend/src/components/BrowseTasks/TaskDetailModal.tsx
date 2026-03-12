/**
 * 任务详情模态框组件
 * 显示任务的详细信息
 */

import React from 'react';
import { Button, Typography, Space, Tag, Divider, Row, Col, Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { Task } from '../../types';
import { BaseModal } from '../common/BaseModal';

const { Title, Text, Paragraph } = Typography;

interface TaskDetailModalProps {
  visible: boolean;
  task: Task | null;
  onClose: () => void;
  onAcceptTask: (taskId: string) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  visible,
  task,
  onClose,
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

  if (!task) return null;

  return (
    <BaseModal
      visible={visible}
      title="任务详情"
      onCancel={onClose}
      width={700}
      footer={[
        <Button key="cancel" onClick={onClose}>
          取消
        </Button>,
        <Button
          key="accept"
          type="primary"
          onClick={() => onAcceptTask(task.id)}
        >
          承接任务
        </Button>,
      ]}
    >
      <div>
        <Title level={3}>{task.name}</Title>
        <div style={{ marginBottom: 16 }}>
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
        
        <Divider />
        
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Text strong>赏金金额：</Text>
            <div style={{ fontSize: 28, fontWeight: 'bold', color: '#ff4d4f' }}>
              ${Number(task.bountyAmount || 0).toFixed(2)}
            </div>
          </Col>
          <Col span={12}>
            <Text strong>预估工时：</Text>
            <div style={{ fontSize: 28, fontWeight: 'bold' }}>
              {task.estimatedHours}小时
            </div>
          </Col>
        </Row>

        <Divider />

        <div style={{ marginBottom: 12 }}>
          <Text strong>任务描述：</Text>
          <Paragraph style={{ marginTop: 8 }}>{task.description || '无描述'}</Paragraph>
        </div>

        <div style={{ marginBottom: 12 }}>
          <Text strong>发布者：</Text>
          <Space size={8} style={{ marginLeft: 8 }}>
            <Avatar
              size={28}
              src={task.publisher?.avatarUrl || undefined}
              icon={!task.publisher?.avatarUrl ? <UserOutlined /> : undefined}
            />
            <div>
              <div>{task.publisher?.username || '未知'}</div>
              {task.publisher?.email && (
                <Text type="secondary">{task.publisher.email}</Text>
              )}
            </div>
          </Space>
        </div>

        <Row gutter={[16, 8]}>
          <Col span={12}>
            <Text type="secondary">计划开始：</Text>
            <Text>{dayjs(task.plannedStartDate).format('YYYY-MM-DD HH:mm')}</Text>
          </Col>
          <Col span={12}>
            <Text type="secondary">计划结束：</Text>
            <Text>{dayjs(task.plannedEndDate).format('YYYY-MM-DD HH:mm')}</Text>
          </Col>
          <Col span={12}>
            <Text type="secondary">创建时间：</Text>
            <Text>{dayjs(task.createdAt).format('YYYY-MM-DD HH:mm')}</Text>
          </Col>
          <Col span={12}>
            <Text type="secondary">可见性：</Text>
            <Text>{task.visibility}</Text>
          </Col>
        </Row>
      </div>
    </BaseModal>
  );
};