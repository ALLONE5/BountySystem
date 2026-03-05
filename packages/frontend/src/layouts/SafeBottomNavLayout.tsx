import React, { useEffect, useMemo, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Button, Avatar, Dropdown, Space, Badge } from 'antd';
import {
  FileTextOutlined,
  TrophyOutlined,
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  SunOutlined,
  MoonOutlined,
  BgColorsOutlined,
} from '@ant-design/icons';

// 安全导入 - 使用 try-catch 包装
let useAuthStore, usePermission, useNotificationContext, useSystemConfig, useTheme;

try {
  ({ useAuthStore } = require('../store/authStore'));
} catch (error) {
  console.error('Failed to import useAuthStore:', error);
}

try {
  ({ usePermission } = require('../hooks/usePermission'));
} catch (error) {
  console.error('Failed to import usePermission:', error);
}

try {
  ({ useNotificationContext } = require('../contexts/NotificationContext'));
} catch (error) {
  console.error('Failed to import useNotificationContext:', error);
}

try {
  ({ useSystemConfig } = require('../contexts/SystemConfigContext'));
} catch (error) {
  console.error('Failed to import useSystemConfig:', error);
}

try {
  ({ useTheme } = require('../contexts/ThemeContext'));
} catch (error) {
  console.error('Failed to import useTheme:', error);
}

const { Header, Content } = Layout;

