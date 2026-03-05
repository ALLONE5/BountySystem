import React, { useState, useEffect } from 'react';
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
  Spin,
} from 'antd';
import { LockOutlined, GlobalOutlined } from '@ant-design/icons';
import { userApi, NotificationPreferences } from '../api/user';

const { Title, Text } = Typography;
const { Option } = Select;

export const SettingsPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [timezoneLoading, setTimezoneLoading] = useState(false);
  const [passwordForm] = Form.useForm();
  const [timezoneForm] = Form.useForm();
  const [passwordErrors, setPasswordErrors] = useState<{[key: string]: string}>({});
  const [timezoneSettings, setTimezoneSettings] = useState({
    timezone: 'Asia/Shanghai'
  });
  const [notificationSettings, setNotificationSettings] = useState<NotificationPreferences>({
    taskAssigned: true,
    taskCompleted: true,
    taskAbandoned: true,
    bountyReceived: true,
    systemNotifications: true,
  });

  // Load notification preferences on component mount
  useEffect(() => {
    loadNotificationPreferences();
    loadTimezoneSettings();
  }, []);

  const loadTimezoneSettings = () => {
    // Load from localStorage
    const savedTimezone = localStorage.getItem('user-timezone') || 'Asia/Shanghai';
    
    setTimezoneSettings({
      timezone: savedTimezone
    });
    
    timezoneForm.setFieldsValue({
      timezone: savedTimezone
    });
  };

  const loadNotificationPreferences = async () => {
    try {
      setNotificationLoading(true);
      const data = await userApi.getNotificationPreferences();
      setNotificationSettings(data.preferences);
    } catch (error: any) {
      console.error('Failed to load notification preferences:', error);
      message.error('加载通知设置失败');
    } finally {
      setNotificationLoading(false);
    }
  };

  const handleChangePassword = async (values: any) => {
    try {
      setLoading(true);
      setPasswordErrors({}); // Clear previous errors
      await userApi.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      message.success('密码修改成功');
      passwordForm.resetFields();
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
            // Generic password error, show on current password field
            setPasswordErrors({ currentPassword: errorMessage });
          } else {
            // Non-field specific error, still show at top
            message.error(errorMessage);
          }
        }
      } else {
        message.error('密码修改失败');
      }
      console.error('Failed to change password:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationChange = async (key: keyof NotificationPreferences, value: boolean) => {
    const newSettings = {
      ...notificationSettings,
      [key]: value,
    };

    try {
      setNotificationSettings(newSettings);
      await userApi.updateNotificationPreferences(newSettings);
      message.success('通知设置已更新');
    } catch (error: any) {
      // Revert the change if API call fails
      setNotificationSettings(notificationSettings);
      console.error('Failed to update notification preferences:', error);
      message.error('更新通知设置失败');
    }
  };

  const handleTimezoneSettingsChange = async (values: any) => {
    try {
      setTimezoneLoading(true);
      
      // Save to localStorage
      localStorage.setItem('user-timezone', values.timezone);
      
      // Update state
      setTimezoneSettings({
        timezone: values.timezone
      });
      
      message.success('时区设置已保存');
      
    } catch (error: any) {
      console.error('Failed to update timezone settings:', error);
      message.error('保存设置失败');
    } finally {
      setTimezoneLoading(false);
    }
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
            validateStatus={passwordErrors.currentPassword ? 'error' : ''}
            help={passwordErrors.currentPassword || ''}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="当前密码" 
              onChange={() => {
                if (passwordErrors.currentPassword) {
                  setPasswordErrors(prev => ({ ...prev, currentPassword: '' }));
                }
              }}
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
              onChange={() => {
                if (passwordErrors.newPassword) {
                  setPasswordErrors(prev => ({ ...prev, newPassword: '' }));
                }
              }}
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
              onChange={() => {
                if (passwordErrors.confirmPassword) {
                  setPasswordErrors(prev => ({ ...prev, confirmPassword: '' }));
                }
              }}
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
              }}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {/* 通知设置 */}
      <Card title={<Text strong style={{ fontSize: 16 }}>🔔 通知设置</Text>} style={{ marginBottom: 24 }}>
        {notificationLoading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>
              <Text type="secondary">加载通知设置中...</Text>
            </div>
          </div>
        ) : (
          <Space orientation="vertical" style={{ width: '100%' }} size="large">
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
        )}
      </Card>

      {/* 时区设置 */}
      <Card title={<Text strong style={{ fontSize: 16 }}><GlobalOutlined /> 时区设置</Text>}>
        <Form 
          form={timezoneForm}
          layout="vertical" 
          style={{ maxWidth: 600 }}
          onFinish={handleTimezoneSettingsChange}
          initialValues={timezoneSettings}
        >
          <Form.Item 
            label="时区" 
            name="timezone"
            rules={[{ required: true, message: '请选择时区' }]}
          >
            <Select>
              <Option value="Asia/Shanghai">中国标准时间 (UTC+8)</Option>
              <Option value="America/New_York">美国东部时间 (UTC-5)</Option>
              <Option value="Europe/London">英国时间 (UTC+0)</Option>
              <Option value="Asia/Tokyo">日本标准时间 (UTC+9)</Option>
              <Option value="Europe/Paris">欧洲中部时间 (UTC+1)</Option>
              <Option value="America/Los_Angeles">美国太平洋时间 (UTC-8)</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={timezoneLoading}>
                保存设置
              </Button>
              <Button onClick={() => {
                timezoneForm.resetFields();
                setTimezoneSettings({
                  timezone: 'Asia/Shanghai'
                });
              }}>
                重置
              </Button>
            </Space>
          </Form.Item>
          
          <div style={{ marginTop: 16, padding: 12, backgroundColor: '#f6f6f6', borderRadius: 6 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              💡 提示：时区设置会影响系统中所有时间的显示格式。
            </Text>
          </div>
        </Form>
      </Card>
    </div>
  );
};
