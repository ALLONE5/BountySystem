import React, { useState } from 'react';
import { Card, Switch, Space, Typography, Divider, Spin } from 'antd';
import { userApi, NotificationPreferences } from '../../api/user';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { useDataFetch } from '../../hooks/useDataFetch';

const { Text } = Typography;

interface NotificationSettingItemProps {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const NotificationSettingItem: React.FC<NotificationSettingItemProps> = ({
  title,
  description,
  checked,
  onChange,
}) => (
  <>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
      <div>
        <Text strong style={{ fontSize: 15 }}>{title}</Text>
        <br />
        <Text type="secondary" style={{ fontSize: 13 }}>{description}</Text>
      </div>
      <Switch checked={checked} onChange={onChange} />
    </div>
    <Divider style={{ margin: '0' }} />
  </>
);

export const NotificationSettings: React.FC = () => {
  const { handleAsyncError } = useErrorHandler();
  const [notificationSettings, setNotificationSettings] = useState<NotificationPreferences>({
    taskAssigned: true,
    taskCompleted: true,
    taskAbandoned: true,
    bountyReceived: true,
    systemNotifications: true,
  });

  const { loading } = useDataFetch(
    () => userApi.getNotificationPreferences(),
    [],
    {
      errorMessage: '加载通知设置失败',
      context: 'NotificationSettings.loadPreferences',
      onSuccess: (data) => setNotificationSettings(data.preferences)
    }
  );

  const handleNotificationChange = async (key: keyof NotificationPreferences, value: boolean) => {
    const newSettings = {
      ...notificationSettings,
      [key]: value,
    };

    try {
      setNotificationSettings(newSettings);
      await handleAsyncError(
        () => userApi.updateNotificationPreferences(newSettings),
        'NotificationSettings.updatePreferences',
        '通知设置已更新',
        '更新通知设置失败'
      );
    } catch (error) {
      // Revert the change if API call fails
      setNotificationSettings(notificationSettings);
    }
  };

  const notificationItems = [
    {
      key: 'taskAssigned' as keyof NotificationPreferences,
      title: '任务被承接',
      description: '当您发布的任务被他人承接时通知您'
    },
    {
      key: 'taskCompleted' as keyof NotificationPreferences,
      title: '任务完成',
      description: '当您承接的任务完成时通知您'
    },
    {
      key: 'taskAbandoned' as keyof NotificationPreferences,
      title: '任务被放弃',
      description: '当您发布的任务被承接者放弃时通知您'
    },
    {
      key: 'bountyReceived' as keyof NotificationPreferences,
      title: '赏金到账',
      description: '当您获得赏金时通知您'
    },
    {
      key: 'systemNotifications' as keyof NotificationPreferences,
      title: '系统通知',
      description: '接收系统重要通知和公告'
    }
  ];

  return (
    <Card title={<Text strong style={{ fontSize: 16 }}>🔔 通知设置</Text>} style={{ marginBottom: 24 }}>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>
            <Text type="secondary">加载通知设置中...</Text>
          </div>
        </div>
      ) : (
        <Space orientation="vertical" style={{ width: '100%' }} size="large">
          {notificationItems.map((item) => (
            <NotificationSettingItem
              key={item.key}
              title={item.title}
              description={item.description}
              checked={notificationSettings[item.key]}
              onChange={(checked) => handleNotificationChange(item.key, checked)}
            />
          ))}
        </Space>
      )}
    </Card>
  );
};