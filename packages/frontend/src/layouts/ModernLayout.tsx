import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Layout, Avatar, Dropdown, Button, Tooltip, Input } from 'antd';
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

const { Sider } = Layout;

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
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

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

  // 初始化展开的菜单
  useEffect(() => {
    const path = location.pathname;
    const newExpanded = [];
    if (path.startsWith('/admin/')) newExpanded.push('admin');
    if (path.startsWith('/dev/')) newExpanded.push('developer');
    if (path.startsWith('/my/')) newExpanded.push('workspace');
    setExpandedMenus(newExpanded);
  }, [location.pathname]);

  // 切换菜单展开状态
  const toggleMenuExpansion = (key: string) => {
    if (collapsed) return; // 折叠状态下不允许展开子菜单
    
    setExpandedMenus(prev => 
      prev.includes(key) 
        ? prev.filter(k => k !== key)
        : [...prev, key]
    );
  };

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

  return (
    <div className="modern-layout" data-theme={themeMode}>
      <Layout className="modern-layout">
        {/* 左侧导航栏 - Modern 风格 */}
        <Sider
          className="modern-sidebar"
          collapsed={collapsed}
          collapsedWidth={isMobile ? 0 : 64}
          width={240}
          theme="light"
        >
          {/* Logo Section */}
          <div className="sidebar-logo">
            <div className="logo-container" onClick={() => navigate('/dashboard')}>
              <div className="logo-icon">
                {systemConfig?.logoUrl ? (
                  <img
                    src={systemConfig.logoUrl.startsWith('http')
                      ? systemConfig.logoUrl
                      : `http://localhost:3000${systemConfig.logoUrl}`
                    }
                    alt="Logo"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  'BH'
                )}
              </div>
              {!collapsed && (
                <div className="logo-text">{systemConfig?.siteName || '赏金平台'}</div>
              )}
            </div>
          </div>

          {/* Navigation Menu */}
          <div className="sidebar-menu">
            <div className="menu-section">
              <div className="menu-section-title">主要功能</div>
              {getMainMenuItems().map((item) => (
                <div key={item.key}>
                  {item.children ? (
                    <div className="menu-group">
                      {collapsed ? (
                        <div 
                          className="custom-dropdown-trigger"
                          onMouseEnter={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const dropdown = document.createElement('div');
                            dropdown.className = 'custom-dropdown-menu workspace-dropdown';
                            dropdown.innerHTML = `
                              <div class="custom-dropdown-item" onclick="window.location.href='/my/bounties'">我的悬赏</div>
                              <div class="custom-dropdown-item" onclick="window.location.href='/my/tasks'">我的任务</div>
                              <div class="custom-dropdown-item" onclick="window.location.href='/my/groups'">我的组群</div>
                            `;
                            dropdown.style.position = 'fixed';
                            dropdown.style.left = `${rect.right + 8}px`;
                            dropdown.style.top = `${rect.top + rect.height / 2}px`;
                            dropdown.style.transform = 'translateY(-50%)';
                            dropdown.style.zIndex = '1070';
                            document.body.appendChild(dropdown);
                            
                            let isHoveringTrigger = true;
                            let isHoveringDropdown = false;
                            
                            const removeDropdown = () => {
                              setTimeout(() => {
                                if (!isHoveringTrigger && !isHoveringDropdown && dropdown.parentNode) {
                                  dropdown.parentNode.removeChild(dropdown);
                                }
                              }, 100);
                            };
                            
                            e.currentTarget.onmouseleave = () => {
                              isHoveringTrigger = false;
                              removeDropdown();
                            };
                            
                            dropdown.onmouseenter = () => {
                              isHoveringDropdown = true;
                            };
                            
                            dropdown.onmouseleave = () => {
                              isHoveringDropdown = false;
                              removeDropdown();
                            };
                          }}
                        >
                          <div className={`menu-item menu-item-expandable ${expandedMenus.includes('workspace') ? 'expanded' : ''}`}>
                            <div className="menu-item-icon">{item.icon}</div>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div 
                            className={`menu-item menu-item-expandable ${expandedMenus.includes('workspace') ? 'expanded' : ''}`}
                            onClick={() => toggleMenuExpansion('workspace')}
                          >
                            <div className="menu-item-icon">{item.icon}</div>
                            <div className="menu-item-text">{item.label}</div>
                            <div className="menu-item-arrow">
                              {expandedMenus.includes('workspace') ? '▼' : '▶'}
                            </div>
                          </div>
                          {expandedMenus.includes('workspace') && item.children.map((child) => (
                            <div
                              key={child.key}
                              className={`menu-item menu-item-child ${location.pathname === child.key ? 'active' : ''}`}
                              onClick={child.onClick}
                            >
                              <div className="menu-item-text">{child.label}</div>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  ) : (
                    <div
                      className={`menu-item ${location.pathname === item.key ? 'active' : ''}`}
                      onClick={item.onClick}
                    >
                      <div className="menu-item-icon">{item.icon}</div>
                      {!collapsed && <div className="menu-item-text">{item.label}</div>}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {getAdminMenuItems().length > 0 && (
              <div className="menu-section">
                <div className="menu-section-title">管理功能</div>
                {getAdminMenuItems().map((item) => (
                  <div key={item.key}>
                    <div className="menu-group">
                      {collapsed ? (
                        <div 
                          className="custom-dropdown-trigger"
                          onMouseEnter={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const dropdown = document.createElement('div');
                            dropdown.className = 'custom-dropdown-menu admin-dropdown';
                            dropdown.innerHTML = `
                              <div class="custom-dropdown-item" onclick="window.location.href='/admin/dashboard'">监控仪表盘</div>
                              <div class="custom-dropdown-item" onclick="window.location.href='/admin/users'">用户管理</div>
                              <div class="custom-dropdown-item" onclick="window.location.href='/admin/groups'">组群管理</div>
                              <div class="custom-dropdown-item" onclick="window.location.href='/admin/tasks'">任务管理</div>
                              <div class="custom-dropdown-item" onclick="window.location.href='/admin/approval'">申请审核</div>
                              <div class="custom-dropdown-item" onclick="window.location.href='/admin/bounty-algorithm'">赏金算法</div>
                            `;
                            dropdown.style.position = 'fixed';
                            dropdown.style.left = `${rect.right + 8}px`;
                            dropdown.style.top = `${rect.top + rect.height / 2}px`;
                            dropdown.style.transform = 'translateY(-50%)';
                            dropdown.style.zIndex = '1070';
                            document.body.appendChild(dropdown);
                            
                            let isHoveringTrigger = true;
                            let isHoveringDropdown = false;
                            
                            const removeDropdown = () => {
                              setTimeout(() => {
                                if (!isHoveringTrigger && !isHoveringDropdown && dropdown.parentNode) {
                                  dropdown.parentNode.removeChild(dropdown);
                                }
                              }, 100);
                            };
                            
                            e.currentTarget.onmouseleave = () => {
                              isHoveringTrigger = false;
                              removeDropdown();
                            };
                            
                            dropdown.onmouseenter = () => {
                              isHoveringDropdown = true;
                            };
                            
                            dropdown.onmouseleave = () => {
                              isHoveringDropdown = false;
                              removeDropdown();
                            };
                          }}
                        >
                          <div className={`menu-item menu-item-expandable ${expandedMenus.includes('admin') ? 'expanded' : ''}`}>
                            <div className="menu-item-icon">{item.icon}</div>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div 
                            className={`menu-item menu-item-expandable ${expandedMenus.includes('admin') ? 'expanded' : ''}`}
                            onClick={() => toggleMenuExpansion('admin')}
                          >
                            <div className="menu-item-icon">{item.icon}</div>
                            <div className="menu-item-text">{item.label}</div>
                            <div className="menu-item-arrow">
                              {expandedMenus.includes('admin') ? '▼' : '▶'}
                            </div>
                          </div>
                          {expandedMenus.includes('admin') && item.children?.map((child) => (
                            <div
                              key={child.key}
                              className={`menu-item menu-item-child ${location.pathname === child.key ? 'active' : ''}`}
                              onClick={child.onClick}
                            >
                              <div className="menu-item-text">{child.label}</div>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {getDeveloperMenuItems().length > 0 && (
              <div className="menu-section">
                <div className="menu-section-title">开发工具</div>
                {getDeveloperMenuItems().map((item) => (
                  <div key={item.key}>
                    <div className="menu-group">
                      {collapsed ? (
                        <div 
                          className="custom-dropdown-trigger"
                          onMouseEnter={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const dropdown = document.createElement('div');
                            dropdown.className = 'custom-dropdown-menu developer-dropdown';
                            dropdown.innerHTML = `
                              <div class="custom-dropdown-item" onclick="window.location.href='/dev/system-config'">系统配置</div>
                              <div class="custom-dropdown-item" onclick="window.location.href='/dev/audit-logs'">审计日志</div>
                              <div class="custom-dropdown-item" onclick="window.location.href='/dev/system-monitor'">系统监控</div>
                            `;
                            dropdown.style.position = 'fixed';
                            dropdown.style.left = `${rect.right + 8}px`;
                            dropdown.style.top = `${rect.top + rect.height / 2}px`;
                            dropdown.style.transform = 'translateY(-50%)';
                            dropdown.style.zIndex = '1070';
                            document.body.appendChild(dropdown);
                            
                            let isHoveringTrigger = true;
                            let isHoveringDropdown = false;
                            
                            const removeDropdown = () => {
                              setTimeout(() => {
                                if (!isHoveringTrigger && !isHoveringDropdown && dropdown.parentNode) {
                                  dropdown.parentNode.removeChild(dropdown);
                                }
                              }, 100);
                            };
                            
                            e.currentTarget.onmouseleave = () => {
                              isHoveringTrigger = false;
                              removeDropdown();
                            };
                            
                            dropdown.onmouseenter = () => {
                              isHoveringDropdown = true;
                            };
                            
                            dropdown.onmouseleave = () => {
                              isHoveringDropdown = false;
                              removeDropdown();
                            };
                          }}
                        >
                          <div className={`menu-item menu-item-expandable ${expandedMenus.includes('developer') ? 'expanded' : ''}`}>
                            <div className="menu-item-icon">{item.icon}</div>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div 
                            className={`menu-item menu-item-expandable ${expandedMenus.includes('developer') ? 'expanded' : ''}`}
                            onClick={() => toggleMenuExpansion('developer')}
                          >
                            <div className="menu-item-icon">{item.icon}</div>
                            <div className="menu-item-text">{item.label}</div>
                            <div className="menu-item-arrow">
                              {expandedMenus.includes('developer') ? '▼' : '▶'}
                            </div>
                          </div>
                          {expandedMenus.includes('developer') && item.children?.map((child) => (
                            <div
                              key={child.key}
                              className={`menu-item menu-item-child ${location.pathname === child.key ? 'active' : ''}`}
                              onClick={child.onClick}
                            >
                              <div className="menu-item-text">{child.label}</div>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* User Profile Section */}
          {!collapsed && (
            <div className="sidebar-user">
              <Dropdown
                menu={{ items: userMenuItems }}
                placement="topRight"
                trigger={['click']}
              >
                <div className="user-profile">
                  <Avatar
                    size={44}
                    src={user?.avatarUrl}
                    icon={<UserOutlined />}
                    className="user-avatar"
                  />
                  <div className="user-info">
                    <div className="user-name">{user?.username}</div>
                    <div className="user-role">{user?.role === 'super_admin' ? '超级管理员' : user?.role === 'position_admin' ? '职位管理员' : user?.role === 'developer' ? '开发者' : '用户'}</div>
                  </div>
                  <div className="user-status"></div>
                </div>
              </Dropdown>
            </div>
          )}
        </Sider>

        {/* 主内容区域 */}
        <Layout className="main-content">
          {/* 顶部导航栏 */}
          <div className="content-header">
            <div className="header-left">
              <Button
                type="text"
                icon={<MenuOutlined />}
                onClick={() => setCollapsed(!collapsed)}
                className="sidebar-toggle"
              />
              <h1 className="header-title">
                {location.pathname === '/dashboard' && '工作台'}
                {location.pathname === '/ranking' && '赏金排行'}
                {location.pathname === '/bounty-tasks' && '任务市场'}
                {location.pathname.startsWith('/my/') && '我的工作台'}
                {location.pathname.startsWith('/admin/') && '管理中心'}
                {location.pathname.startsWith('/dev/') && '开发管理'}
              </h1>
            </div>

            <div className="header-actions">
              <div className="header-search">
                <Input
                  placeholder="搜索任务、用户或项目..."
                  allowClear
                />
              </div>

              <Tooltip title={themeMode === 'light' ? '切换到暗色模式' : '切换到亮色模式'}>
                <Button
                  type="text"
                  icon={themeMode === 'light' ? <MoonOutlined /> : <SunOutlined />}
                  onClick={toggleTheme}
                  className="theme-toggle-btn"
                  style={{
                    width: 36,
                    height: 36,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-secondary)',
                  }}
                />
              </Tooltip>

              <div className="header-notifications" onClick={() => navigate('/notifications')}>
                <BellOutlined style={{ fontSize: 18 }} />
                {unreadCount > 0 && <div className="notification-badge">{unreadCount}</div>}
              </div>

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
            </div>
          </div>

          {/* 主内容 */}
          <div className="content-body">
            <Outlet />
          </div>
        </Layout>
      </Layout>

      {/* 移动端遮罩层 */}
      {isMobile && !collapsed && (
        <div
          className="sidebar-overlay visible"
          onClick={() => setCollapsed(true)}
        />
      )}

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
          <Dropdown
            menu={{
              items: [
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
              className: "mobile-bottom-nav-dropdown"
            }}
            placement="topCenter"
            trigger={['click']}
          >
            <div
              className={`bottom-nav-item ${location.pathname.startsWith('/my') ? 'active' : ''}`}
            >
              <UserOutlined />
              <span>工作台</span>
            </div>
          </Dropdown>
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
    </div>
  );
};