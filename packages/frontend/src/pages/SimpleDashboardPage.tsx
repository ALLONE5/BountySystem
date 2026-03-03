import React from 'react';
import { Card, Typography, Button } from 'antd';
import { useAuthStore } from '../store/authStore';

const { Title, Text } = Typography;

export const SimpleDashboardPage: React.FC = () => {
  const { user, clearAuth } = useAuthStore();

  const handleLogout = () => {
    clearAuth();
    window.location.href = '/auth/login';
  };

  return (
    <div style={{ padding: '20px', minHeight: '100vh', background: '#f0f2f5' }}>
      <Card style={{ maxWidth: 800, margin: '0 auto' }}>
        <Title level={2}>🏠 简单仪表板</Title>
        <Text>
          欢迎来到仪表板！这证明受保护路由正常工作。
        </Text>
        
        {user && (
          <div style={{ marginTop: '20px' }}>
            <p><strong>用户名:</strong> {user.username}</p>
            <p><strong>邮箱:</strong> {user.email}</p>
            <p><strong>角色:</strong> {user.role}</p>
            <p><strong>余额:</strong> {user.balance}</p>
          </div>
        )}
        
        <div style={{ marginTop: '20px' }}>
          <p>✅ 认证系统正常工作</p>
          <p>✅ 受保护路由正常工作</p>
          <p>✅ 用户状态正常加载</p>
        </div>
        
        <div style={{ marginTop: '30px' }}>
          <Button type="primary" onClick={handleLogout}>
            退出登录
          </Button>
        </div>
      </Card>
    </div>
  );
};