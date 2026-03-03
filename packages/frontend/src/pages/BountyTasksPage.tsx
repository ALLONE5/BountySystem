import React, { useState } from 'react';
import { Card, Tabs, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  SearchOutlined,
  MailOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { BrowseTasksPage } from './BrowseTasksPage';
import { TaskInvitationsPage } from './TaskInvitationsPage';

/**
 * 赏金任务模块 - 整合任务浏览和相关功能
 */
export const BountyTasksPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('browse');

  const tabItems = [
    {
      key: 'browse',
      label: (
        <span>
          <SearchOutlined />
          浏览任务
        </span>
      ),
      children: <BrowseTasksPage />,
    },
    {
      key: 'invitations',
      label: (
        <span>
          <MailOutlined />
          任务邀请
        </span>
      ),
      children: <TaskInvitationsPage />,
    },
  ];

  return (
    <div style={{ padding: '0 16px 16px' }}>
      <Card
        className="glass-card"
        title="赏金任务"
        extra={
          <Button
            className="discord-button-primary"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/tasks/published')}
          >
            发布任务
          </Button>
        }
        style={{ marginBottom: 16 }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          size="large"
          tabPosition="top"
        />
      </Card>
    </div>
  );
};