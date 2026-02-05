import React, { useState } from 'react';
import { Form, Input, Button, Typography, message } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';
import { RegisterRequest } from '../../types';

const { Title, Text } = Typography;

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      // Only send required fields to backend (exclude confirmPassword)
      const registerData: RegisterRequest = {
        username: values.username,
        email: values.email,
        password: values.password,
      };
      const response = await authApi.register(registerData);
      setAuth(response.token, response.user);
      message.success('注册成功！');
      navigate('/dashboard');
    } catch (error: any) {
      message.error(error.response?.data?.message || '注册失败，请稍后重试');
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
        >
          <Input
            prefix={<UserOutlined />}
            placeholder="用户名"
            size="large"
          />
        </Form.Item>

        <Form.Item
          name="email"
          rules={[
            { required: true, message: '请输入邮箱！' },
            { type: 'email', message: '请输入有效的邮箱地址！' },
          ]}
        >
          <Input
            prefix={<MailOutlined />}
            placeholder="邮箱"
            size="large"
          />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[
            { required: true, message: '请输入密码！' },
            { min: 6, message: '密码至少6个字符！' },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="密码"
            size="large"
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
