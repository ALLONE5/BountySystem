import React, { useState } from 'react';
import { Form, Input, Button, Typography, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuthStore } from '../../store/authStore';
import { useSystemConfig } from '../../contexts/SystemConfigContext';

const { Title, Text } = Typography;

export const SimpleLoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const { config: systemConfig } = useSystemConfig();

  const onFinish = async (values: any) => {
    setLoading(true);
    console.log('登录尝试:', values);
    
    try {
      // 实际调用后端API
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: values.username,
          password: values.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('登录成功:', data);
        message.success('登录成功！');
        
        // 存储token到localStorage和zustand store
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        useAuthStore.getState().setAuth(data.token, data.user);
        
        // 跳转到仪表板
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 500);
      } else {
        console.error('登录失败:', data);
        message.error(data.message || '登录失败，请检查用户名和密码');
      }
    } catch (error) {
      console.error('登录错误:', error);
      message.error('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ color: '#1890ff', marginBottom: '8px' }}>
          {systemConfig?.logoUrl ? (
            <img 
              src={systemConfig.logoUrl.startsWith('http') 
                ? systemConfig.logoUrl 
                : `http://localhost:3000${systemConfig.logoUrl}`
              } 
              alt="Logo" 
              style={{ height: '32px', width: 'auto', marginRight: '8px' }}
              onError={(e) => {
                console.error('Logo failed to load:', systemConfig.logoUrl);
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            '🏆 '
          )}
          {systemConfig?.siteName || '赏金平台'}
        </Title>
        <Text type="secondary">欢迎回来！请登录您的账户</Text>
      </div>

      <Form
        name="login"
        onFinish={onFinish}
        autoComplete="off"
        size="large"
      >
        <Form.Item
          name="username"
          rules={[{ required: true, message: '请输入用户名!' }]}
        >
          <Input
            prefix={<UserOutlined />}
            placeholder="用户名"
          />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[{ required: true, message: '请输入密码!' }]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="密码"
          />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            style={{ width: '100%' }}
          >
            {loading ? '登录中...' : '登录'}
          </Button>
        </Form.Item>
      </Form>

      <div style={{ marginTop: '16px' }}>
        <Text type="secondary">
          还没有账户？ <a href="/auth/register">立即注册</a>
        </Text>
      </div>
    </div>
  );
};