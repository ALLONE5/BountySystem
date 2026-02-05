import React, { useEffect, useMemo, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown, Space, Badge } from 'antd';
import { avatarApi } from '../api/avatar';
import { taskApi } from '../api/task';
import {
  DashboardOutlined,
  FileTextOutlined,
  CheckSquareOutlined,
  TrophyOutlined,
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../store/authStore';
import { usePermission } from '../hooks/usePermission';
import { useNotificationContext } from '../contexts/NotificationContext';
import { UserRole } from '../types';
import { colors, spacing, shadows } from '../styles/design-tokens';

const { Header, Sider, Content } = Layout;

export const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, clearAuth } = useAuthStore();
  const { canAccessAdminPanel, isSuperAdmin, isPositionAdmin } = usePermission();
  const { unreadCount, refreshUnreadCount } = useNotificationContext();

  const [openKeys, setOpenKeys] = useState<string[]>([]);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [invitationCount, setInvitationCount] = useState(0);

  const selectedKeys = useMemo(() => {
    const path = location.pathname;
    if (path.startsWith('/dashboard')) return ['dashboard'];
    if (path.startsWith('/tasks/published')) return ['published-tasks'];
    if (path.startsWith('/tasks/assigned')) return ['assigned-tasks'];
    if (path.startsWith('/groups')) return ['groups'];
    if (path.startsWith('/tasks/browse')) return ['bounty-tasks'];
    if (path.startsWith('/ranking')) return ['ranking'];
    if (path.startsWith('/admin/users')) return ['user-management'];
    if (path.startsWith('/admin/groups')) return ['group-management'];
    if (path.startsWith('/admin/tasks')) return ['task-management'];
    if (path.startsWith('/admin/approval')) return ['approval'];
    if (path.startsWith('/admin/avatars')) return ['avatar-management'];
    if (path.startsWith('/admin/positions')) return ['position-management'];
    if (path.startsWith('/admin/bounty-algorithm')) return ['bounty-algorithm'];
    return ['dashboard'];
  }, [location.pathname]);

  useEffect(() => {
    if (location.pathname.startsWith('/admin')) {
      setOpenKeys((prev) => (prev.includes('admin') ? prev : [...prev, 'admin']));
    } else {
      setOpenKeys((prev) => prev.filter((key) => key !== 'admin'));
    }
  }, [location.pathname]);

  useEffect(() => {
    const loadAvatar = async () => {
      try {
        const avatar = await avatarApi.getUserAvatar();
        setAvatarUrl(avatar?.imageUrl);
      } catch (error) {
        console.error('Failed to load user avatar:', error);
        setAvatarUrl(undefined);
      }
    };
    loadAvatar();
  }, [user?.id]);

  useEffect(() => {
    const handler = () => {
      avatarApi
        .getUserAvatar()
        .then((avatar: any) => setAvatarUrl(avatar?.imageUrl))
        .catch((error: any) => {
          console.error('Failed to refresh user avatar:', error);
          setAvatarUrl(undefined);
        });
    };
    window.addEventListener('avatar-updated', handler);
    return () => window.removeEventListener('avatar-updated', handler);
  }, []);

  // Load invitation count
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
    
    // Listen for invitation updates
    const handleInvitationUpdate = () => {
      loadInvitationCount();
    };
    window.addEventListener('invitation-updated', handleInvitationUpdate);
    
    // Refresh invitation count every 30 seconds
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

  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: '个人界面',
      onClick: () => navigate('/dashboard'),
    },
    {
      key: 'published-tasks',
      icon: <FileTextOutlined />,
      label: '我的悬赏',
      onClick: () => navigate('/tasks/published'),
    },
    {
      key: 'assigned-tasks',
      icon: <CheckSquareOutlined />,
      label: (
        <Space>
          我的任务
          {invitationCount > 0 && (
            <Badge count={invitationCount} size="small" />
          )}
        </Space>
      ),
      onClick: () => navigate('/tasks/assigned'),
    },
    {
      key: 'groups',
      icon: <TeamOutlined />,
      label: '我的组群',
      onClick: () => navigate('/groups'),
    },
    {
      key: 'bounty-tasks',
      icon: <TrophyOutlined />,
      label: '赏金任务',
      onClick: () => navigate('/tasks/browse'),
    },
    {
      key: 'ranking',
      icon: <TrophyOutlined />,
      label: '排名',
      onClick: () => navigate('/ranking'),
    },
  ];

  const adminChildren: Array<
    {
      key: string;
      label: string;
      onClick: () => void;
      roles?: UserRole[];
    }
  > = [
    {
      key: 'user-management',
      label: '用户管理',
      onClick: () => navigate('/admin/users'),
      roles: [UserRole.SUPER_ADMIN, UserRole.POSITION_ADMIN],
    },
    {
      key: 'group-management',
      label: '组群管理',
      onClick: () => navigate('/admin/groups'),
      roles: [UserRole.SUPER_ADMIN],
    },
    {
      key: 'task-management',
      label: '任务管理',
      onClick: () => navigate('/admin/tasks'),
      roles: [UserRole.SUPER_ADMIN, UserRole.POSITION_ADMIN],
    },
    {
      key: 'approval',
      label: '审核操作',
      onClick: () => navigate('/admin/approval'),
      roles: [UserRole.SUPER_ADMIN, UserRole.POSITION_ADMIN],
    },
    {
      key: 'avatar-management',
      label: '头像管理',
      onClick: () => navigate('/admin/avatars'),
      roles: [UserRole.SUPER_ADMIN],
    },
    {
      key: 'position-management',
      label: '岗位管理',
      onClick: () => navigate('/admin/positions'),
      roles: [UserRole.SUPER_ADMIN],
    },
    {
      key: 'bounty-algorithm',
      label: '赏金算法',
      onClick: () => navigate('/admin/bounty-algorithm'),
      roles: [UserRole.SUPER_ADMIN],
    },
  ];

  const adminMenuItems = canAccessAdminPanel()
    ? [
        {
          type: 'divider' as const,
        },
        {
          key: 'admin',
          label: '管理功能',
          children: adminChildren.filter((item) => {
            if (!item.roles || item.roles.length === 0) return true;
            if (isSuperAdmin()) return true;
            if (isPositionAdmin()) return item.roles.includes(UserRole.POSITION_ADMIN);
            return false;
          }),
        },
      ]
    : [];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: colors.primary,
          padding: `0 ${spacing.lg}px`,
          boxShadow: shadows.sm,
          position: 'sticky',
          top: 0,
          zIndex: 1000,
        }}
      >
        <div style={{ 
          color: colors.text.inverse, 
          fontSize: 20, 
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: spacing.sm,
        }}>
          <TrophyOutlined style={{ fontSize: 24 }} />
          赏金猎人平台
        </div>
        <Space size="large">
          <Badge count={unreadCount} offset={[-5, 5]}>
            <BellOutlined
              style={{ 
                color: colors.text.inverse, 
                fontSize: 20, 
                cursor: 'pointer',
                transition: 'transform 0.2s',
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
                style={{ border: `2px solid ${colors.text.inverse}` }}
              />
              <span style={{ color: colors.text.inverse, fontWeight: 500 }}>
                {user?.username}
              </span>
            </Space>
          </Dropdown>
        </Space>
      </Header>
      <Layout>
        <Sider 
          width={220} 
          style={{ 
            background: colors.background.base,
            boxShadow: shadows.sm,
          }}
        >
          <Menu
            mode="inline"
            selectedKeys={selectedKeys}
            openKeys={openKeys}
            onOpenChange={setOpenKeys}
            style={{ 
              height: '100%', 
              borderRight: 0,
              paddingTop: spacing.sm,
            }}
            items={[...menuItems, ...adminMenuItems]}
          />
        </Sider>
        <Layout style={{ padding: spacing.lg, background: colors.background.light }}>
          <Content
            style={{
              background: colors.background.base,
              padding: spacing.lg,
              borderRadius: 8,
              boxShadow: shadows.sm,
              minHeight: 280,
            }}
            className="fade-in"
          >
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};
