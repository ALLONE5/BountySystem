/**
 * 仪表盘英雄区域组件
 * 显示欢迎信息和用户头像
 */

import React from 'react';
import { Button, Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { User } from '../../types';

interface DashboardHeroProps {
  user: User | null;
}

export const DashboardHero: React.FC<DashboardHeroProps> = ({ user }) => {
  const navigate = useNavigate();

  return (
    <div className="dashboard-hero">
      <div className="hero-content">
        <div className="hero-text">
          <h1 className="hero-title">
            欢迎回来，{user?.username}！
          </h1>
          <p className="hero-subtitle">
            这是您的个人工作台，查看最新的任务动态和统计信息
          </p>
          <div className="hero-actions">
            <Button 
              type="primary" 
              className="hero-btn hero-btn-primary"
              onClick={() => navigate('/bounty-tasks')}
            >
              浏览任务市场
            </Button>
            <Button 
              className="hero-btn hero-btn-secondary"
              onClick={() => navigate('/my/bounties')}
            >
              查看我的任务
            </Button>
          </div>
        </div>
        <div className="hero-visual">
          <Avatar 
            size={120}
            src={user?.avatarUrl}
            icon={<UserOutlined />}
            className="hero-avatar"
            onClick={() => navigate('/profile')}
            style={{ cursor: 'pointer' }}
          >
            {user?.username?.charAt(0).toUpperCase()}
          </Avatar>
        </div>
      </div>
    </div>
  );
};