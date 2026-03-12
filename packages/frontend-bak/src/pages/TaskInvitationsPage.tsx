import React, { useState } from 'react';
import { Card, Space, Typography, Spin } from 'antd';
import { taskApi } from '../api/task';
import { Task } from '../types';
import { TaskDetailDrawer } from '../components/TaskDetailDrawer';
import { useDataFetch } from '../hooks/useDataFetch';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { InvitationList } from '../components/TaskInvitations/InvitationList';
import { RejectTaskModal } from '../components/TaskInvitations/RejectTaskModal';

const { Title, Text } = Typography;

export const TaskInvitationsPage: React.FC = () => {
  const { handleAsyncError } = useErrorHandler();
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const { data: invitations, loading, refetch } = useDataFetch(
    () => taskApi.getTaskInvitations(),
    [],
    {
      errorMessage: '加载任务邀请失败',
      context: 'TaskInvitationsPage.loadInvitations'
    }
  );

  const invitationList = invitations || [];

  const handleAccept = async (task: Task) => {
    setActionLoading(task.id);
    try {
      await handleAsyncError(
        () => taskApi.acceptTaskAssignment(task.id),
        'TaskInvitationsPage.acceptTask',
        '已接受任务',
        '接受任务失败'
      );
      refetch();
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectClick = (task: Task) => {
    setSelectedTask(task);
    setRejectReason('');
    setRejectModalVisible(true);
  };

  const handleRejectConfirm = async () => {
    if (!selectedTask) return;

    setActionLoading(selectedTask.id);
    try {
      await handleAsyncError(
        () => taskApi.rejectTaskAssignment(selectedTask.id, rejectReason),
        'TaskInvitationsPage.rejectTask',
        '已拒绝任务',
        '拒绝任务失败'
      );
      setRejectModalVisible(false);
      setSelectedTask(null);
      setRejectReason('');
      refetch();
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewDetails = (task: Task) => {
    setSelectedTask(task);
    setDetailDrawerVisible(true);
  };

  const handleRejectModalCancel = () => {
    setRejectModalVisible(false);
    setSelectedTask(null);
    setRejectReason('');
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Space orientation="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Title level={2}>任务邀请</Title>
            <Text type="secondary">
              您收到了 {invitationList.length} 个任务指派邀请
            </Text>
          </div>

          <InvitationList
            invitations={invitationList}
            actionLoading={actionLoading}
            onAccept={handleAccept}
            onReject={handleRejectClick}
            onViewDetails={handleViewDetails}
          />
        </Space>
      </Card>

      <RejectTaskModal
        visible={rejectModalVisible}
        task={selectedTask}
        rejectReason={rejectReason}
        loading={actionLoading === selectedTask?.id}
        onReasonChange={setRejectReason}
        onConfirm={handleRejectConfirm}
        onCancel={handleRejectModalCancel}
      />

      <TaskDetailDrawer
        task={selectedTask}
        visible={detailDrawerVisible}
        onClose={() => setDetailDrawerVisible(false)}
      />
    </div>
  );
};