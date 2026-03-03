import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Layout, ConfigProvider } from 'antd';
import '../styles/glassmorphism.css';
import './ModernLayout.css';

const { Content, Sider } = Layout;

interface ModernLayoutProps {
  showInfoPanel?: boolean;
}

export const ModernLayout: React.FC<ModernLayoutProps> = ({ 
  showInfoPanel = false 
}) => {
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // 响应式检测
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarCollapsed(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 根据路径判断是否显示信息面板
  const shouldShowInfoPanel = showInfoPanel && !isMobile && (
    location.pathname.startsWith('/tasks') ||
    location.pathname.startsWith('/ranking') ||
    location.pathname.startsWith('/admin')
  );

  const layoutClass = `modern-layout theme-dark ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`;

  return (
    <Layout className={layoutClass}>
      {/* 顶部导航栏 */}
      <div className="modern-header">
        <div className="header-content">
          <div className="header-left">
            <button 
              className="sidebar-toggle"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              ☰
            </button>
            <h1 className="app-title">赏金猎人平台</h1>
          </div>
          <div className="header-right">
            <div className="search-box">
              <input type="text" placeholder="搜索..." />
            </div>
            <div className="user-menu">
              <span>用户</span>
            </div>
          </div>
        </div>
      </div>

        <Layout className="modern-layout-body">
          {/* 侧边导航栏 - Discord 风格 */}
          <Sider
            className="modern-sidebar discord-sidebar"
            collapsed={sidebarCollapsed}
            collapsedWidth={isMobile ? 0 : 80}
            width={280}
            trigger={null}
            theme="dark"
          >
            <div className="sidebar-content">
              <div className="nav-section">
                <div className="nav-item">
                  <span>🏠</span>
                  {!sidebarCollapsed && <span>首页</span>}
                </div>
                <div className="nav-item">
                  <span>💼</span>
                  {!sidebarCollapsed && <span>我的</span>}
                </div>
                <div className="nav-item">
                  <span>🎯</span>
                  {!sidebarCollapsed && <span>任务</span>}
                </div>
                <div className="nav-item">
                  <span>👥</span>
                  {!sidebarCollapsed && <span>组群</span>}
                </div>
                <div className="nav-item">
                  <span>🏆</span>
                  {!sidebarCollapsed && <span>排名</span>}
                </div>
              </div>
            </div>
          </Sider>

          {/* 主内容区域 */}
          <Content className="modern-content">
            <div className="content-wrapper glass-card">
              <Outlet />
            </div>
          </Content>

          {/* 信息面板 - 可选 */}
          {shouldShowInfoPanel && (
            <Sider
              className="modern-info-panel"
              width={320}
              theme="dark"
            >
              <div className="info-panel-content">
                <h3>信息面板</h3>
                <div className="info-section">
                  <h4>在线用户</h4>
                  <div className="user-list">
                    <div className="user-item">用户1</div>
                    <div className="user-item">用户2</div>
                  </div>
                </div>
              </div>
            </Sider>
          )}
        </Layout>

        {/* 移动端底部导航 */}
        {isMobile && (
          <div className="mobile-bottom-nav glass">
            <div className="bottom-nav-item">🏠</div>
            <div className="bottom-nav-item">💼</div>
            <div className="bottom-nav-item">🎯</div>
            <div className="bottom-nav-item">👥</div>
            <div className="bottom-nav-item">🏆</div>
          </div>
        )}
      </Layout>
  );
};