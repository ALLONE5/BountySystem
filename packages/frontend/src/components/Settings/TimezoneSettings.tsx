import React, { useState, useEffect } from 'react';
import { Card, Form, Select, Button, Space, Typography } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';
import { useErrorHandler } from '../../hooks/useErrorHandler';

const { Text } = Typography;
const { Option } = Select;

interface TimezoneSettingsProps {
  onSuccess?: () => void;
}

export const TimezoneSettings: React.FC<TimezoneSettingsProps> = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [timezoneForm] = Form.useForm();
  const { handleAsyncError } = useErrorHandler();
  const [timezoneSettings, setTimezoneSettings] = useState({
    timezone: 'Asia/Shanghai'
  });

  useEffect(() => {
    loadTimezoneSettings();
  }, []);

  const loadTimezoneSettings = () => {
    const savedTimezone = localStorage.getItem('user-timezone') || 'Asia/Shanghai';
    
    setTimezoneSettings({
      timezone: savedTimezone
    });
    
    timezoneForm.setFieldsValue({
      timezone: savedTimezone
    });
  };

  const handleTimezoneSettingsChange = async (values: any) => {
    try {
      setLoading(true);
      
      // Save to localStorage
      localStorage.setItem('user-timezone', values.timezone);
      
      // Update state
      setTimezoneSettings({
        timezone: values.timezone
      });
      
      await handleAsyncError(
        () => Promise.resolve(), // No API call needed, just localStorage
        'TimezoneSettings.updateTimezone',
        '时区设置已保存',
        '保存设置失败'
      );
      
      onSuccess?.();
    } catch (error) {
      console.error('Failed to update timezone settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const timezoneOptions = [
    { value: 'Asia/Shanghai', label: '中国标准时间 (UTC+8)' },
    { value: 'America/New_York', label: '美国东部时间 (UTC-5)' },
    { value: 'Europe/London', label: '英国时间 (UTC+0)' },
    { value: 'Asia/Tokyo', label: '日本标准时间 (UTC+9)' },
    { value: 'Europe/Paris', label: '欧洲中部时间 (UTC+1)' },
    { value: 'America/Los_Angeles', label: '美国太平洋时间 (UTC-8)' }
  ];

  return (
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
            {timezoneOptions.map(option => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>
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
  );
};