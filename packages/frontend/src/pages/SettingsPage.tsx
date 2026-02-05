import React, { useState } from 'react';
import {
  Typography,
  Card,
  Form,
  Input,
  Button,
  Switch,
  Space,
  message,
  Divider,
  Select,
} from 'antd';
import { LockOutlined, GlobalOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

export const SettingsPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [passwordForm] = Form.useForm();
  const [notificationSettings, setNotificationSettings] = useState({
    taskAssigned: true,
    taskCompleted: true,
    taskAbandoned: true,
    bountyReceived: true,
    systemNotifications: true,
  });

  const handleChangePassword = async (_values: any) => {
    try {
      setLoading(true);
      // TODO: Implement password change API
      message.success('密码修改成功');
      passwordForm.resetFields();
    } catch (error) {
      message.error('密码修改失败');
      console.error('Failed to change password:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
    // TODO: Save notification settings to backend
    message.success('通知设置已更新');
  };

  return (
    <div className="page-container fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <Title level={2} style={{ margin: 0 }}>设置</Title>
          <Text type="secondary">管理您的账户和偏好设置</Text>
        </div>
      </div>

      {/* 修改密码 */}
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
          >
            <Input.Password prefix={<LockOutlined />} placeholder="当前密码" />
          </Form.Item>

          <Form.Item
            name="newPassword"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码至少6个字符' },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="新密码" />
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
          >
            <Input.Password prefix={<LockOutlined />} placeholder="确认新密码" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                修改密码
              </Button>
              <Button onClick={() => passwordForm.resetFields()}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {/* 通知设置 */}
      <Card title={<Text strong style={{ fontSize: 16 }}>🔔 通知设置</Text>} style={{ marginBottom: 24 }}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
            <div>
              <Text strong style={{ fontSize: 15 }}>任务被承接</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 13 }}>当您发布的任务被他人承接时通知您</Text>
            </div>
            <Switch
              checked={notificationSettings.taskAssigned}
              onChange={(checked) => handleNotificationChange('taskAssigned', checked)}
            />
          </div>

          <Divider style={{ margin: '0' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
            <div>
              <Text strong style={{ fontSize: 15 }}>任务完成</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 13 }}>当您承接的任务完成时通知您</Text>
            </div>
            <Switch
              checked={notificationSettings.taskCompleted}
              onChange={(checked) => handleNotificationChange('taskCompleted', checked)}
            />
          </div>

          <Divider style={{ margin: '0' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
            <div>
              <Text strong style={{ fontSize: 15 }}>任务被放弃</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 13 }}>当您发布的任务被承接者放弃时通知您</Text>
            </div>
            <Switch
              checked={notificationSettings.taskAbandoned}
              onChange={(checked) => handleNotificationChange('taskAbandoned', checked)}
            />
          </div>

          <Divider style={{ margin: '0' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
            <div>
              <Text strong style={{ fontSize: 15 }}>赏金到账</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 13 }}>当您获得赏金时通知您</Text>
            </div>
            <Switch
              checked={notificationSettings.bountyReceived}
              onChange={(checked) => handleNotificationChange('bountyReceived', checked)}
            />
          </div>

          <Divider style={{ margin: '0' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
            <div>
              <Text strong style={{ fontSize: 15 }}>系统通知</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 13 }}>接收系统重要通知和公告</Text>
            </div>
            <Switch
              checked={notificationSettings.systemNotifications}
              onChange={(checked) => handleNotificationChange('systemNotifications', checked)}
            />
          </div>
        </Space>
      </Card>

      {/* 语言和地区 */}
      <Card title={<Text strong style={{ fontSize: 16 }}><GlobalOutlined /> 语言和地区</Text>}>
        <Form layout="vertical" style={{ maxWidth: 600 }}>
          <Form.Item label="语言" initialValue="zh-CN">
            <Select prefix={<GlobalOutlined />}>
              <Option value="zh-CN">简体中文</Option>
              <Option value="en-US">English</Option>
            </Select>
          </Form.Item>

          <Form.Item label="时区" initialValue="Asia/Shanghai">
            <Select>
              <Option value="Asia/Shanghai">中国标准时间 (UTC+8)</Option>
              <Option value="America/New_York">美国东部时间 (UTC-5)</Option>
              <Option value="Europe/London">英国时间 (UTC+0)</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Button type="primary">保存设置</Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};
