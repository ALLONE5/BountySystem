import React, { useEffect, useState } from 'react';
import {
  Card,
  List,
  Button,
  Space,
  Typography,
  Tag,
  Avatar,
  Modal,
  Input,
  message,
  Empty,
  Spin,
} from 'antd';
import {
  CheckOutlined,
  CloseOutlined,
  EyeOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { taskApi } from '../api/task';
import { Task, InvitationStatus } from '../types';
import { TaskDetailDrawer } from '../components/TaskDetailDrawer';
import { getInvitationStatusConfig } from '../utils/statusConfig';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;

export const TaskInvitationsPage: React.FC = () => {
  const [invitations, setInvitations] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadInvitations();
  }, []);

  const loadInvitations = async () => {
    setLoading(true);
    try {
      const data = await taskApi.getTaskInvitations();
      setInvitations(data);
    } catch (error) {
      message.error('加载任务邀请失败');
      console.error('Failed to load invitations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (task: Task) => {
    setActionLoading(task.id);
    try {
      await taskApi.acceptTaskAssignment(task.id);
      message.success('已接受任务');
      loadInvitations();
    } catch (error: any) {
      message.error(error.response?.data?.message || '接受任务失败');
      console.error('Failed to accept task:', error);
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
      await taskApi.rejectTaskAssignment(selectedTask.id, rejectReason);
      message.success('已拒绝任务');
      setRejectModalVisible(false);
      setSelectedTask(null);
      setRejectReason('');
      loadInvitations();
    } catch (error: any) {
      message.error(error.response?.data?.message || '拒绝任务失败');
      console.error('Failed to reject task:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewDetails = (task: Task) => {
    setSelectedTask(task);
    setDetailDrawerVisible(true);
  };

  const formatBounty = (amount: number) => {
    return `¥${Number(amount || 0).toFixed(2)}`;
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '-';
    return dayjs(date).format('YYYY-MM-DD');
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
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Title level={2}>任务邀请</Title>
            <Text type="secondary">
              您收到了 {invitations.length} 个任务指派邀请
            </Text>
          </div>

          {invitations.length === 0 ? (
            <Empty
              description="暂无任务邀请"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
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
                      onClick={() => handleAccept(task)}
                      loading={actionLoading === task.id}
                    >
                      接受
                    </Button>,
                    <Button
                      key="reject"
                      danger
                      icon={<CloseOutlined />}
                      onClick={() => handleRejectClick(task)}
                      loading={actionLoading === task.id}
                    >
                      拒绝
                    </Button>,
                    <Button
                      key="view"
                      icon={<EyeOutlined />}
                      onClick={() => handleViewDetails(task)}
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
                      <Space direction="vertical" size="small" style={{ width: '100%' }}>
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
              )}
            />
          )}
        </Space>
      </Card>

      {/* 拒绝任务模态框 */}
      <Modal
        title="拒绝任务指派"
        open={rejectModalVisible}
        onOk={handleRejectConfirm}
        onCancel={() => {
          setRejectModalVisible(false);
          setSelectedTask(null);
          setRejectReason('');
        }}
        okText="确认拒绝"
        cancelText="取消"
        okButtonProps={{ danger: true, loading: actionLoading === selectedTask?.id }}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
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

      {/* 任务详情抽屉 */}
      {selectedTask && (
        <TaskDetailDrawer
          visible={detailDrawerVisible}
          task={selectedTask}
          onClose={() => {
            setDetailDrawerVisible(false);
            setSelectedTask(null);
          }}
          onTaskUpdated={loadInvitations}
        />
      )}
    </div>
  );
};
