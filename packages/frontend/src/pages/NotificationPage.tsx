import React, { useState, useEffect } from 'react';
import { Card, Button, Typography } from 'antd';
import { BellOutlined } from '@ant-design/icons';
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
import { useErrorHandler } from '../hooks/useErrorHandler';
import { NotificationTabs } from '../components/Notifications/NotificationTabs';
import { message } from '../utils/message';
import { NotificationList } from '../components/Notifications/NotificationList';
import { RejectTaskModal } from '../components/Notifications/RejectTaskModal';
import { logger } from '../utils/logger';

const { Title, Text } = Typography;

export const NotificationPage: React.FC = () => {
  const navigate = useNavigate();
  const { refreshUnreadCount } = useNotificationContext();
  const { handleAsyncError } = useErrorHandler();
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
      logger.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    await handleAsyncError(
      () => markAsRead(notificationId),
      'NotificationPage.markAsRead',
      '已标记为已读',
      '标记失败'
    );
    loadNotifications();
    refreshUnreadCount();
  };

  const handleMarkAllAsRead = async () => {
    await handleAsyncError(
      () => markAllAsRead(),
      'NotificationPage.markAllAsRead',
      '已全部标记为已读',
      '标记失败'
    );
    loadNotifications();
    refreshUnreadCount();
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
      await handleAsyncError(
        () => groupApi.joinGroup(groupId),
        'NotificationPage.joinGroup',
        'Successfully joined the group',
        'Failed to join group'
      );
      await handleMarkAsRead(notification.id);
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
      await handleAsyncError(
        () => taskApi.acceptTaskAssignment(notification.relatedTaskId!),
        'NotificationPage.acceptTask',
        '已接受任务',
        '接受任务失败'
      );
      await handleMarkAsRead(notification.id);
      loadNotifications();
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
      await handleAsyncError(
        () => taskApi.rejectTaskAssignment(selectedNotification.relatedTaskId!, rejectReason),
        'NotificationPage.rejectTask',
        '已拒绝任务',
        '拒绝任务失败'
      );
      await handleMarkAsRead(selectedNotification.id);
      setRejectModalVisible(false);
      setSelectedNotification(null);
      setRejectReason('');
      loadNotifications();
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectModalCancel = () => {
    setRejectModalVisible(false);
    setSelectedNotification(null);
    setRejectReason('');
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
        <NotificationTabs
          activeTab={activeTab}
          unreadCount={unreadCount}
          onTabChange={setActiveTab}
        />

        <NotificationList
          notifications={notifications}
          loading={loading}
          activeTab={activeTab}
          actionLoading={actionLoading}
          onNotificationClick={handleNotificationClick}
          onAcceptInvitation={handleAcceptInvitation}
          onAcceptTaskInvitation={handleAcceptTaskInvitation}
          onRejectTaskInvitation={handleRejectTaskInvitation}
          onMarkAsRead={handleMarkAsRead}
        />
      </Card>

      <RejectTaskModal
        visible={rejectModalVisible}
        rejectReason={rejectReason}
        loading={actionLoading === selectedNotification?.id}
        onReasonChange={setRejectReason}
        onConfirm={handleRejectTaskInvitationConfirm}
        onCancel={handleRejectModalCancel}
      />
    </div>
  );
};
