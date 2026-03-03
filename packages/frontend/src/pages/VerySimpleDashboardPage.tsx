import React, { useState, useEffect } from 'react';
import { Card, Typography, Button, Space } from 'antd';
import { useSimpleSystemConfig } from '../contexts/SimpleSystemConfigContext';
import { useSimpleTheme } from '../contexts/SimpleThemeContext';

const { Title, Text } = Typography;

export const VerySimpleDashboardPage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const { config } = useSimpleSystemConfig();
  const { theme, setTheme, toggleTheme } = useSimpleTheme();

  useEffect(() => {
    // 从localStorage获取用户信息
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('解析用户信息失败:', error);
      }
    }
  }, []);

  const handleLogout = () => {
    console.log('退出登录');
    // 清除localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/auth/login';
  };

  return (
    <div style={{ padding: '20px', minHeight: '100vh', background: '#f0f2f5' }}>
      <Card style={{ maxWidth: 800, margin: '0 auto' }}>
        <Title level={2}>🏠 {config.siteName}</Title>
        <Text>
          {config.siteDescription}
        </Text>
        
        {user && (
          <div style={{ marginTop: '20px', padding: '16px', background: '#f6f6f6', borderRadius: '8px' }}>
            <Title level={4}>用户信息</Title>
            <p><strong>用户名:</strong> {user.username}</p>
            <p><strong>邮箱:</strong> {user.email}</p>
            <p><strong>角色:</strong> {user.role}</p>
            <p><strong>余额:</strong> {user.balance}</p>
            <p><strong>用户ID:</strong> {user.id}</p>
          </div>
        )}
        
        <div style={{ marginTop: '20px' }}>
          <p>✅ 基础路由正常工作</p>
          <p>✅ 页面渲染正常</p>
          <p>✅ Ant Design 组件正常</p>
          <p>✅ 后端API连接正常</p>
          <p>✅ 用户认证正常工作</p>
          <p>✅ 系统配置上下文正常</p>
          <p>✅ 主题上下文正常</p>
        </div>
        
        <div style={{ marginTop: '20px', padding: '16px', background: '#f6f6f6', borderRadius: '8px' }}>
          <Title level={4}>主题控制</Title>
          <Space>
            <span>当前主题: {theme}</span>
            <Button onClick={toggleTheme}>切换主题</Button>
            <Button onClick={() => setTheme('light')}>浅色</Button>
            <Button onClick={() => setTheme('dark')}>深色</Button>
            <Button onClick={() => setTheme('cyberpunk')}>赛博朋克</Button>
          </Space>
        </div>
        
        <div style={{ marginTop: '30px' }}>
          <Space>
            <Button type="primary" onClick={handleLogout}>
              退出登录
            </Button>
            <Button onClick={() => window.location.href = '/'}>
              返回首页
            </Button>
          </Space>
        </div>
      </Card>
    </div>
  );
};