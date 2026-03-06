/**
 * 任务邀请列表组件
 * 显示和管理任务邀请
 */

import React, { useState } from 'react';
import { List, Button, Avatar, Space, Tag, Empty, Modal, Input, Typography } from 'antd';
import {
  CheckOutlined,
  CloseOutlined,
  EyeOutlined,
  UserOutlined,
  DollarOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { Task } from '../../types';
import { taskApi } from '../../api/task';
import { useErrorHandler } from '../../hooks/useErrorHandler';

const { Text } = Typography;
const { TextArea } = Input;

interface TaskInvitationsListProps {
  invitations: Task[];
  loading: boolean;
  onInvitationUpdated: () => void;
  onViewTask: (task: Task) => void;
}

export const TaskInvitationsList: React.FC<TaskInvitationsListProps> = ({
  invitations,
  loading,
  onInvitationUpdated,
  onViewTask
}) => {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const { handleAsyncError } = useErrorHandler();

  const formatBounty = (amount: number) => {
    return `¥${Number(amount || 0).toFixed(2)}`;
  };

  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return '-';
    return dayjs(date).format('YYYY-MM-DD');
  };

  const handleAcceptInvitation = async (task: Task) => {
    setActionLoading(task.id);
    await handleAsyncError(
      async () => {
        await taskApi.acceptTaskAssignment(task.id);
        onInvitationUpdated();
        // 触发事件更新主布局中的邀请计数
        window.dispatchEvent(new Event('invitation-updated'));
      },
      'TaskInvitationsList.acceptInvitation',
      '已接受任务',
      '接受任务失败'
    ).finally(() => {
      setActionLoading(null);
    });
  };

  const handleRejectInvitationClick = (task: Task) => {
    setSelectedTask(task);
    setRejectReason('');
    setRejectModalVisible(true);
  };

  const handleRejectInvitationConfirm = async () => {
    if (!selectedTask) return;

    setActionLoading(selectedTask.id);
    await handleAsyncError(
      async () => {
        await taskApi.rejectTaskAssignment(selectedTask.id, rejectReason);
        setRejectModalVisible(false);
        setSelectedTask(null);
        setRejectReason('');
        onInvitationUpdated();
        // 触发事件更新主布局中的邀请计数
        window.dispatchEvent(new Event('invitation-updated'));
      },
      'TaskInvitationsList.rejectInvitation',
      '已拒绝任务',
      '拒绝任务失败'
    ).finally(() => {
      setActionLoading(null);
    });
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px 0' }}>
        <Empty description="加载中..." />
      </div>
    );
  }

  if (invitations.length === 0) {
    return (
      <Empty
        description="暂无任务邀请"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        style={{ padding: '50px 0' }}
      />
    );
  }

  return (
    <>
      <List
        dataSource={invitations}
        renderItem={(task) => (
          <List.Item
            key={task.id}
            actions={[
              <Button
                key="accept"
                type="primary"
                icon={<CheckOutlined />}
                onClick={() => handleAcceptInvitation(task)}
                loading={actionLoading === task.id}
              >
                接受
              </Button>,
              <Button
                key="reject"
                danger
                icon={<CloseOutlined />}
                onClick={() => handleRejectInvitationClick(task)}
                loading={actionLoading === task.id}
              >
                拒绝
              </Button>,
              <Button
                key="view"
                icon={<EyeOutlined />}
                onClick={() => onViewTask(task)}
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
                  <Tag color="orange">待接受</Tag>
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
                      <Text>赏金: {formatBounty(task.bountyAmount || task.bounty)}</Text>
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
        )}
      />

      {/* 拒绝任务邀请模态框 */}
      <Modal
        title="拒绝任务邀请"
        open={rejectModalVisible}
        onOk={handleRejectInvitationConfirm}
        onCancel={() => {
          setRejectModalVisible(false);
          setSelectedTask(null);
          setRejectReason('');
        }}
        okText="确认拒绝"
        cancelText="取消"
        okButtonProps={{ danger: true, loading: actionLoading === selectedTask?.id }}
      >
        <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
          <Text>您确定要拒绝任务 "{selectedTask?.name}" 吗？</Text>
          
          <div>
            <Text>拒绝原因（可选）：</Text>
            <TextArea
              rows={4}
              placeholder="请输入拒绝原因，这将发送给任务发布者"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              maxLength={500}
              showCount
            />
          </div>
        </Space>
      </Modal>
    </>
  );
};