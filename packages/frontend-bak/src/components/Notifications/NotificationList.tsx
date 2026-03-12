import React from 'react';
import { List, Empty, Spin } from 'antd';
import { Notification } from '../../types';
import { NotificationItem } from './NotificationItem';

interface NotificationListProps {
  notifications: Notification[];
  loading: boolean;
  activeTab: 'all' | 'unread';
  actionLoading: string | null;
  onNotificationClick: (notification: Notification) => void;
  onAcceptInvitation: (notification: Notification, e: React.MouseEvent) => void;
  onAcceptTaskInvitation: (notification: Notification, e: React.MouseEvent) => void;
  onRejectTaskInvitation: (notification: Notification, e: React.MouseEvent) => void;
  onMarkAsRead: (notificationId: string, e: React.MouseEvent) => void;
}

export const NotificationList: React.FC<NotificationListProps> = ({
  notifications,
  loading,
  activeTab,
  actionLoading,
  onNotificationClick,
  onAcceptInvitation,
  onAcceptTaskInvitation,
  onRejectTaskInvitation,
  onMarkAsRead,
}) => {
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <Empty
        description={activeTab === 'unread' ? '没有未读通知' : '暂无通知'}
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  return (
    <List
      itemLayout="horizontal"
      dataSource={notifications}
      renderItem={(notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          actionLoading={actionLoading}
          onNotificationClick={onNotificationClick}
          onAcceptInvitation={onAcceptInvitation}
          onAcceptTaskInvitation={onAcceptTaskInvitation}
          onRejectTaskInvitation={onRejectTaskInvitation}
          onMarkAsRead={onMarkAsRead}
        />
      )}
    />
  );
};