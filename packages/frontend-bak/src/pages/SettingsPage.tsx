import React from 'react';
import { Typography } from 'antd';
import { PasswordChangeForm } from '../components/Settings/PasswordChangeForm';
import { NotificationSettings } from '../components/Settings/NotificationSettings';
import { TimezoneSettings } from '../components/Settings/TimezoneSettings';

const { Title, Text } = Typography;

export const SettingsPage: React.FC = () => {
  return (
    <div className="page-container fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <Title level={2} style={{ margin: 0 }}>设置</Title>
          <Text type="secondary">管理您的账户和偏好设置</Text>
        </div>
      </div>

      <PasswordChangeForm />
      <NotificationSettings />
      <TimezoneSettings />
    </div>
  );
};
