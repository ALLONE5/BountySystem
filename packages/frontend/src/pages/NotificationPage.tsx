import React, { useState, useEffect } from 'react';
import {
  List,
  Card,
  Badge,
  Button,
  Space,
  Typography,
  Tag,
  Empty,
  Spin,
  message,
  Tabs,
  Modal,
  Input,
} from 'antd';
import {
  BellOutlined,
  CheckOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  TeamOutlined,
  WarningOutlined,
  UserOutlined,
  CloseOutlined,
  MailOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { Notification } from '../types';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
} from '../api/notification';
import { groupApi } from '../api/group';
import { taskApi } from '../api/task';
import { useNotificationContext } from '../contexts/NotificationContext';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

export const NotificationPage: React.FC = () => {
  const navigate = useNavigate();
  const { refreshUnreadCount } = useNotificationContext();
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadNotifications();
  }, [activeTab]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const unreadOnly = activeTab === 'unread';
      const data = await getNotifications(unreadOnly);
      setNotifications(data);
    } catch (error) {
      message.error('加载通知失败');
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead(notificationId);
      message.success('已标记为已读');
      loadNotifications();
      refreshUnreadCount();
    } catch (error) {
      message.error('标记失败');
      console.error('Error marking as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      message.success('已全部标记为已读');
      loadNotifications();
      refreshUnreadCount();
    } catch (error) {
      message.error('标记失败');
      console.error('Error marking all as read:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read if unread
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }

    // Navigate based on notification type
    if (notification.relatedTaskId) {
      // For task invitations, go to assigned tasks page (invitations tab)
      if (notification.type === 'task_invitation') {
        navigate('/tasks/assigned');
      }
      // For task assignments and other task-related notifications, go to assigned tasks
      else if (notification.type === 'task_assigned' || 
               notification.type === 'deadline_reminder' ||
               notification.type === 'dependency_resolved' ||
               notification.type === 'status_changed') {
        navigate('/tasks/assigned');
      }
      // For invitation responses, go to published tasks
      else if (notification.type === 'task_invitation_accepted' ||
               notification.type === 'task_invitation_rejected') {
        navigate('/tasks/published');
      }
      // Default: go to dashboard
      else {
        navigate('/dashboard');
      }
    }
  };

  const handleAcceptInvitation = async (notification: Notification, e: React.MouseEvent) => {
    e.stopPropagation();
    const match = notification.message.match(/Group ID: ([a-f0-9-]+)/);
    if (match && match[1]) {
      const groupId = match[1];
      try {
        await groupApi.joinGroup(groupId);
        message.success('Successfully joined the group');
        await handleMarkAsRead(notification.id);
      } catch (error) {
        message.error('Failed to join group');
        console.error(error);
      }
    } else {
      message.error('Invalid invitation format');
    }
  };

  const handleAcceptTaskInvitation = async (notification: Notification, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!notification.relatedTaskId) {
      message.error('无效的任务邀请');
      return;
    }

    setActionLoading(notification.id);
    try {
      await taskApi.acceptTaskAssignment(notification.relatedTaskId);
      message.success('已接受任务');
      await handleMarkAsRead(notification.id);
      loadNotifications();
    } catch (error: any) {
      message.error(error.response?.data?.message || '接受任务失败');
      console.error('Failed to accept task:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectTaskInvitation = (notification: Notification, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedNotification(notification);
    setRejectReason('');
    setRejectModalVisible(true);
  };

  const handleRejectTaskInvitationConfirm = async () => {
    if (!selectedNotification || !selectedNotification.relatedTaskId) return;

    setActionLoading(selectedNotification.id);
    try {
      await taskApi.rejectTaskAssignment(selectedNotification.relatedTaskId, rejectReason);
      message.success('已拒绝任务');
      await handleMarkAsRead(selectedNotification.id);
      setRejectModalVisible(false);
      setSelectedNotification(null);
      setRejectReason('');
      loadNotifications();
    } catch (error: any) {
      message.error(error.response?.data?.message || '拒绝任务失败');
      console.error('Failed to reject task:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'group_invitation':
        return <TeamOutlined style={{ color: '#1890ff' }} />;
      case 'task_assigned':
        return <FileTextOutlined style={{ color: '#1890ff' }} />;
      case 'task_invitation':
        return <MailOutlined style={{ color: '#722ed1' }} />;
      case 'task_invitation_accepted':
        return <CheckOutlined style={{ color: '#52c41a' }} />;
      case 'task_invitation_rejected':
        return <CloseOutlined style={{ color: '#ff4d4f' }} />;
      case 'deadline_reminder':
        return <ClockCircleOutlined style={{ color: '#faad14' }} />;
      case 'dependency_resolved':
        return <CheckOutlined style={{ color: '#52c41a' }} />;
      case 'status_changed':
        return <FileTextOutlined style={{ color: '#722ed1' }} />;
      case 'position_approved':
        return <CheckOutlined style={{ color: '#52c41a' }} />;
      case 'position_rejected':
        return <WarningOutlined style={{ color: '#ff4d4f' }} />;
      case 'review_required':
        return <WarningOutlined style={{ color: '#fa8c16' }} />;
      case 'broadcast':
        return <TeamOutlined style={{ color: '#13c2c2' }} />;
      case 'account_updated':
        return <UserOutlined style={{ color: '#2f54eb' }} />;
      default:
        return <BellOutlined />;
    }
  };

  const getNotificationTypeTag = (type: string) => {
    const typeMap: Record<string, { text: string; color: string }> = {
      group_invitation: { text: '团队邀请', color: 'geekblue' },
      task_assigned: { text: '任务分配', color: 'blue' },
      task_invitation: { text: '任务邀请', color: 'purple' },
      task_invitation_accepted: { text: '邀请已接受', color: 'green' },
      task_invitation_rejected: { text: '邀请已拒绝', color: 'red' },
      deadline_reminder: { text: '截止提醒', color: 'orange' },
      dependency_resolved: { text: '依赖解除', color: 'green' },
      status_changed: { text: '状态变更', color: 'purple' },
      position_approved: { text: '岗位通过', color: 'green' },
      position_rejected: { text: '岗位拒绝', color: 'red' },
      review_required: { text: '审核提醒', color: 'orange' },
      broadcast: { text: '系统广播', color: 'cyan' },
      account_updated: { text: '账户变更', color: 'geekblue' },
    };

    const config = typeMap[type] || { text: '通知', color: 'default' };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffMs = now.getTime() - notificationDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;
    
    return notificationDate.toLocaleDateString('zh-CN');
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="page-container fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <Title level={2} style={{ margin: 0 }}>
            <BellOutlined /> 通知中心
          </Title>
          <Text type="secondary">查看和管理您的所有通知</Text>
        </div>
        {unreadCount > 0 && (
          <Button type="primary" size="large" onClick={handleMarkAllAsRead}>
            全部标记为已读
          </Button>
        )}
      </div>

      <Card>
        <Space orientation="vertical" size="large" style={{ width: '100%' }}>
          <Tabs 
            activeKey={activeTab} 
            onChange={(key) => setActiveTab(key as 'all' | 'unread')}
            items={[
              {
                key: 'all',
                label: (
                  <span style={{ fontSize: 15 }}>
                    全部通知
                    {activeTab === 'all' && unreadCount > 0 && (
                      <Badge count={unreadCount} style={{ marginLeft: 8 }} />
                    )}
                  </span>
                ),
                children: null
              },
              {
                key: 'unread',
                label: (
                  <span style={{ fontSize: 15 }}>
                    未读通知
                    <Badge count={unreadCount} style={{ marginLeft: 8 }} />
                  </span>
                ),
                children: null
              }
            ]}
          />

          {loading ? (
            <div style={{ textAlign: 'center', padding: '50px 0' }}>
              <Spin size="large" />
            </div>
          ) : notifications.length === 0 ? (
            <Empty
              description={activeTab === 'unread' ? '没有未读通知' : '暂无通知'}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <List
              itemLayout="horizontal"
              dataSource={notifications}
              renderItem={(notification) => (
                <List.Item
                  className="task-card"
                  style={{
                    backgroundColor: notification.isRead ? 'transparent' : '#f0f5ff',
                    padding: '16px',
                    borderRadius: '4px',
                    marginBottom: '8px',
                    cursor: notification.relatedTaskId ? 'pointer' : 'default',
                    borderLeft: notification.isRead ? 'none' : '4px solid #1890ff',
                    transition: 'all 0.3s ease',
                  }}
                  onClick={() => handleNotificationClick(notification)}
                  actions={[
                    notification.type === 'group_invitation' && !notification.isRead && (
                      <Button
                        type="primary"
                        size="small"
                        onClick={(e) => handleAcceptInvitation(notification, e)}
                      >
                        接受邀请
                      </Button>
                    ),
                    notification.type === 'task_invitation' && !notification.isRead && (
                      <Button
                        type="primary"
                        size="small"
                        icon={<CheckOutlined />}
                        onClick={(e) => handleAcceptTaskInvitation(notification, e)}
                        loading={actionLoading === notification.id}
                      >
                        接受
                      </Button>
                    ),
                    notification.type === 'task_invitation' && !notification.isRead && (
                      <Button
                        danger
                        size="small"
                        icon={<CloseOutlined />}
                        onClick={(e) => handleRejectTaskInvitation(notification, e)}
                        loading={actionLoading === notification.id}
                      >
                        拒绝
                      </Button>
                    ),
                    !notification.isRead && (
                      <Button
                        type="link"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(notification.id);
                        }}
                      >
                        {notification.type === 'group_invitation' || notification.type === 'task_invitation' ? '忽略' : '标记已读'}
                      </Button>
                    ),
                  ]}

                >
                  <List.Item.Meta
                    avatar={
                      <Badge dot={!notification.isRead}>
                        <div style={{ 
                          fontSize: 28, 
                          width: 48, 
                          height: 48, 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          borderRadius: '50%',
                          backgroundColor: notification.isRead ? '#f5f5f5' : '#e6f7ff',
                        }}>
                          {getNotificationIcon(notification.type)}
                        </div>
                      </Badge>
                    }
                    title={
                      <Space>
                        <Text strong={!notification.isRead} style={{ fontSize: 15 }}>
                          {notification.title}
                        </Text>
                        {getNotificationTypeTag(notification.type)}
                      </Space>
                    }
                    description={
                      <Space orientation="vertical" size="small" style={{ width: '100%' }}>
                        <Paragraph
                          style={{ margin: 0, fontSize: 14 }}
                          ellipsis={{ rows: 2, expandable: true }}
                        >
                          {notification.message}
                        </Paragraph>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          <ClockCircleOutlined /> {formatDate(notification.createdAt)}
                        </Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </Space>
      </Card>

      {/* 拒绝任务邀请模态框 */}
      <Modal
        title="拒绝任务邀请"
        open={rejectModalVisible}
        onOk={handleRejectTaskInvitationConfirm}
        onCancel={() => {
          setRejectModalVisible(false);
          setSelectedNotification(null);
          setRejectReason('');
        }}
        okText="确认拒绝"
        cancelText="取消"
        okButtonProps={{ danger: true, loading: actionLoading === selectedNotification?.id }}
      >
        <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
          <Text>您确定要拒绝这个任务邀请吗？</Text>
          
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
    </div>
  );
};
