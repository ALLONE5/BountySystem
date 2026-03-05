import React, { useEffect, useMemo, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Button, Avatar, Dropdown, Space, Badge } from 'antd';
import { avatarApi } from '../api/avatar';
import { taskApi } from '../api/task';
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
import { useAuthStore } from '../store/authStore';
import { usePermission } from '../hooks/usePermission';
import { useNotificationContext } from '../contexts/NotificationContext';
import { useSystemConfig } from '../contexts/SystemConfigContext';
import { useTheme } from '../contexts/ThemeContext';
import { AnimationEffects } from '../components/animations/AnimationEffects';
import { SystemConfigTest } from '../components/SystemConfigTest';
import './BottomNavLayout.css';

const { Header, Content } = Layout;

export const BottomNavLayout: React.FC = () => {
  console.log('🔥 BottomNavLayout is now rendering! Layout change successful!');
  
  const navigate = useNavigate();
  const location = useLocation();
  const { user, clearAuth } = useAuthStore();
  const { isSuperAdmin, isPositionAdmin, isDeveloper } = usePermission();
  const { unreadCount, refreshUnreadCount } = useNotificationContext();
  const { config: systemConfig } = useSystemConfig();
  const { theme, themeMode, animationStyle, enableAnimations, reducedMotion, allowThemeSwitch, setThemeMode } = useTheme();
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

  useEffect(() => {
    const loadInvitationCount = async () => {
      try {
        const invitations = await taskApi.getTaskInvitations();
        setInvitationCount(invitations.length);
      } catch (error) {
        console.error('Failed to load invitation count:', error);
      }
    };
    loadInvitationCount();
    
    const handleInvitationUpdate = () => {
      loadInvitationCount();
    };
    window.addEventListener('invitation-updated', handleInvitationUpdate);
    
    const interval = setInterval(loadInvitationCount, 30000);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('invitation-updated', handleInvitationUpdate);
    };
  }, []);

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
      {/* 临时调试标识 - 确认 BottomNavLayout 正在使用 */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: '#ff4d4f',
        color: 'white',
        textAlign: 'center',
        padding: '8px',
        fontSize: '14px',
        fontWeight: 'bold',
        zIndex: 99999
      }}>
        🔥 BottomNavLayout 已激活 - 布局切换成功！
      </div>
      
      <AnimationEffects 
        style={animationStyle} 
        enabled={enableAnimations} 
        reducedMotion={reducedMotion} 
      />
      
      {/* Header */}
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: isCyberpunk ? 'rgba(21, 21, 32, 0.6)' : themeMode === 'dark' ? 'rgba(26, 26, 36, 0.6)' : 'rgba(255, 255, 255, 0.7)',
          padding: `0 ${theme.spacing.lg}`,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: isCyberpunk ? '1px solid rgba(0, 242, 255, 0.15)' : themeMode === 'dark' ? '1px solid rgba(0, 217, 255, 0.15)' : '1px solid rgba(0, 0, 0, 0.08)',
          boxShadow: isCyberpunk ? '0 8px 32px rgba(0, 242, 255, 0.1)' : themeMode === 'dark' ? '0 8px 32px rgba(0, 217, 255, 0.08)' : '0 8px 32px rgba(0, 0, 0, 0.08)',
          position: 'sticky',
          top: 0,
          zIndex: 999,
          height: 64,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <div style={{ 
          color: isCyberpunk ? '#00f2ff' : themeMode === 'dark' ? '#00d9ff' : '#1890ff', 
          fontSize: 18, 
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing.sm,
          fontFamily: isCyberpunk || themeMode === 'dark' ? 'Orbitron, monospace' : 'inherit',
          textShadow: isCyberpunk ? '0 0 10px rgba(0, 242, 255, 0.5)' : 'none',
          letterSpacing: '0.5px',
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
                filter: isCyberpunk ? 'drop-shadow(0 0 5px rgba(0, 242, 255, 0.5))' : 'none',
              }} 
              onError={(e) => {
                console.error('Logo failed to load:', systemConfig.logoUrl);
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : null}
          <span>{systemConfig?.siteName || '赏金平台'}</span>
        </div>
        
        <Space size="large">
          {allowThemeSwitch && (
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'light',
                    icon: <SunOutlined />,
                    label: '亮色',
                    onClick: () => setThemeMode('light'),
                  },
                  {
                    key: 'dark',
                    icon: <MoonOutlined />,
                    label: '暗色',
                    onClick: () => setThemeMode('dark'),
                  },
                  {
                    key: 'cyberpunk',
                    icon: <BgColorsOutlined />,
                    label: '赛博',
                    onClick: () => setThemeMode('cyberpunk'),
                  },
                ],
                selectedKeys: [themeMode],
              }}
              placement="bottomRight"
            >
              <Button
                type="text"
                icon={themeMode === 'light' ? <SunOutlined /> : themeMode === 'dark' ? <MoonOutlined /> : <BgColorsOutlined />}
                style={{ 
                  color: isCyberpunk ? '#00f2ff' : themeMode === 'dark' ? '#00d9ff' : '#1890ff',
                  border: isCyberpunk ? '1px solid rgba(0, 242, 255, 0.3)' : themeMode === 'dark' ? '1px solid rgba(0, 217, 255, 0.2)' : '1px solid rgba(24, 144, 255, 0.2)',
                  background: isCyberpunk ? 'rgba(0, 242, 255, 0.1)' : themeMode === 'dark' ? 'rgba(0, 217, 255, 0.08)' : 'rgba(24, 144, 255, 0.08)',
                  transition: 'all 0.3s ease',
                }}
                title="切换主题"
              />
            </Dropdown>
          )}
          
          <Badge count={unreadCount} offset={[-5, 5]}>
            <BellOutlined
              style={{ 
                color: isCyberpunk ? '#ff00e5' : themeMode === 'dark' ? '#ff006e' : '#ff4d4f', 
                fontSize: 18, 
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                filter: isCyberpunk ? 'drop-shadow(0 0 5px rgba(255, 0, 229, 0.5))' : 'none',
              }}
              onClick={() => {
                navigate('/notifications');
                setTimeout(refreshUnreadCount, 500);
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            />
          </Badge>
          
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar 
                src={avatarUrl} 
                icon={!avatarUrl ? <UserOutlined /> : undefined}
                style={{ 
                  border: isCyberpunk ? '2px solid #00f2ff' : themeMode === 'dark' ? '2px solid #00d9ff' : '2px solid #1890ff',
                  boxShadow: isCyberpunk ? '0 0 15px rgba(0, 242, 255, 0.4)' : themeMode === 'dark' ? '0 0 12px rgba(0, 217, 255, 0.3)' : '0 0 10px rgba(24, 144, 255, 0.2)',
                  transition: 'all 0.3s ease',
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
        className="fade-in"
      >
        <Outlet />
      </Content>

      {/* Bottom Navigation */}
      <div className="bottom-nav-bar">
        {(() => {
          console.log('🔍 Bottom nav rendering, currentTab:', currentTab, 'user permissions:', { 
            isSuperAdmin: isSuperAdmin(), 
            isPositionAdmin: isPositionAdmin(), 
            isDeveloper: isDeveloper() 
          });
          return null;
        })()}
        
        {/* 我的模块 - 所有用户都有 */}
        <Button
          type={currentTab === 'mine' ? 'primary' : 'text'}
          icon={<UserOutlined style={{ fontSize: 24 }} />}
          onClick={() => handleNavigation('/my')}
          title="我的"
        >
          {invitationCount > 0 && (
            <Badge count={invitationCount} style={{ position: 'absolute', top: -5, right: -5 }} />
          )}
        </Button>

        {/* 赏金任务模块 - 所有用户都有 */}
        <Button
          type={currentTab === 'tasks' ? 'primary' : 'text'}
          icon={<FileTextOutlined style={{ fontSize: 24 }} />}
          onClick={() => handleNavigation('/bounty-tasks')}
          title="赏金任务"
        />

        {/* 猎人排名模块 - 所有用户都有 */}
        <Button
          type={currentTab === 'ranking' ? 'primary' : 'text'}
          icon={<TrophyOutlined style={{ fontSize: 24 }} />}
          onClick={() => handleNavigation('/ranking')}
          title="猎人排名"
        />

        {/* 管理模块 - 管理员和开发者有 */}
        {(isSuperAdmin() || isPositionAdmin() || isDeveloper()) && (
          <Button
            type={currentTab === 'admin' ? 'primary' : 'text'}
            icon={<SettingOutlined style={{ fontSize: 24 }} />}
            onClick={() => handleNavigation('/admin')}
            title="管理"
          />
        )}

        {/* 开发模块 - 只有开发者有 */}
        {isDeveloper() && (
          <Button
            type={currentTab === 'dev' ? 'primary' : 'text'}
            icon={<BgColorsOutlined style={{ fontSize: 24 }} />}
            onClick={() => handleNavigation('/admin/system-config')}
            title="开发"
          />
        )}
      </div>

      <SystemConfigTest />
    </Layout>
  );
};
