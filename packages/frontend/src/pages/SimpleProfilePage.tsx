import React, { useState, useEffect } from 'react';
import { Card, Typography, Descriptions, Avatar, Button, Space } from 'antd';
import { UserOutlined, EditOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

export const SimpleProfilePage: React.FC = () => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
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
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/auth/login';
  };

  if (!user) {
    return (
      <div style={{ padding: '20px', minHeight: '100vh', background: '#f0f2f5' }}>
        <Card>
          <Text>加载用户信息中...</Text>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', minHeight: '100vh', background: '#f0f2f5' }}>
      <Card>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Avatar size={80} icon={<UserOutlined />} />
          <Title level={3} style={{ marginTop: '16px', marginBottom: '8px' }}>
            {user.username}
          </Title>
          <Text type="secondary">{user.email}</Text>
        </div>

        <Descriptions title="个人信息" bordered column={1}>
          <Descriptions.Item label="用户名">{user.username}</Descriptions.Item>
          <Descriptions.Item label="邮箱">{user.email}</Descriptions.Item>
          <Descriptions.Item label="角色">{user.role}</Descriptions.Item>
          <Descriptions.Item label="余额">¥{user.balance}</Descriptions.Item>
          <Descriptions.Item label="用户ID">{user.id}</Descriptions.Item>
        </Descriptions>

        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <Space>
            <Button type="primary" icon={<EditOutlined />}>
              编辑资料
            </Button>
            <Button onClick={handleLogout}>
              退出登录
            </Button>
          </Space>
        </div>
      </Card>
    </div>
  );
};