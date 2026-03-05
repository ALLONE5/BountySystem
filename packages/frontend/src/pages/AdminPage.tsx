import React, { useState } from 'react';
import { Card, Tabs, Button, Space } from 'antd';
import { useNavigate } from 'react-router-dom';
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
import { UserManagementPage } from './admin/UserManagementPage';
import { GroupManagementPage } from './admin/GroupManagementPage';
import { TaskManagementPage } from './admin/TaskManagementPage';
import { ApplicationReviewPage } from './admin/ApplicationReviewPage';
import { AvatarManagementPage } from './admin/AvatarManagementPage';
import { PositionManagementPage } from './admin/PositionManagementPage';
import { BountyAlgorithmPage } from './admin/BountyAlgorithmPage';
import { NotificationBroadcastPage } from './admin/NotificationBroadcastPage';
import { usePermission } from '../hooks/usePermission';

/**
 * 管理模块 - 整合所有管理功能
 */
export const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('users');
  const { isSuperAdmin } = usePermission();

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
    ...(isSuperAdmin() ? [
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
    <div style={{ padding: '0 16px 16px' }}>
      <Card
        className="glass-card"
        title="管理功能"
        style={{ marginBottom: 16 }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          size="large"
          tabPosition="top"
          type="card"
        />
      </Card>
    </div>
  );
};