import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Layout, 
  Button, 
  Avatar, 
  Dropdown, 
  Space, 
  Badge, 
  Tooltip,
  Breadcrumb
} from 'antd';
import {
  MenuOutlined,
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  SunOutlined,
  MoonOutlined,
  BgColorsOutlined,
  HomeOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../store/authStore';
import { useNotificationContext } from '../../contexts/NotificationContext';
import { useSystemConfig } from '../../contexts/SystemConfigContext';
import { useTheme } from '../../contexts/ThemeContext';
import { avatarApi } from '../../api/avatar';
import './ModernHeader.css';

const { Header } = Layout;
// Search组件已移除

interface ModernHeaderProps {
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  isMobile: boolean;
}

export const ModernHeader: React.FC<ModernHeaderProps> = ({
  sidebarCollapsed,
  onToggleSidebar,
  isMobile,
}) => {
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();
  const { unreadCount, refreshUnreadCount } = useNotificationContext();
  const { config: systemConfig } = useSystemConfig();
  const { themeMode, allowThemeSwitch, setThemeMode } = useTheme();
  
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  // 搜索相关状态已移除

  // 加载用户头像
  useEffect(() => {
    const loadAvatar = async () => {
      try {
        const avatar = await avatarApi.getUserAvatar();
        setAvatarUrl(avatar?.imageUrl);
      } catch (error: any) {
        if (error.response?.status !== 404) {
          console.error('Failed to load user avatar:', error);
        }
        setAvatarUrl(undefined);
      }
    };
    
    if (user?.id) {
      loadAvatar();
    }
  }, [user?.id]);

  // 监听头像更新事件
  useEffect(() => {
    const handler = () => {
      avatarApi
        .getUserAvatar()
        .then((avatar: any) => setAvatarUrl(avatar?.imageUrl))
        .catch((error: any) => {
          if (error.response?.status !== 404) {
            console.error('Failed to refresh user avatar:', error);
          }
          setAvatarUrl(undefined);
        });
    };
    
    window.addEventListener('avatar-updated', handler);
    return () => window.removeEventListener('avatar-updated', handler);
  }, []);

  const handleLogout = () => {
    clearAuth();
    navigate('/auth/login');
  };

  // 搜索函数已移除

  // 用户菜单项
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

  // 主题切换菜单
  const themeMenuItems = allowThemeSwitch ? [
    {
      key: 'light',
      icon: <SunOutlined />,
      label: '亮色主题',
      onClick: () => setThemeMode('light'),
    },
    {
      key: 'dark',
      icon: <MoonOutlined />,
      label: '暗色主题',
      onClick: () => setThemeMode('dark'),
    },
    {
      key: 'cyberpunk',
      icon: <BgColorsOutlined />,
      label: '赛博主题',
      onClick: () => setThemeMode('cyberpunk'),
    },
  ] : [];

  const getThemeIcon = () => {
    switch (themeMode) {
      case 'light': return <SunOutlined />;
      case 'cyberpunk': return <BgColorsOutlined />;
      default: return <MoonOutlined />;
    }
  };

  return (
    <Header className="modern-header glass">
      <div className="header-content">
        {/* 左侧区域 */}
        <div className="header-left">
          {/* 菜单切换按钮 */}
          <Button
            type="text"
            icon={<MenuOutlined />}
            onClick={onToggleSidebar}
            className="sidebar-toggle glass-button"
            size="large"
          />

          {/* Logo 和站点名称 */}
          <div className="site-branding" onClick={() => navigate('/dashboard')}>
            {systemConfig?.logoUrl && (
              <img 
                src={systemConfig.logoUrl.startsWith('http') 
                  ? systemConfig.logoUrl 
                  : `http://localhost:3000${systemConfig.logoUrl}`
                } 
                alt="Logo" 
                className="site-logo"
                onError={(e) => {
                  console.error('Logo failed to load:', systemConfig.logoUrl);
                  e.currentTarget.style.display = 'none';
                }}
              />
            )}
            <span className="site-name text-gradient">
              {systemConfig?.siteName || '赏金平台'}
            </span>
          </div>

          {/* 面包屑导航 */}
          {!isMobile && (
            <Breadcrumb className="header-breadcrumb">
              <Breadcrumb.Item>
                <HomeOutlined />
              </Breadcrumb.Item>
              <Breadcrumb.Item>当前页面</Breadcrumb.Item>
            </Breadcrumb>
          )}
        </div>

        {/* 中间区域 - 搜索已移除 */}
        <div className="header-center">
          {/* 搜索功能已移除 */}
        </div>

        {/* 右侧区域 */}
        <div className="header-right">
          <Space size="middle">
            {/* 移动端搜索已移除 */}

            {/* 主题切换 */}
            {allowThemeSwitch && (
              <Dropdown
                menu={{ 
                  items: themeMenuItems,
                  selectedKeys: [themeMode],
                }}
                placement="bottomRight"
                trigger={['click']}
              >
                <Button
                  type="text"
                  icon={getThemeIcon()}
                  className="theme-toggle glass-button"
                  size="large"
                />
              </Dropdown>
            )}

            {/* 通知铃铛 */}
            <Tooltip title="通知" placement="bottom">
              <Badge count={unreadCount} offset={[-2, 2]}>
                <Button
                  type="text"
                  icon={<BellOutlined />}
                  onClick={() => {
                    navigate('/notifications');
                    setTimeout(refreshUnreadCount, 500);
                  }}
                  className="notification-button glass-button"
                  size="large"
                />
              </Badge>
            </Tooltip>

            {/* 用户头像和菜单 */}
            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              trigger={['click']}
            >
              <div className="user-profile-area">
                <Avatar 
                  src={avatarUrl} 
                  icon={!avatarUrl ? <UserOutlined /> : undefined}
                  size={36}
                  className="user-avatar"
                />
                {!isMobile && (
                  <div className="user-info">
                    <div className="username">{user?.username || '用户'}</div>
                    <div className="user-role">在线</div>
                  </div>
                )}
              </div>
            </Dropdown>
          </Space>
        </div>
      </div>

      {/* 移动端搜索覆盖层已移除 */}
    </Header>
  );
};