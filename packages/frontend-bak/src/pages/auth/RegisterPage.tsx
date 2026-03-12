import React, { useState } from 'react';
import { Form, Input, Button, Typography, message } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { logger } from '../../utils/logger';

const { Title, Text } = Typography;

interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});

  const onFinish = async (values: RegisterFormData) => {
    setLoading(true);
    setFormErrors({}); // Clear previous errors
    try {
      // Only send required fields to backend (exclude confirmPassword)
      const registerData = {
        username: values.username,
        email: values.email,
        password: values.password,
      };
      await register(registerData);
      message.success('注册成功');
      
      // Use setTimeout to ensure state updates have propagated
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 100);
    } catch (error: any) {
      logger.error('Registration error:', error);
      
      // Handle validation errors with detailed messages
      if (error.response?.data?.code === 'VALIDATION_ERROR' && error.response?.data?.details) {
        const newErrors: {[key: string]: string} = {};
        error.response.data.details.forEach((detail: any) => {
          if (detail.path && detail.path.length > 0) {
            newErrors[detail.path[0]] = detail.message;
          }
        });
        setFormErrors(newErrors);
      } else if (error.response?.status === 400 && error.response?.data?.type === 'ValidationError' && error.response?.data?.details) {
        const newErrors: {[key: string]: string} = {};
        error.response.data.details.forEach((detail: any) => {
          if (detail.path && detail.path.length > 0) {
            newErrors[detail.path[0]] = detail.message;
          }
        });
        setFormErrors(newErrors);
      } else if (error.response?.status === 400 && error.response?.data?.details) {
        const validationErrors = error.response.data.details;
        const newErrors: {[key: string]: string} = {};
        validationErrors.forEach((err: any) => {
          newErrors[err.field] = err.message;
        });
        setFormErrors(newErrors);
      } else if (error.response?.status === 409) {
        // Handle conflict errors (user already exists)
        const errorMessage = error.response?.data?.message || '用户名或邮箱已存在';
        if (errorMessage.includes('用户名') || errorMessage.includes('username')) {
          setFormErrors({ username: errorMessage });
        } else if (errorMessage.includes('邮箱') || errorMessage.includes('email')) {
          setFormErrors({ email: errorMessage });
        } else {
          message.error(errorMessage);
        }
      } else if (error.response?.status === 429) {
        // Handle rate limiting - show at top as it's not field-specific
        message.error('注册请求过于频繁，请稍后再试');
      } else {
        // Generic error message - show at top
        message.error(error.response?.data?.message || '注册失败，请稍后重试');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Title level={2} style={{ textAlign: 'center', marginBottom: '32px' }}>
        注册
      </Title>
      <Form name="register" onFinish={onFinish} autoComplete="off">
        <Form.Item
          name="username"
          rules={[
            { required: true, message: '请输入用户名！' },
            { min: 3, message: '用户名至少3个字符！' },
          ]}
          validateStatus={formErrors.username ? 'error' : ''}
          help={formErrors.username || ''}
        >
          <Input
            prefix={<UserOutlined />}
            placeholder="用户名"
            size="large"
            onChange={() => {
              if (formErrors.username) {
                setFormErrors(prev => ({ ...prev, username: '' }));
              }
            }}
          />
        </Form.Item>

        <Form.Item
          name="email"
          rules={[
            { required: true, message: '请输入邮箱！' },
            { type: 'email', message: '请输入有效的邮箱地址！' },
          ]}
          validateStatus={formErrors.email ? 'error' : ''}
          help={formErrors.email || ''}
        >
          <Input
            prefix={<MailOutlined />}
            placeholder="邮箱"
            size="large"
            onChange={() => {
              if (formErrors.email) {
                setFormErrors(prev => ({ ...prev, email: '' }));
              }
            }}
          />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[
            { required: true, message: '请输入密码！' },
            { min: 8, message: '密码至少8个字符！' },
            { 
              pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 
              message: '密码必须包含至少一个大写字母、一个小写字母和一个数字！' 
            },
          ]}
          validateStatus={formErrors.password ? 'error' : ''}
          help={formErrors.password || ''}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="密码（至少8位，包含大小写字母和数字）"
            size="large"
            onChange={() => {
              if (formErrors.password) {
                setFormErrors(prev => ({ ...prev, password: '' }));
              }
            }}
          />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          dependencies={['password']}
          rules={[
            { required: true, message: '请确认密码！' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('两次输入的密码不一致！'));
              },
            }),
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="确认密码"
            size="large"
          />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            block
            size="large"
          >
            注册
          </Button>
        </Form.Item>

        <div style={{ textAlign: 'center' }}>
          <Text>
            已有账号？ <Link to="/auth/login">立即登录</Link>
          </Text>
        </div>
      </Form>
    </div>
  );
};
