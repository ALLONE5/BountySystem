import React from 'react';
import { List, Button, Space, Typography, Tag, Avatar } from 'antd';
import {
  CheckOutlined,
  CloseOutlined,
  EyeOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Task, InvitationStatus } from '../../types';
import { getInvitationStatusConfig } from '../../utils/statusConfig';
import dayjs from 'dayjs';

const { Text } = Typography;

interface InvitationItemProps {
  task: Task;
  actionLoading: string | null;
  onAccept: (task: Task) => void;
  onReject: (task: Task) => void;
  onViewDetails: (task: Task) => void;
}

export const InvitationItem: React.FC<InvitationItemProps> = ({
  task,
  actionLoading,
  onAccept,
  onReject,
  onViewDetails,
}) => {
  const formatBounty = (amount?: number) => {
    return `¥${Number(amount || 0).toFixed(2)}`;
  };

  const formatDate = (date?: string | Date | null) => {
    if (!date) return '-';
    return dayjs(date).format('YYYY-MM-DD');
  };

  return (
    <List.Item
      key={task.id}
      actions={[
        <Button
          key="accept"
          type="primary"
          icon={<CheckOutlined />}
          onClick={() => onAccept(task)}
          loading={actionLoading === task.id}
        >
          接受
        </Button>,
        <Button
          key="reject"
          danger
          icon={<CloseOutlined />}
          onClick={() => onReject(task)}
          loading={actionLoading === task.id}
        >
          拒绝
        </Button>,
        <Button
          key="view"
          icon={<EyeOutlined />}
          onClick={() => onViewDetails(task)}
        >
          查看详情
        </Button>,
      ]}
    >
      <List.Item.Meta
        avatar={
          <Avatar
            size={64}
            src={task.publisher?.avatarUrl}
            icon={<UserOutlined />}
          />
        }
        title={
          <Space>
            <Text strong style={{ fontSize: '16px' }}>
              {task.name}
            </Text>
            <Tag color={getInvitationStatusConfig(task.invitationStatus || InvitationStatus.PENDING).color}>
              {getInvitationStatusConfig(task.invitationStatus || InvitationStatus.PENDING).text}
            </Tag>
          </Space>
        }
        description={
          <Space orientation="vertical" size="small" style={{ width: '100%' }}>
            <Text type="secondary">{task.description || '无描述'}</Text>
            
            <Space wrap>
              <Space>
                <UserOutlined />
                <Text>发布者: {task.publisher?.username}</Text>
              </Space>
              
              <Space>
                <DollarOutlined />
                <Text>赏金: {formatBounty(task.bountyAmount)}</Text>
              </Space>
              
              {task.estimatedHours && (
                <Space>
                  <ClockCircleOutlined />
                  <Text>预估工时: {task.estimatedHours}小时</Text>
                </Space>
              )}
            </Space>

            {(task.plannedStartDate || task.plannedEndDate) && (
              <Space>
                <Text type="secondary">
                  计划时间: {formatDate(task.plannedStartDate)} 至 {formatDate(task.plannedEndDate)}
                </Text>
              </Space>
            )}

            {task.tags && task.tags.length > 0 && (
              <Space wrap>
                {task.tags.map((tag) => (
                  <Tag key={tag}>{tag}</Tag>
                ))}
              </Space>
            )}
          </Space>
        }
      />
    </List.Item>
  );
};