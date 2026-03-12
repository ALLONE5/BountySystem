import React from 'react';
import { Card, Tabs } from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  FileTextOutlined,
  CheckSquareOutlined,
  PictureOutlined,
  TagsOutlined,
  CalculatorOutlined,
  BellOutlined,
} from '@ant-design/icons';
import { UserManagementPage } from '../../pages/admin/UserManagementPage';
import { GroupManagementPage } from '../../pages/admin/GroupManagementPage';
import { TaskManagementPage } from '../../pages/admin/TaskManagementPage';
import { ApplicationReviewPage } from '../../pages/admin/ApplicationReviewPage';
import { AvatarManagementPage } from '../../pages/admin/AvatarManagementPage';
import { PositionManagementPage } from '../../pages/admin/PositionManagementPage';
import { BountyAlgorithmPage } from '../../pages/admin/BountyAlgorithmPage';
import { NotificationBroadcastPage } from '../../pages/admin/NotificationBroadcastPage';

interface AdminTabsProps {
  activeTab: string;
  onTabChange: (key: string) => void;
  isSuperAdmin: boolean;
}

export const AdminTabs: React.FC<AdminTabsProps> = ({
  activeTab,
  onTabChange,
  isSuperAdmin
}) => {
  const tabItems = [
    {
      key: 'users',
      label: (
        <span>
          <UserOutlined />
          用户管理
        </span>
      ),
      children: <UserManagementPage />,
    },
    {
      key: 'groups',
      label: (
        <span>
          <TeamOutlined />
          组群管理
        </span>
      ),
      children: <GroupManagementPage />,
    },
    {
      key: 'tasks',
      label: (
        <span>
          <FileTextOutlined />
          任务管理
        </span>
      ),
      children: <TaskManagementPage />,
    },
    {
      key: 'approval',
      label: (
        <span>
          <CheckSquareOutlined />
          申请审核
        </span>
      ),
      children: <ApplicationReviewPage />,
    },
    {
      key: 'avatars',
      label: (
        <span>
          <PictureOutlined />
          头像管理
        </span>
      ),
      children: <AvatarManagementPage />,
    },
    // 只有超级管理员才能看到的功能
    ...(isSuperAdmin ? [
      {
        key: 'positions',
        label: (
          <span>
            <TagsOutlined />
            职位管理
          </span>
        ),
        children: <PositionManagementPage />,
      },
      {
        key: 'bounty-algorithm',
        label: (
          <span>
            <CalculatorOutlined />
            赏金算法
          </span>
        ),
        children: <BountyAlgorithmPage />,
      },
      {
        key: 'notifications',
        label: (
          <span>
            <BellOutlined />
            通知广播
          </span>
        ),
        children: <NotificationBroadcastPage />,
      },
    ] : []),
  ];

  return (
    <Card
      className="glass-card"
      title="管理功能"
      style={{ marginBottom: 16 }}
    >
      <Tabs
        activeKey={activeTab}
        onChange={onTabChange}
        items={tabItems}
        size="large"
        tabPosition="top"
        type="card"
      />
    </Card>
  );
};