export const SafeBottomNavLayout: React.FC = () => {
  console.log('🔥 SafeBottomNavLayout is rendering!');
  
  const navigate = useNavigate();
  const location = useLocation();
  
  // 安全使用 hooks
  const authData = useAuthStore ? useAuthStore() : { user: null, clearAuth: () => {} };
  const permissionData = usePermission ? usePermission() : { 
    isSuperAdmin: () => false, 
    isPositionAdmin: () => false, 
    isDeveloper: () => false 
  };
  const notificationData = useNotificationContext ? useNotificationContext() : { 
    unreadCount: 0, 
    refreshUnreadCount: () => {} 
  };
  const systemConfigData = useSystemConfig ? useSystemConfig() : { config: null };
  const themeData = useTheme ? useTheme() : { 
    theme: {}, 
    themeMode: 'light', 
    allowThemeSwitch: false, 
    setThemeMode: () => {} 
  };

  const { user, clearAuth } = authData;
  const { isSuperAdmin, isPositionAdmin, isDeveloper } = permissionData;
  const { unreadCount, refreshUnreadCount } = notificationData;
  const { config: systemConfig } = systemConfigData;
  const { theme, themeMode, allowThemeSwitch, setThemeMode } = themeData;
  
  const isCyberpunk = themeMode === 'cyberpunk';

  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [invitationCount, setInvitationCount] = useState(0);

  const currentTab = useMemo(() => {
    const path = location.pathname;
    
    // 我的模块 - 个人相关页面
    if (path.startsWith('/dashboard') || path.startsWith('/my') || 
        path.startsWith('/profile') || path.startsWith('/settings') || 
        path.startsWith('/notifications') || path.startsWith('/tasks/published') || 
        path.startsWith('/tasks/assigned') || path.startsWith('/groups')) {
      return 'mine';
    }
    
    // 赏金任务模块 - 任务浏览和相关功能
    if (path.startsWith('/bounty-tasks') || path.startsWith('/tasks/browse') || 
        path.startsWith('/tasks/invitations')) {
      return 'tasks';
    }
    
    // 猎人排名模块
    if (path.startsWith('/ranking')) {
      return 'ranking';
    }
    
    // 管理模块 - 管理员功能
    if (path.startsWith('/admin') && !path.startsWith('/admin/system-config') && !path.startsWith('/admin/audit-logs')) {
      return 'admin';
    }
    
    // 开发模块 - 开发者功能
    if (path.startsWith('/admin/system-config') || path.startsWith('/admin/audit-logs')) {
      return 'dev';
    }
    
    return 'mine'; // 默认
  }, [location.pathname]);

  // 移除所有 API 调用，避免异步错误
  // useEffect(() => {
  //   // 移除 avatarApi 调用
  // }, [user?.id]);

  const handleLogout = () => {
    clearAuth();
    navigate('/auth/login');
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人信息',
      onClick: () => navigate('/profile'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置',
      onClick: () => navigate('/settings'),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <Layout style={{ minHeight: '100vh' }} className={`bottom-nav-layout theme-${themeMode} ${isCyberpunk ? 'cyberpunk-theme' : ''}`}>
      {/* 调试横幅 */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: '#52c41a',
        color: 'white',
        textAlign: 'center',
        padding: '8px',
        fontSize: '14px',
        fontWeight: 'bold',
        zIndex: 99999
      }}>
        🔥 SafeBottomNavLayout 正在工作！无 API 调用版本
      </div>
      
      {/* Header */}
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: isCyberpunk ? 'rgba(21, 21, 32, 0.6)' : themeMode === 'dark' ? 'rgba(26, 26, 36, 0.6)' : 'rgba(255, 255, 255, 0.7)',
          padding: '0 24px',
          marginTop: '40px', // 为调试横幅留空间
          height: 64,
        }}
      >
        <div style={{ 
          color: isCyberpunk ? '#00f2ff' : themeMode === 'dark' ? '#00d9ff' : '#1890ff', 
          fontSize: 18, 
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          {systemConfig?.logoUrl ? (
            <img 
              src={systemConfig.logoUrl.startsWith('http') ? systemConfig.logoUrl : `http://localhost:3000${systemConfig.logoUrl}`} 
              alt="Logo" 
              style={{ 
                height: 32, 
                width: 'auto',
                maxWidth: 40,
                objectFit: 'contain',
              }} 
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : null}
          <span>{systemConfig?.siteName || '赏金平台'}</span>
        </div>
        
        <Space size="large">
          <Badge count={unreadCount} offset={[-5, 5]}>
            <BellOutlined
              style={{ 
                color: '#ff4d4f', 
                fontSize: 18, 
                cursor: 'pointer',
              }}
              onClick={() => {
                navigate('/notifications');
                setTimeout(refreshUnreadCount, 500);
              }}
            />
          </Badge>
          
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar 
                src={avatarUrl} 
                icon={!avatarUrl ? <UserOutlined /> : undefined}
                style={{ 
                  border: '2px solid #1890ff',
                  cursor: 'pointer',
                }}
              />
            </Space>
          </Dropdown>
        </Space>
      </Header>

      {/* Main Content */}
      <Content
        style={{
          flex: 1,
          padding: 24,
          paddingBottom: 120,
          background: 'transparent',
          overflowY: 'auto',
        }}
      >
        <Outlet />
      </Content>

      {/* Bottom Navigation */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '80px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        padding: '0 16px',
        zIndex: 1000,
      }}>
        {/* 我的模块 */}
        <Button
          type={currentTab === 'mine' ? 'primary' : 'text'}
          icon={<UserOutlined style={{ fontSize: 24 }} />}
          onClick={() => handleNavigation('/my')}
          style={{ 
            color: currentTab === 'mine' ? 'white' : 'rgba(255,255,255,0.8)',
            border: 'none',
            background: 'none',
            height: '60px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          我的
        </Button>

        {/* 赏金任务模块 */}
        <Button
          type={currentTab === 'tasks' ? 'primary' : 'text'}
          icon={<FileTextOutlined style={{ fontSize: 24 }} />}
          onClick={() => handleNavigation('/bounty-tasks')}
          style={{ 
            color: currentTab === 'tasks' ? 'white' : 'rgba(255,255,255,0.8)',
            border: 'none',
            background: 'none',
            height: '60px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          赏金
        </Button>

        {/* 猎人排名模块 */}
        <Button
          type={currentTab === 'ranking' ? 'primary' : 'text'}
          icon={<TrophyOutlined style={{ fontSize: 24 }} />}
          onClick={() => handleNavigation('/ranking')}
          style={{ 
            color: currentTab === 'ranking' ? 'white' : 'rgba(255,255,255,0.8)',
            border: 'none',
            background: 'none',
            height: '60px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          排名
        </Button>

        {/* 管理模块 */}
        {(isSuperAdmin() || isPositionAdmin() || isDeveloper()) && (
          <Button
            type={currentTab === 'admin' ? 'primary' : 'text'}
            icon={<SettingOutlined style={{ fontSize: 24 }} />}
            onClick={() => handleNavigation('/admin')}
            style={{ 
              color: currentTab === 'admin' ? 'white' : 'rgba(255,255,255,0.8)',
              border: 'none',
              background: 'none',
              height: '60px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            管理
          </Button>
        )}
      </div>
    </Layout>
  );
};