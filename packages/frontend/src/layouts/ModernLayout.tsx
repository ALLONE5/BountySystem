import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Layout, Menu, Avatar, Badge, Dropdown, Space, Button, Tooltip } from 'antd';
import {
  HomeOutlined,
  UserOutlined,
  TrophyOutlined,
  BellOutlined,
  SettingOutlined,
  MenuOutlined,
  LogoutOutlined,
  ProfileOutlined,
  GiftOutlined,
  ControlOutlined,
  SunOutlined,
  MoonOutlined,
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useSystemConfig } from '../contexts/SystemConfigContext';
import { useNotificationContext } from '../contexts/NotificationContext';
import '../styles/glassmorphism.css';
import './ModernLayout.css';

const { Header, Sider, Content } = Layout;

interface ModernLayoutProps {
  // Layout component uses Outlet for children
}

export const ModernLayout: React.FC<ModernLayoutProps> = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { themeMode, toggleTheme } = useTheme();
  const { config: systemConfig } = useSystemConfig();
  const { unreadCount } = useNotificationContext();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [openKeys, setOpenKeys] = useState<string[]>([]);

  // 响应式检测
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setCollapsed(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 初始化展开的菜单项
  useEffect(() => {
    setOpenKeys(getOpenKeys());
  }, [location.pathname]);

  // 主导航菜单项 - 根据用户角色动态显示
  const getMainMenuItems = () => {
    const baseItems = [
      {
        key: '/dashboard',
        icon: <HomeOutlined />,
        label: '首页',
        onClick: () => navigate('/dashboard'),
      },
      {
        key: 'workspace',
        icon: <UserOutlined />,
        label: '我的工作台',
        children: [
          {
            key: '/my/bounties',
            label: '我的悬赏',
            onClick: () => navigate('/my/bounties'),
          },
          {
            key: '/my/tasks',
            label: '我的任务',
            onClick: () => navigate('/my/tasks'),
          },
          {
            key: '/my/groups',
            label: '我的组群',
            onClick: () => navigate('/my/groups'),
          },
        ],
      },
      {
        key: '/bounty-tasks',
        icon: <GiftOutlined />,
        label: '任务市场',
        onClick: () => navigate('/bounty-tasks'),
      },
      {
        key: '/ranking',
        icon: <TrophyOutlined />,
        label: '赏金排行',
        onClick: () => navigate('/ranking'),
      },
    ];

    return baseItems;
  };

  // 管理员菜单项
  const getAdminMenuItems = () => {
    if (user?.role !== 'super_admin' && user?.role !== 'position_admin') return [];
    
    return [
      {
        key: 'admin',
        icon: <ControlOutlined />,
        label: '管理中心',
        children: [
          {
            key: '/admin/dashboard',
            label: '监控仪表盘',
            onClick: () => navigate('/admin/dashboard'),
          },
          {
            key: '/admin/users',
            label: '用户管理',
            onClick: () => navigate('/admin/users'),
          },
          {
            key: '/admin/groups',
            label: '组群管理',
            onClick: () => navigate('/admin/groups'),
          },
          {
            key: '/admin/tasks',
            label: '任务管理',
            onClick: () => navigate('/admin/tasks'),
          },
          {
            key: '/admin/approval',
            label: '申请审核',
            onClick: () => navigate('/admin/approval'),
          },
          {
            key: '/admin/bounty-algorithm',
            label: '赏金算法',
            onClick: () => navigate('/admin/bounty-algorithm'),
          },
        ],
      },
    ];
  };

  // 开发者菜单项
  const getDeveloperMenuItems = () => {
    if (user?.role !== 'developer') return [];
    
    return [
      {
        key: 'developer',
        icon: <SettingOutlined />,
        label: '开发管理',
        children: [
          {
            key: '/dev/system-config',
            label: '系统配置',
            onClick: () => navigate('/dev/system-config'),
          },
          {
            key: '/dev/audit-logs',
            label: '审计日志',
            onClick: () => navigate('/dev/audit-logs'),
          },
          {
            key: '/dev/system-monitor',
            label: '系统监控',
            onClick: () => navigate('/dev/system-monitor'),
          },
        ],
      },
    ];
  };

  // 用户菜单
  const userMenuItems = [
    {
      key: 'profile',
      icon: <ProfileOutlined />,
      label: '个人资料',
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
      onClick: logout,
    },
  ];

  // 获取当前选中的菜单项
  const getSelectedKeys = () => {
    const path = location.pathname;
    if (path.startsWith('/admin/')) return [path];
    return [path];
  };

  // 获取展开的菜单项
  const getOpenKeys = () => {
    const path = location.pathname;
    const openKeys = [];
    if (path.startsWith('/admin/')) openKeys.push('admin');
    if (path.startsWith('/dev/')) openKeys.push('developer');
    if (path.startsWith('/my/')) openKeys.push('workspace');
    return openKeys;
  };

  return (
    <Layout className={`modern-layout theme-${themeMode}`}>
      {/* 顶部导航栏 - Modern 风格 */}
      <Header className="modern-header">
        <div className="header-content">
          <div className="header-left">
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              className="sidebar-toggle"
            />
            <div className="app-logo">
              {systemConfig?.logoUrl ? (
                <img 
                  src={systemConfig.logoUrl.startsWith('http') 
                    ? systemConfig.logoUrl 
                    : `http://localhost:3000${systemConfig.logoUrl}`
                  } 
                  alt="Logo" 
                  className="logo-image"
                  style={{ height: '32px', width: 'auto' }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="logo-icon">OCT</div>
              )}
              <div className="logo-text">{systemConfig?.siteName || '赏金平台'}</div>
            </div>
          </div>

          <div className="header-center">
            {/* 搜索框已移除 */}
          </div>

          <div className="header-right">
            <Space size="large">
              {/* 主题切换按钮 */}
              <Tooltip title={themeMode === 'light' ? '切换到暗色模式' : '切换到亮色模式'}>
                <Button
                  type="text"
                  icon={themeMode === 'light' ? <MoonOutlined /> : <SunOutlined />}
                  onClick={toggleTheme}
                  className="theme-toggle-btn"
                />
              </Tooltip>

              <Tooltip title="通知">
                <Badge count={unreadCount} size="small" offset={[-2, 2]}>
                  <Button
                    type="text"
                    icon={<BellOutlined />}
                    onClick={() => navigate('/notifications')}
                    className="header-action-btn"
                  />
                </Badge>
              </Tooltip>
              
              <Dropdown
                menu={{ items: userMenuItems }}
                placement="bottomRight"
                trigger={['click']}
              >
                <div className="user-profile">
                  <Avatar
                    size={32}
                    src={user?.avatarUrl}
                    icon={<UserOutlined />}
                    className="user-avatar"
                  />
                  {!isMobile && (
                    <div className="user-info">
                      <div className="username">{user?.username}</div>
                      <div className="user-status">在线</div>
                    </div>
                  )}
                </div>
              </Dropdown>
            </Space>
          </div>
        </div>
      </Header>

      <Layout className="modern-layout-body">
        {/* 左侧导航栏 - Modern 风格 */}
        <Sider
          className="modern-sidebar"
          collapsed={collapsed}
          collapsedWidth={isMobile ? 0 : 72}
          width={240}
          theme="dark"
        >
          <div className="sidebar-content">
            <Menu
              mode="inline"
              selectedKeys={getSelectedKeys()}
              openKeys={openKeys}
              onOpenChange={setOpenKeys}
              items={[...getMainMenuItems(), ...getAdminMenuItems(), ...getDeveloperMenuItems()]}
              className="modern-menu"
            />
          </div>
        </Sider>

        {/* 主内容区域 */}
        <Content className="modern-content">
          <div className="content-container">
            <Outlet />
          </div>
        </Content>
      </Layout>

      {/* 移动端底部导航 */}
      {isMobile && (
        <div className="mobile-bottom-nav">
          <div 
            className={`bottom-nav-item ${location.pathname === '/dashboard' ? 'active' : ''}`}
            onClick={() => navigate('/dashboard')}
          >
            <HomeOutlined />
            <span>首页</span>
          </div>
          <div 
            className={`bottom-nav-item ${location.pathname === '/my' ? 'active' : ''}`}
            onClick={() => navigate('/my')}
          >
            <UserOutlined />
            <span>工作台</span>
          </div>
          <div 
            className={`bottom-nav-item ${location.pathname === '/bounty-tasks' ? 'active' : ''}`}
            onClick={() => navigate('/bounty-tasks')}
          >
            <GiftOutlined />
            <span>赏金</span>
          </div>
          <div 
            className={`bottom-nav-item ${location.pathname === '/ranking' ? 'active' : ''}`}
            onClick={() => navigate('/ranking')}
          >
            <TrophyOutlined />
            <span>排行</span>
          </div>
        </div>
      )}
    </Layout>
  );
};