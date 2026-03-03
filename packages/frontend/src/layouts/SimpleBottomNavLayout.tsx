import React from 'react';
import { Layout } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  HomeOutlined, 
  UnorderedListOutlined, 
  UserOutlined, 
  SettingOutlined,
  TrophyOutlined 
} from '@ant-design/icons';

const { Content, Footer } = Layout;

interface NavItem {
  key: string;
  icon: React.ReactNode;
  label: string;
  path: string;
}

const navItems: NavItem[] = [
  {
    key: 'dashboard',
    icon: <HomeOutlined />,
    label: '首页',
    path: '/dashboard',
  },
  {
    key: 'tasks',
    icon: <UnorderedListOutlined />,
    label: '任务',
    path: '/tasks',
  },
  {
    key: 'ranking',
    icon: <TrophyOutlined />,
    label: '排行',
    path: '/ranking',
  },
  {
    key: 'profile',
    icon: <UserOutlined />,
    label: '个人',
    path: '/profile',
  },
  {
    key: 'settings',
    icon: <SettingOutlined />,
    label: '设置',
    path: '/settings',
  },
];

export const SimpleBottomNavLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavClick = (path: string) => {
    navigate(path);
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content style={{ paddingBottom: '60px' }}>
        <Outlet />
      </Content>
      
      <Footer 
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '60px',
          padding: '8px 0',
          background: '#ffffff',
          borderTop: '1px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          zIndex: 1000,
        }}
      >
        {navItems.map((item) => (
          <div
            key={item.key}
            onClick={() => handleNavClick(item.path)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '4px',
              color: isActive(item.path) ? '#1890ff' : '#666666',
              backgroundColor: isActive(item.path) ? '#f0f8ff' : 'transparent',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ fontSize: '18px', marginBottom: '2px' }}>
              {item.icon}
            </div>
            <div style={{ fontSize: '10px', fontWeight: isActive(item.path) ? 'bold' : 'normal' }}>
              {item.label}
            </div>
          </div>
        ))}
      </Footer>
    </Layout>
  );
};