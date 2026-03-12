import React, { useState } from 'react';
import { Card, Form, Input, Button, Space, Typography } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { userApi } from '../../api/user';
import { useErrorHandler } from '../../hooks/useErrorHandler';

const { Text } = Typography;

interface PasswordChangeFormProps {
  onSuccess?: () => void;
}

export const PasswordChangeForm: React.FC<PasswordChangeFormProps> = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [passwordForm] = Form.useForm();
  const [passwordErrors, setPasswordErrors] = useState<{[key: string]: string}>({});
  const { handleAsyncError } = useErrorHandler();

  const handleChangePassword = async (values: any) => {
    try {
      setLoading(true);
      setPasswordErrors({});
      
      await handleAsyncError(
        () => userApi.changePassword({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        }),
        'PasswordChangeForm.changePassword',
        '密码修改成功',
        undefined // Let custom error handling below handle the error message
      );
      
      passwordForm.resetFields();
      onSuccess?.();
    } catch (error: any) {
      if (error.response?.data) {
        const responseData = error.response.data;
        
        // Check if it's a validation error with details (new format)
        if (responseData.code === 'VALIDATION_ERROR' && responseData.details) {
          const newErrors: {[key: string]: string} = {};
          responseData.details.forEach((detail: any) => {
            if (detail.path && detail.path.length > 0) {
              newErrors[detail.path[0]] = detail.message;
            }
          });
          setPasswordErrors(newErrors);
        } 
        // Check for other error formats and map to appropriate fields
        else {
          const errorMessage = responseData.error || responseData.message;
          if (errorMessage.includes('当前密码') || errorMessage.includes('current password') || errorMessage.includes('密码错误')) {
            setPasswordErrors({ currentPassword: errorMessage });
          } else if (errorMessage.includes('新密码') || errorMessage.includes('new password')) {
            setPasswordErrors({ newPassword: errorMessage });
          } else if (errorMessage.includes('密码') || errorMessage.includes('password')) {
            setPasswordErrors({ currentPassword: errorMessage });
          }
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const clearFieldError = (fieldName: string) => {
    if (passwordErrors[fieldName]) {
      setPasswordErrors(prev => ({ ...prev, [fieldName]: '' }));
    }
  };

  return (
    <Card title={<Text strong style={{ fontSize: 16 }}><LockOutlined /> 修改密码</Text>} style={{ marginBottom: 24 }}>
      <Form
        form={passwordForm}
        layout="vertical"
        onFinish={handleChangePassword}
        style={{ maxWidth: 600 }}
      >
        <Form.Item
          name="currentPassword"
          label="当前密码"
          rules={[{ required: true, message: '请输入当前密码' }]}
          validateStatus={passwordErrors.currentPassword ? 'error' : ''}
          help={passwordErrors.currentPassword || ''}
        >
          <Input.Password 
            prefix={<LockOutlined />} 
            placeholder="当前密码" 
            onChange={() => clearFieldError('currentPassword')}
          />
        </Form.Item>

        <Form.Item
          name="newPassword"
          label="新密码"
          rules={[
            { required: true, message: '请输入新密码' },
            { min: 8, message: '密码至少8个字符' },
          ]}
          validateStatus={passwordErrors.newPassword ? 'error' : ''}
          help={passwordErrors.newPassword || ''}
        >
          <Input.Password 
            prefix={<LockOutlined />} 
            placeholder="新密码" 
            onChange={() => clearFieldError('newPassword')}
          />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          label="确认新密码"
          dependencies={['newPassword']}
          rules={[
            { required: true, message: '请确认新密码' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('newPassword') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('两次输入的密码不一致'));
              },
            }),
          ]}
          validateStatus={passwordErrors.confirmPassword ? 'error' : ''}
          help={passwordErrors.confirmPassword || ''}
        >
          <Input.Password 
            prefix={<LockOutlined />} 
            placeholder="确认新密码" 
            onChange={() => clearFieldError('confirmPassword')}
          />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
            >
              修改密码
            </Button>
            <Button onClick={() => {
              passwordForm.resetFields();
              setPasswordErrors({});
            }}>
              重置
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};