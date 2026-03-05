import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Layout, Menu, Avatar, Badge, Dropdown, Space, Button, Input } from 'antd';
import {
  HomeOutlined,
  UserOutlined,
  TeamOutlined,
  TrophyOutlined,
  BellOutlined,
  SettingOutlined,
  MenuOutlined,
  LogoutOutlined,
  ProfileOutlined,
  DashboardOutlined,
  FileTextOutlined,
  GiftOutlined,
  ControlOutlined,
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useSystemConfig } from '../contexts/SystemConfigContext';
import './DiscordLayout.css';

const { Header, Sider, Content } = Layout;
const { Search } = Input;

interface DiscordLayoutProps {
  showInfoPanel?: boolean;
}

export const DiscordLayout: React.FC<DiscordLayoutProps> = ({ 
  showInfoPanel = false 
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const { config: systemConfig } = useSystemConfig();
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
      key: 'tasks',
      icon: <FileTextOutlined />,
      label: '任务管理',
      children: [
        {
          key: '/tasks/published',
          label: '已发布任务',
          onClick: () => navigate('/tasks/published'),
        },
        {
          key: '/tasks/assigned',
          label: '指派任务',
          onClick: () => navigate('/tasks/assigned'),
        },
        {
          key: '/tasks/list',
          label: '任务列表',
          onClick: () => navigate('/tasks/list'),
        },
        {
          key: '/tasks/browse',
          label: '浏览任务',
          onClick: () => navigate('/tasks/browse'),
        },
        {
          key: '/tasks/invitations',
          label: '任务邀请',
          onClick: () => navigate('/tasks/invitations'),
        },
      ],
    },
    {
      key: 'task-views',
      icon: <DashboardOutlined />,
      label: '任务视图',
      children: [
        {
          key: '/tasks/calendar',
          label: '日历视图',
          onClick: () => navigate('/tasks/calendar'),
        },
        {
          key: '/tasks/kanban',
          label: '看板视图',
          onClick: () => navigate('/tasks/kanban'),
        },
        {
          key: '/tasks/gantt',
          label: '甘特图',
          onClick: () => navigate('/tasks/gantt'),
        },
        {
          key: '/tasks/visualization',
          label: '可视化',
          onClick: () => navigate('/tasks/visualization'),
        },
      ],
    },
    {
      key: '/groups',
      icon: <TeamOutlined />,
      label: '项目组',
      onClick: () => navigate('/groups'),
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
          label: 'Discord 风格',
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
    if (path.startsWith('/tasks/')) return [path];
    return [path];
  };

  // 获取展开的菜单项
  const getOpenKeys = () => {
    const path = location.pathname;
    const openKeys = [];
    if (path.startsWith('/admin/')) openKeys.push('admin');
    if (path.startsWith('/tasks/')) {
      openKeys.push('tasks');
      if (path.includes('/calendar') || path.includes('/kanban') || path.includes('/gantt') || path.includes('/visualization')) {
        openKeys.push('task-views');
      }
    }
    if (path.includes('/ranking')) openKeys.push('ranking');
    return openKeys;
  };

  return (
    <Layout className={`discord-layout theme-${theme.mode}`}>
      {/* 顶部导航栏 - Discord 风格 */}
      <Header className="discord-header">
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
                style={{ height: '24px', width: 'auto' }}
                onError={(e) => {
                  console.error('Logo failed to load:', systemConfig.logoUrl);
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <span className="logo-icon">OCT</span>
            )}
            {!collapsed && <span className="logo-text">{systemConfig?.siteName || '赏金平台'}</span>}
          </div>
        </div>

        <div className="header-center">
          <Search
            placeholder="搜索任务、用户、组群..."
            allowClear
            style={{ width: 400, maxWidth: '100%' }}
            size="middle"
          />
        </div>

        <div className="header-right">
          <Space size="middle">
            <Badge count={5} size="small">
              <Button
                type="text"
                icon={<BellOutlined />}
                onClick={() => navigate('/notifications')}
                className="notification-btn"
              />
            </Badge>
            
            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              trigger={['click']}
            >
              <div className="user-profile">
                <Avatar
                  size="small"
                  src={user?.avatarUrl}
                  icon={<UserOutlined />}
                />
                {!isMobile && (
                  <span className="username">{user?.username}</span>
                )}
              </div>
            </Dropdown>
          </Space>
        </div>
      </Header>

      <Layout className="discord-body">
        {/* 左侧导航栏 - Discord 风格 */}
        <Sider
          className="discord-sidebar"
          collapsed={collapsed}
          collapsedWidth={isMobile ? 0 : 80}
          width={280}
          theme="dark"
        >
          <div className="sidebar-content">
            <Menu
              mode="inline"
              selectedKeys={getSelectedKeys()}
              openKeys={openKeys}
              onOpenChange={setOpenKeys}
              items={[...mainMenuItems, ...adminMenuItems]}
              className="discord-menu"
            />
          </div>
        </Sider>

        {/* 主内容区域 */}
        <Content className="discord-content">
          <div className="content-wrapper">
            <Outlet />
          </div>
        </Content>

        {/* 右侧信息面板 - 可选 */}
        {showInfoPanel && !isMobile && (
          <Sider
            className="discord-info-panel"
            width={300}
            theme="dark"
          >
            <div className="info-panel-content">
              <div className="panel-section">
                <h4>在线用户</h4>
                <div className="online-users">
                  <div className="user-item">
                    <Avatar size="small" icon={<UserOutlined />} />
                    <span>用户1</span>
                    <div className="status-indicator online"></div>
                  </div>
                  <div className="user-item">
                    <Avatar size="small" icon={<UserOutlined />} />
                    <span>用户2</span>
                    <div className="status-indicator away"></div>
                  </div>
                </div>
              </div>

              <div className="panel-section">
                <h4>最新动态</h4>
                <div className="activity-feed">
                  <div className="activity-item">
                    <span className="activity-text">用户A 完成了任务</span>
                    <span className="activity-time">2分钟前</span>
                  </div>
                  <div className="activity-item">
                    <span className="activity-text">新任务已发布</span>
                    <span className="activity-time">5分钟前</span>
                  </div>
                </div>
              </div>

              <div className="panel-section">
                <h4>快速操作</h4>
                <div className="quick-actions">
                  <Button type="primary" block>
                    发布新任务
                  </Button>
                  <Button block style={{ marginTop: 8 }}>
                    创建项目组
                  </Button>
                </div>
              </div>
            </div>
          </Sider>
        )}
      </Layout>

      {/* 移动端底部导航 */}
      {isMobile && (
        <div className="discord-mobile-nav">
          <div className="mobile-nav-item" onClick={() => navigate('/dashboard')}>
            <HomeOutlined />
            <span>首页</span>
          </div>
          <div className="mobile-nav-item" onClick={() => navigate('/my')}>
            <UserOutlined />
            <span>我的</span>
          </div>
          <div className="mobile-nav-item" onClick={() => navigate('/tasks/browse')}>
            <FileTextOutlined />
            <span>任务</span>
          </div>
          <div className="mobile-nav-item" onClick={() => navigate('/groups')}>
            <TeamOutlined />
            <span>组群</span>
          </div>
          <div className="mobile-nav-item" onClick={() => navigate('/ranking')}>
            <TrophyOutlined />
            <span>排名</span>
          </div>
        </div>
      )}
    </Layout>
  );
};