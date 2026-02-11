import React, { useState } from 'react';
import { Form, Input, Button, Typography, message, Card } from 'antd';
import { UserOutlined, LockOutlined, TrophyOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';
import { LoginRequest } from '../../types';
import { colors, spacing } from '../../styles/design-tokens';

const { Title, Text } = Typography;

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});

  const onFinish = async (values: LoginRequest) => {
    setLoading(true);
    setFormErrors({}); // Clear previous errors
    try {
      const response = await authApi.login(values);
      setAuth(response.token, response.user);
      message.success('登录成功！');
      navigate('/dashboard');
    } catch (error: any) {
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
        const errorMessage = responseData?.error || responseData?.message || '登录失败，请检查用户名和密码';
        
        // Check if it's a field-specific error
        if (errorMessage.includes('用户名') || errorMessage.includes('username')) {
          setFormErrors({ username: errorMessage });
        } else if (errorMessage.includes('密码') || errorMessage.includes('password')) {
          setFormErrors({ password: errorMessage });
        } else if (errorMessage.includes('用户不存在') || errorMessage.includes('用户名或密码错误')) {
          // For login errors, show on username field as it's the first field
          setFormErrors({ username: errorMessage });
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
    <div className="flex-center" style={{ 
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${colors.primary} 0%, #096dd9 100%)`,
    }}>
      <Card 
        style={{ 
          width: '100%',
          maxWidth: 400,
          margin: spacing.md,
        }}
        className="fade-in"
      >
        <div className="text-center mb-lg">
          <TrophyOutlined style={{ fontSize: 48, color: colors.primary, marginBottom: spacing.md }} />
          <Title level={2} style={{ marginBottom: spacing.xs }}>
            赏金猎人平台
          </Title>
          <Text type="secondary">登录您的账户</Text>
        </div>

        <Form name="login" onFinish={onFinish} autoComplete="off" size="large">
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名！' }]}
            validateStatus={formErrors.username ? 'error' : ''}
            help={formErrors.username || ''}
          >
            <Input
              prefix={<UserOutlined style={{ color: colors.text.secondary }} />}
              placeholder="用户名"
              onChange={() => {
                if (formErrors.username) {
                  setFormErrors(prev => ({ ...prev, username: '' }));
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
              prefix={<LockOutlined style={{ color: colors.text.secondary }} />}
              placeholder="密码"
              onChange={() => {
                if (formErrors.password) {
                  setFormErrors(prev => ({ ...prev, password: '' }));
                }
              }}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: spacing.sm }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
            >
              登录
            </Button>
          </Form.Item>

          <div className="text-center">
            <Text type="secondary">
              还没有账号？ <Link to="/auth/register">立即注册</Link>
            </Text>
          </div>
        </Form>
      </Card>
    </div>
  );
};
