import React from 'react';
import { Card, Form, Input, Button, Space, Divider } from 'antd';
import { UserOutlined, MailOutlined } from '@ant-design/icons';
import { User } from '../../types';
import { useErrorHandler } from '../../hooks/useErrorHandler';

interface ProfileEditFormProps {
  user: User;
  loading: boolean;
  formErrors: { [key: string]: string };
  onSubmit: (values: any) => Promise<void>;
  onErrorChange: (field: string, error: string) => void;
}

export const ProfileEditForm: React.FC<ProfileEditFormProps> = ({
  user,
  loading,
  formErrors,
  onSubmit,
  onErrorChange,
}) => {
  const [form] = Form.useForm();
  const { handleAsyncError } = useErrorHandler();

  React.useEffect(() => {
    if (user) {
      form.setFieldsValue({
        username: user.username,
        email: user.email,
      });
    }
  }, [user, form]);

  const handleSubmit = async (values: any) => {
    await handleAsyncError(
      () => onSubmit(values),
      'ProfileEditForm.submit',
      undefined,
      undefined
    );
  };

  const handleFieldChange = (field: string) => {
    if (formErrors[field]) {
      onErrorChange(field, '');
    }
  };

  return (
    <Card title="编辑个人信息">
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        style={{ maxWidth: 600 }}
      >
        <Form.Item
          name="username"
          label="用户名"
          rules={[{ required: true, message: '请输入用户名' }]}
          validateStatus={formErrors.username ? 'error' : ''}
          help={formErrors.username || ''}
        >
          <Input 
            prefix={<UserOutlined />} 
            placeholder="用户名" 
            onChange={() => handleFieldChange('username')}
          />
        </Form.Item>

        <Form.Item
          name="email"
          label="邮箱"
          rules={[
            { required: true, message: '请输入邮箱' },
            { type: 'email', message: '请输入有效的邮箱地址' },
          ]}
          validateStatus={formErrors.email ? 'error' : ''}
          help={formErrors.email || ''}
        >
          <Input 
            prefix={<MailOutlined />} 
            placeholder="邮箱" 
            disabled 
            onChange={() => handleFieldChange('email')}
          />
        </Form.Item>

        <Divider />

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>
              保存修改
            </Button>
            <Button onClick={() => form.resetFields()}>重置</Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};