import React from 'react';
import { Card, Tabs, Button, Space } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  UserOutlined,
  FileTextOutlined,
  CheckSquareOutlined,
  TeamOutlined,
  SettingOutlined,
  BellOutlined,
} from '@ant-design/icons';
import { DashboardPage } from '../../pages/DashboardPage';
import PublishedTasksPage from '../../pages/PublishedTasksPage';
import { AssignedTasksPage } from '../../pages/AssignedTasksPage';
import { GroupsPage } from '../../pages/GroupsPage';

interface MyTabsProps {
  activeTab: string;
  onTabChange: (key: string) => void;
}

export const MyTabs: React.FC<MyTabsProps> = ({
  activeTab,
  onTabChange
}) => {
  const navigate = useNavigate();

  const tabItems = [
    {
      key: 'dashboard',
      label: (
        <span>
          <UserOutlined />
          个人界面
        </span>
      ),
      children: <DashboardPage />,
    },
    {
      key: 'published',
      label: (
        <span>
          <FileTextOutlined />
          我的悬赏
        </span>
      ),
      children: <PublishedTasksPage />,
    },
    {
      key: 'assigned',
      label: (
        <span>
          <CheckSquareOutlined />
          我的任务
        </span>
      ),
      children: <AssignedTasksPage />,
    },
    {
      key: 'groups',
      label: (
        <span>
          <TeamOutlined />
          我的组群
        </span>
      ),
      children: <GroupsPage />,
    },
  ];

  return (
    <Card
      className="glass-card"
      title="我的"
      extra={
        <Space>
          <Button
            className="glass-button"
            icon={<BellOutlined />}
            onClick={() => navigate('/notifications')}
          >
            通知
          </Button>
          <Button
            type="primary"
            icon={<SettingOutlined />}
            onClick={() => navigate('/settings')}
          >
            设置
          </Button>
        </Space>
      }
      style={{ marginBottom: 16 }}
    >
      <Tabs
        activeKey={activeTab}
        onChange={onTabChange}
        items={tabItems}
        size="large"
        tabPosition="top"
      />
    </Card>
  );
};