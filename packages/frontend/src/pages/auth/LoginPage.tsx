import React, { useState } from 'react';
import { Form, Input, Button, Typography } from 'antd';
import { UserOutlined, LockOutlined, TrophyOutlined, RocketOutlined, TeamOutlined, SafetyOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSystemConfig } from '../../contexts/SystemConfigContext';
import { logger } from '../../utils/logger';
import { message } from '../../utils/message';
import './AuthPages.css';

const { Title, Text } = Typography;

const getLogoSrc = (logoUrl: string) => {
  if (logoUrl.startsWith('http')) return logoUrl;
  const base = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/api$/, '');
  return `${base}${logoUrl}`;
};

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { config: systemConfig } = useSystemConfig();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});

  const onFinish = async (values: any) => {
    setLoading(true);
    setFormErrors({});
    try {
      logger.info('开始登录流程', { username: values.username });
      await login(values.username, values.password);
      logger.info('登录成功，准备跳转');

      const savedToken = localStorage.getItem('token');
      logger.info('Token 已保存', {
        hasToken: !!savedToken,
        tokenLength: savedToken?.length,
        tokenPreview: savedToken?.substring(0, 30) + '...'
      });

      if (savedToken) {
        try {
          logger.info('测试 token 有效性');
          const response = await fetch('http://localhost:3001/api/auth/verify-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: savedToken })
          });
          const result = await response.json();
          logger.info('Token 验证结果', result);

          if (!result.data?.valid) {
            logger.error('Token 无效', result);
            message.error('登录成功但 Token 无效，请联系管理员');
            setLoading(false);
            return;
          }
        } catch (error) {
          logger.error('Token 验证失败', error);
        }
      }

      logger.info('执行页面跳转');
      navigate('/dashboard', { replace: true });
    } catch (error: any) {
      logger.error('登录失败', error);
      const responseData = error.response?.data;

      if (responseData?.code === 'VALIDATION_ERROR' && responseData?.details) {
        const newErrors: {[key: string]: string} = {};
        responseData.details.forEach((detail: any) => {
          if (detail.path && detail.path.length > 0) {
            newErrors[detail.path[0]] = detail.message;
          }
        });
        setFormErrors(newErrors);
      } else {
        const errorMessage = responseData?.error || responseData?.message || '登录失败，请检查邮箱和密码';

        if (errorMessage.includes('邮箱') || errorMessage.includes('email')) {
          setFormErrors({ email: errorMessage });
        } else if (errorMessage.includes('密码') || errorMessage.includes('password')) {
          setFormErrors({ password: errorMessage });
        } else if (errorMessage.includes('用户不存在') || errorMessage.includes('邮箱或密码错误')) {
          setFormErrors({ email: errorMessage });
        } else {
          message.error(errorMessage);
        }
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
                src={getLogoSrc(systemConfig.logoUrl)}
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
            测试版
          </p>

          <div className="auth-features">
            <div className="auth-feature">
              <div className="auth-feature-icon"><RocketOutlined /></div>
              <div className="auth-feature-title">高效协作</div>
              <div className="auth-feature-desc">多视图查看任务</div>
            </div>
            <div className="auth-feature">
              <div className="auth-feature-icon"><TeamOutlined /></div>
              <div className="auth-feature-title">团队管理</div>
              <div className="auth-feature-desc">自由进行团队任务</div>
            </div>
            <div className="auth-feature">
              <div className="auth-feature-icon"><SafetyOutlined /></div>
              <div className="auth-feature-title">分级</div>
              <div className="auth-feature-desc">不同角色不同界面</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="auth-right">
        <div className="auth-form-container">
          <div className="auth-form-header">
            <div className="auth-form-logo">
              {systemConfig?.logoUrl ? (
                <img
                  src={getLogoSrc(systemConfig.logoUrl)}
                  alt="Logo"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              ) : (
                <TrophyOutlined />
              )}
            </div>
            <Title level={2} className="auth-form-title">
              欢迎回来
            </Title>
            <Text className="auth-form-subtitle">
              登录您的账户以继续
            </Text>
          </div>

          <Form
            name="login"
            onFinish={onFinish}
            autoComplete="off"
            className="auth-form"
          >
            <Form.Item
              name="username"
              rules={[{ required: true, message: '请输入邮箱或用户名！' }]}
              validateStatus={formErrors.email ? 'error' : ''}
              help={formErrors.email || ''}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="邮箱或用户名"
                onChange={() => {
                  if (formErrors.email) setFormErrors(prev => ({ ...prev, email: '' }));
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
                prefix={<LockOutlined />}
                placeholder="密码"
                onChange={() => {
                  if (formErrors.password) setFormErrors(prev => ({ ...prev, password: '' }));
                }}
              />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block>
                登录
              </Button>
            </Form.Item>
          </Form>

          <div className="auth-form-footer">
            <Text className="auth-form-footer-text">
              还没有账号？{' '}
              <Link to="/auth/register" className="auth-form-footer-link">
                立即注册
              </Link>
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
};
