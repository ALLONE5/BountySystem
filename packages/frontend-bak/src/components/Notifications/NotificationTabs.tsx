import React from 'react';
import { Tabs, Badge } from 'antd';

interface NotificationTabsProps {
  activeTab: 'all' | 'unread';
  unreadCount: number;
  onTabChange: (key: 'all' | 'unread') => void;
}

export const NotificationTabs: React.FC<NotificationTabsProps> = ({
  activeTab,
  unreadCount,
  onTabChange,
}) => {
  return (
    <Tabs 
      activeKey={activeTab} 
      onChange={(key) => onTabChange(key as 'all' | 'unread')}
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
  );
};