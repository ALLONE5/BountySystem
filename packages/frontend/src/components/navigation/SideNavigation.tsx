import React, { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, Avatar, Badge, Tooltip } from 'antd';
import {
  HomeOutlined,
  FileTextOutlined,
  TrophyOutlined,
  SettingOutlined,
  BgColorsOutlined,
  UserOutlined,
  TeamOutlined,
  CheckSquareOutlined,
  PictureOutlined,
  TagsOutlined,
  CalculatorOutlined,
  BellOutlined,
  AuditOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../store/authStore';
import { usePermission } from '../../hooks/usePermission';
import { useNotificationContext } from '../../contexts/NotificationContext';
import { useSystemConfig } from '../../contexts/SystemConfigContext';
import './SideNavigation.css';

interface SideNavigationProps {
  collapsed: boolean;
  isMobile: boolean;
  horizontal?: boolean;
}

export const SideNavigation: React.FC<SideNavigationProps> = ({
  collapsed,
  isMobile,
  horizontal = false,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const { isSuperAdmin, isPositionAdmin, isDeveloper } = usePermission();
  const { unreadCount } = useNotificationContext();
  const { config: systemConfig } = useSystemConfig();

  // 获取当前选中的菜单项
  const selectedKey = useMemo(() => {
    const path = location.pathname;
    
    if (path.startsWith('/my') || path.startsWith('/dashboard')) return 'my';
    if (path.startsWith('/bounty-tasks')) return 'bounty-tasks';
    if (path.startsWith('/ranking')) return 'ranking';
    if (path.startsWith('/dev/')) return 'dev';
    if (path.startsWith('/admin') && !path.startsWith('/admin/system-config') && !path.startsWith('/admin/audit-logs')) return 'admin';
    
    return 'my';
  }, [location.pathname]);

  // 构建菜单项
  const menuItems = useMemo(() => {
    const items = [
      {
        key: 'my',
        icon: <HomeOutlined />,
        label: collapsed && !horizontal ? null : '我的',
        onClick: () => navigate('/my'),
      },
      {
        key: 'bounty-tasks',
        icon: (
          <Badge count={0} size="small" offset={[4, -4]}>
            <FileTextOutlined />
          </Badge>
        ),
        label: collapsed && !horizontal ? null : '赏金任务',
        onClick: () => navigate('/bounty-tasks'),
      },
      {
        key: 'ranking',
        icon: <TrophyOutlined />,
        label: collapsed && !horizontal ? null : '猎人排名',
        onClick: () => navigate('/ranking'),
      },
    ];

    // 管理员功能
    if (isSuperAdmin() || isPositionAdmin() || isDeveloper()) {
      items.push({
        key: 'admin',
        icon: <SettingOutlined />,
        label: collapsed && !horizontal ? null : '管理',
        onClick: () => navigate('/admin'),
      });
    }

    // 开发者功能
    if (isDeveloper()) {
      items.push({
        key: 'dev',
        icon: <BgColorsOutlined />,
        label: collapsed && !horizontal ? null : '开发',
        onClick: () => {
          // 如果当前不在开发页面，导航到系统配置页面
          if (!location.pathname.startsWith('/dev/')) {
            navigate('/dev/system-config');
          }
        },
      });
    }

    return items;
  }, [collapsed, horizontal, navigate, isSuperAdmin, isPositionAdmin, isDeveloper]);

  // 管理员子菜单项
  const adminSubItems = useMemo(() => {
    if (collapsed && !horizontal) return [];
    
    const items = [
      {
        key: 'admin-users',
        icon: <UserOutlined />,
        label: '用户管理',
        onClick: () => navigate('/admin/users'),
      },
      {
        key: 'admin-groups',
        icon: <TeamOutlined />,
        label: '组群管理',
        onClick: () => navigate('/admin/groups'),
      },
      {
        key: 'admin-tasks',
        icon: <FileTextOutlined />,
        label: '任务管理',
        onClick: () => navigate('/admin/tasks'),
      },
      {
        key: 'admin-approval',
        icon: <CheckSquareOutlined />,
        label: '申请审核',
        onClick: () => navigate('/admin/approval'),
      },
      {
        key: 'admin-avatars',
        icon: <PictureOutlined />,
        label: '头像管理',
        onClick: () => navigate('/admin/avatars'),
      },
    ];

    // 超级管理员功能
    if (isSuperAdmin()) {
      items.push(
        {
          key: 'admin-positions',
          icon: <TagsOutlined />,
          label: '职位管理',
          onClick: () => navigate('/admin/positions'),
        },
        {
          key: 'admin-bounty-algorithm',
          icon: <CalculatorOutlined />,
          label: '赏金算法',
          onClick: () => navigate('/admin/bounty-algorithm'),
        },
        {
          key: 'admin-notifications',
          icon: <BellOutlined />,
          label: '通知广播',
          onClick: () => navigate('/admin/notifications'),
        }
      );
    }

    return items;
  }, [collapsed, horizontal, navigate, isSuperAdmin]);

  // 开发者子菜单项
  const devSubItems = useMemo(() => {
    console.log('devSubItems creation:', {
      collapsed,
      horizontal,
      isDeveloper: isDeveloper(),
      user: user,
    });
    
    if (collapsed && !horizontal) {
      console.log('devSubItems: returning empty due to collapsed');
      return [];
    }
    
    // 临时：总是返回开发者菜单项用于调试
    const items = [
      {
        key: 'dev-system-config',
        icon: <SettingOutlined />,
        label: '系统配置',
        onClick: () => navigate('/dev/system-config'),
      },
      {
        key: 'dev-audit-logs',
        icon: <AuditOutlined />,
        label: '审计日志',
        onClick: () => navigate('/dev/audit-logs'),
      },
      {
        key: 'dev-system-monitor',
        icon: <BgColorsOutlined />,
        label: '系统监控',
        onClick: () => navigate('/dev/system-monitor'),
      },
    ];
    
    console.log('devSubItems created:', items);
    return items;
  }, [collapsed, horizontal, navigate, isDeveloper, user]);

  const navigationClass = `side-navigation ${
    collapsed ? 'collapsed' : ''
  } ${horizontal ? 'horizontal' : ''} ${isMobile ? 'mobile' : ''}`;

  if (horizontal) {
    // 移动端水平导航
    return (
      <div className={navigationClass}>
        <div className="nav-items-horizontal">
          {menuItems.map((item) => (
            <Tooltip key={item.key} title={item.label} placement="top">
              <div
                className={`nav-item-horizontal ${
                  selectedKey === item.key ? 'active' : ''
                }`}
                onClick={item.onClick}
              >
                {item.icon}
                {item.label && <span className="nav-label">{item.label}</span>}
              </div>
            </Tooltip>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={navigationClass}>
      {/* 用户信息区域 */}
      {!collapsed && (
        <div className="user-info-section">
          <div className="user-avatar-area">
            <Avatar
              size={40}
              icon={<UserOutlined />}
              className="user-avatar"
            />
            <div className="user-details">
              <div className="username">{user?.username || '用户'}</div>
              <div className="user-status">在线</div>
            </div>
          </div>
          {unreadCount > 0 && (
            <Badge count={unreadCount} className="notification-badge" />
          )}
        </div>
      )}

      {/* 主导航菜单 */}
      <div className="main-navigation">
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          className="nav-menu"
          inlineCollapsed={collapsed}
          items={menuItems.map((item) => ({
            key: item.key,
            icon: item.icon,
            label: item.label,
            onClick: item.onClick,
          }))}
        />
      </div>

      {/* 管理员子菜单 */}
      {selectedKey === 'admin' && !collapsed && adminSubItems.length > 0 && (
        <div className="sub-navigation">
          <div className="sub-nav-title">管理功能</div>
          <Menu
            mode="inline"
            className="sub-nav-menu"
            items={adminSubItems.map((item) => ({
              key: item.key,
              icon: item.icon,
              label: item.label,
              onClick: item.onClick,
            }))}
          />
        </div>
      )}

      {/* 开发者子菜单 - 强制显示测试 */}
      {true && (
        <div style={{ 
          backgroundColor: 'red', 
          color: 'white', 
          padding: '20px', 
          margin: '10px',
          border: '5px solid yellow',
          fontSize: '16px',
          fontWeight: 'bold'
        }}>
          <div>强制显示的开发者菜单</div>
          <button 
            onClick={() => {
              console.log('Button clicked!');
              alert('系统配置按钮被点击！');
              navigate('/dev/system-config');
            }}
            style={{
              backgroundColor: 'blue',
              color: 'white',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '5px',
              fontSize: '14px',
              cursor: 'pointer',
              marginTop: '10px'
            }}
          >
            系统配置 (强制按钮)
          </button>
        </div>
      )}

      {/* 底部信息 */}
      {!collapsed && systemConfig && (
        <div className="nav-footer">
          <div className="system-info">
            <div className="system-name">
              {systemConfig.siteName || '赏金平台'}
            </div>
            <div className="system-version">v2.0.0</div>
          </div>
        </div>
      )}
    </div>
  );
};