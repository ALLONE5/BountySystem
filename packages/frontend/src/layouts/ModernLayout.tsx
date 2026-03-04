import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Layout, Menu, Avatar, Badge, Dropdown, Space, Button, Input, Tooltip, Switch } from 'antd';
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
  SearchOutlined,
  SunOutlined,
  MoonOutlined,
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import '../styles/glassmorphism.css';
import './ModernLayout.css';

const { Header, Sider, Content } = Layout;
const { Search } = Input;

interface ModernLayoutProps {
  showInfoPanel?: boolean;
}

export const ModernLayout: React.FC<ModernLayoutProps> = ({ 
  showInfoPanel = false 
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, themeMode, toggleTheme } = useTheme();
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

  // 主导航菜单项
  const mainMenuItems = [
    {
      key: '/dashboard',
      icon: <HomeOutlined />,
      label: '首页',
      onClick: () => navigate('/dashboard'),
    },
    {
      key: '/my',
      icon: <UserOutlined />,
      label: '我的工作台',
      onClick: () => navigate('/my'),
    },
    {
      key: '/bounty-tasks',
      icon: <GiftOutlined />,
      label: '赏金任务',
      onClick: () => navigate('/bounty-tasks'),
    },
    {
      key: 'ranking',
      icon: <TrophyOutlined />,
      label: '排行榜',
      children: [
        {
          key: '/ranking',
          label: '排行榜',
          onClick: () => navigate('/ranking'),
        },
        {
          key: '/ranking/original',
          label: '原版风格',
          onClick: () => navigate('/ranking/original'),
        },
      ],
    },
  ];

  // 管理员菜单项
  const adminMenuItems = user?.role === 'super_admin' ? [
    {
      key: 'admin',
      icon: <ControlOutlined />,
      label: '管理中心',
      children: [
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
          key: '/admin/avatars',
          label: '头像管理',
          onClick: () => navigate('/admin/avatars'),
        },
        {
          key: '/admin/positions',
          label: '职位管理',
          onClick: () => navigate('/admin/positions'),
        },
        {
          key: '/admin/bounty-algorithm',
          label: '赏金算法',
          onClick: () => navigate('/admin/bounty-algorithm'),
        },
        {
          key: '/admin/notifications',
          label: '通知广播',
          onClick: () => navigate('/admin/notifications'),
        },
        {
          key: '/admin/system-config',
          label: '系统配置',
          onClick: () => navigate('/admin/system-config'),
        },
        {
          key: '/admin/audit-logs',
          label: '审计日志',
          onClick: () => navigate('/admin/audit-logs'),
        },
      ],
    },
  ] : [];

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
    if (path.includes('/ranking')) openKeys.push('ranking');
    return openKeys;
  };

  return (
    <Layout className={`modern-layout theme-${themeMode}`}>
      {/* 顶部导航栏 - Discord 风格 */}
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
              <div className="logo-icon">🎯</div>
              <div className="logo-text">赏金猎人</div>
            </div>
          </div>

          <div className="header-center">
            {!isMobile && (
              <div className="search-container">
                <SearchOutlined className="search-icon" />
                <Input
                  placeholder="搜索任务、用户、组群..."
                  className="search-input"
                  allowClear
                />
              </div>
            )}
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
                <Badge count={5} size="small" offset={[-2, 2]}>
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
                overlayClassName="user-dropdown"
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
        {/* 左侧导航栏 - Discord 风格 */}
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
              items={[...mainMenuItems, ...adminMenuItems]}
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