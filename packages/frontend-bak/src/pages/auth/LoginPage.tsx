import React, { useState } from 'react';
import { Form, Input, Button, Typography, Card, App } from 'antd';
import { UserOutlined, LockOutlined, TrophyOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSystemConfig } from '../../contexts/SystemConfigContext';
import { logger } from '../../utils/logger';

const { Title, Text } = Typography;

export const LoginPage: React.FC = () => {
  console.log('🎨 [LoginPage] Component rendering - VERSION 3.0');
  const { message } = App.useApp();
  const { login } = useAuth();
  const { config: systemConfig } = useSystemConfig();
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});

  const onFinish = async (values: any) => {
    console.log('🔵🔵🔵 [LoginPage] onFinish called with values:', values);
    setLoading(true);
    setFormErrors({}); // Clear previous errors
    try {
      console.log('🔵 [LoginPage] Starting login process - NEW CODE VERSION 3.0');
      await login(values.username, values.password);
      console.log('🟢 [LoginPage] Login successful, showing message');
      message.success('登录成功');
      
      console.log('🟡 [LoginPage] Using window.location.href for navigation');
      // Use window.location.href for a full page reload to ensure auth state is fresh
      window.location.href = '/dashboard';
    } catch (error: any) {
      console.error('🔴 [LoginPage] Login error:', error);
      const responseData = error.response?.data;
      
      // Check for validation errors with details (new format)
      if (responseData?.code === 'VALIDATION_ERROR' && responseData?.details) {
        const newErrors: {[key: string]: string} = {};
        responseData.details.forEach((detail: any) => {
          if (detail.path && detail.path.length > 0) {
            newErrors[detail.path[0]] = detail.message;
          }
        });
        setFormErrors(newErrors);
      } 
      // Check for other error formats
      else {
        const errorMessage = responseData?.error || responseData?.message || '登录失败，请检查邮箱和密码';
        
        // Check if it's a field-specific error
        if (errorMessage.includes('邮箱') || errorMessage.includes('email')) {
          setFormErrors({ email: errorMessage });
        } else if (errorMessage.includes('密码') || errorMessage.includes('password')) {
          setFormErrors({ password: errorMessage });
        } else if (errorMessage.includes('用户不存在') || errorMessage.includes('邮箱或密码错误')) {
          // For login errors, show on email field as it's the first field
          setFormErrors({ email: errorMessage });
        } else {
          // Generic error, show at top
          message.error(errorMessage);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      <Card 
        style={{ 
          width: '100%',
          maxWidth: 400,
          margin: '16px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          {systemConfig?.logoUrl ? (
            <img 
              src={systemConfig.logoUrl.startsWith('http') 
                ? systemConfig.logoUrl 
                : `http://localhost:3001${systemConfig.logoUrl}`
              } 
              alt="Logo" 
              style={{ height: '48px', width: 'auto', marginBottom: '16px' }}
              onError={(e) => {
                logger.error('Logo failed to load:', systemConfig.logoUrl);
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <TrophyOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: '16px' }} />
          )}
          <Title level={2} style={{ marginBottom: '8px' }}>
            {systemConfig?.siteName || '赏金平台'}
          </Title>
          <Text type="secondary">登录您的账户</Text>
        </div>

        <Form name="login" onFinish={onFinish} autoComplete="off" size="large">
          <Form.Item
            name="username"
            rules={[
              { required: true, message: '请输入邮箱或用户名！' },
            ]}
            validateStatus={formErrors.email ? 'error' : ''}
            help={formErrors.email || ''}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#8c8c8c' }} />}
              placeholder="邮箱或用户名"
              onChange={() => {
                if (formErrors.email) {
                  setFormErrors(prev => ({ ...prev, email: '' }));
                }
              }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码！' }]}
            validateStatus={formErrors.password ? 'error' : ''}
            help={formErrors.password || ''}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#8c8c8c' }} />}
              placeholder="密码"
              onChange={() => {
                if (formErrors.password) {
                  setFormErrors(prev => ({ ...prev, password: '' }));
                }
              }}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: '16px' }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
            >
              登录
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center' }}>
            <Text type="secondary">
              还没有账号？ <Link to="/auth/register">立即注册</Link>
            </Text>
          </div>
        </Form>
      </Card>
    </div>
  );
};
