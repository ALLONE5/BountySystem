import React, { useState } from 'react';
import { Form, Input, Button, Typography } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, TrophyOutlined, RocketOutlined, TeamOutlined, SafetyOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSystemConfig } from '../../contexts/SystemConfigContext';
import { logger } from '../../utils/logger';
import { message } from '../../utils/message';
import './AuthPages.css';

const { Title, Text } = Typography;

interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const { config: systemConfig } = useSystemConfig();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [passwordStrength, setPasswordStrength] = useState(0);

  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    return Math.min(strength, 4);
  };

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
      // 使用 React Router 导航而不是硬刷新
      navigate('/dashboard', { replace: true });
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
        const errorMessage = error.response?.data?.message || '用户名或邮箱已存�?;
        if (errorMessage.includes('用户�?) || errorMessage.includes('username')) {
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
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Left Side - Branding */}
      <div className="auth-left">
        <div className="auth-branding">
          <div className="auth-logo">
            {systemConfig?.logoUrl ? (
              <img 
                src={systemConfig.logoUrl.startsWith('http') 
                  ? systemConfig.logoUrl 
                  : `${(import.meta.env.VITE_API_URL || "http://localhost:3001").replace(/\/api$/, "")}${systemConfig.logoUrl}`
                } 
                alt="Logo"
                onError={(e) => {
                  logger.error('Logo failed to load:', systemConfig.logoUrl);
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <TrophyOutlined />
            )}
          </div>
          <h1 className="auth-title">
            {systemConfig?.siteName || '赏金平台'}
          </h1>
          <p className="auth-subtitle">
            加入我们，开启高效协作之�?
          </p>

          <div className="auth-features">
            <div className="auth-feature">
              <div className="auth-feature-icon">
                <RocketOutlined />
              </div>
              <div className="auth-feature-title">快速上�?/div>
              <div className="auth-feature-desc">
                简单注册，即刻开始使�?
              </div>
            </div>
            <div className="auth-feature">
              <div className="auth-feature-icon">
                <TeamOutlined />
              </div>
              <div className="auth-feature-title">团队协作</div>
              <div className="auth-feature-desc">
                与团队成员高效协�?
              </div>
            </div>
            <div className="auth-feature">
              <div className="auth-feature-icon">
                <SafetyOutlined />
              </div>
              <div className="auth-feature-title">数据安全</div>
              <div className="auth-feature-desc">
                您的数据安全有保�?
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Register Form */}
      <div className="auth-right">
        <div className="auth-form-container">
          <div className="auth-form-header">
            <div className="auth-form-logo">
              {systemConfig?.logoUrl ? (
                <img 
                  src={systemConfig.logoUrl.startsWith('http') 
                    ? systemConfig.logoUrl 
                    : `${(import.meta.env.VITE_API_URL || "http://localhost:3001").replace(/\/api$/, "")}${systemConfig.logoUrl}`
                  } 
                  alt="Logo"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <TrophyOutlined />
              )}
            </div>
            <Title level={2} className="auth-form-title">
              创建账户
            </Title>
            <Text className="auth-form-subtitle">
              填写信息以开始使�?
            </Text>
          </div>

          <Form 
            name="register" 
            onFinish={onFinish} 
            autoComplete="off"
            className="auth-form"
          >
            <Form.Item
              name="username"
              rules={[
                { required: true, message: '请输入用户名�? },
                { min: 3, message: '用户名至�?个字符！' },
              ]}
              validateStatus={formErrors.username ? 'error' : ''}
              help={formErrors.username || ''}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="用户�?
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
                { type: 'email', message: '请输入有效的邮箱地址�? },
              ]}
              validateStatus={formErrors.email ? 'error' : ''}
              help={formErrors.email || ''}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder="邮箱"
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
                placeholder="密码（至�?位，包含大小写字母和数字�?
                onChange={(e) => {
                  if (formErrors.password) {
                    setFormErrors(prev => ({ ...prev, password: '' }));
                  }
                  setPasswordStrength(calculatePasswordStrength(e.target.value));
                }}
              />
            </Form.Item>

            {passwordStrength > 0 && (
              <div className="password-strength">
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={`password-strength-bar ${
                      level <= passwordStrength ? 'active' : ''
                    } ${
                      passwordStrength === 1 ? 'weak' :
                      passwordStrength === 2 ? 'medium' :
                      passwordStrength >= 3 ? 'strong' : ''
                    }`}
                  />
                ))}
              </div>
            )}

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
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
              >
                注册
              </Button>
            </Form.Item>
          </Form>

          <div className="auth-form-footer">
            <Text className="auth-form-footer-text">
              已有账号？{' '}
              <Link to="/auth/login" className="auth-form-footer-link">
                立即登录
              </Link>
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
};
