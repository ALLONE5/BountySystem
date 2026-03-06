import React from 'react';
import { List, Badge, Button, Space, Typography, Tag } from 'antd';
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
import { Notification } from '../../types';

const { Text, Paragraph } = Typography;

interface NotificationItemProps {
  notification: Notification;
  actionLoading: string | null;
  onNotificationClick: (notification: Notification) => void;
  onAcceptInvitation: (notification: Notification, e: React.MouseEvent) => void;
  onAcceptTaskInvitation: (notification: Notification, e: React.MouseEvent) => void;
  onRejectTaskInvitation: (notification: Notification, e: React.MouseEvent) => void;
  onMarkAsRead: (notificationId: string, e: React.MouseEvent) => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  actionLoading,
  onNotificationClick,
  onAcceptInvitation,
  onAcceptTaskInvitation,
  onRejectTaskInvitation,
  onMarkAsRead,
}) => {
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

  const formatDate = (date: string | Date) => {
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

  const getActions = () => {
    const actions = [];

    if (notification.type === 'group_invitation' && !notification.isRead) {
      actions.push(
        <Button
          key="accept-group"
          type="primary"
          size="small"
          onClick={(e) => onAcceptInvitation(notification, e)}
        >
          接受邀请
        </Button>
      );
    }

    if (notification.type === 'task_invitation' && !notification.isRead) {
      actions.push(
        <Button
          key="accept-task"
          type="primary"
          size="small"
          icon={<CheckOutlined />}
          onClick={(e) => onAcceptTaskInvitation(notification, e)}
          loading={actionLoading === notification.id}
        >
          接受
        </Button>
      );
      actions.push(
        <Button
          key="reject-task"
          danger
          size="small"
          icon={<CloseOutlined />}
          onClick={(e) => onRejectTaskInvitation(notification, e)}
          loading={actionLoading === notification.id}
        >
          拒绝
        </Button>
      );
    }

    if (!notification.isRead) {
      actions.push(
        <Button
          key="mark-read"
          type="link"
          size="small"
          onClick={(e) => onMarkAsRead(notification.id, e)}
        >
          {notification.type === 'group_invitation' || notification.type === 'task_invitation' ? '忽略' : '标记已读'}
        </Button>
      );
    }

    return actions.filter(Boolean);
  };

  return (
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
      onClick={() => onNotificationClick(notification)}
      actions={getActions()}
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
  );
};