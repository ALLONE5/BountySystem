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
  InputNumber,
  Upload,
  Alert,
} from 'antd';
import { SaveOutlined, UploadOutlined, SettingOutlined } from '@ant-design/icons';
import { PageHeaderBar } from '../../components/common/PageHeaderBar';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface SystemConfig {
  siteName: string;
  siteDescription: string;
  logoUrl: string;
  allowRegistration: boolean;
  maintenanceMode: boolean;
  maxFileSize: number; // MB
  defaultUserRole: string;
  emailEnabled: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  smtpSecure: boolean;
}

export const SystemConfigPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<SystemConfig>({
    siteName: '赏金猎人平台',
    siteDescription: '基于任务的协作平台',
    logoUrl: '',
    allowRegistration: true,
    maintenanceMode: false,
    maxFileSize: 10,
    defaultUserRole: 'user',
    emailEnabled: false,
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPassword: '',
    smtpSecure: true,
  });
  const [form] = Form.useForm();

  useEffect(() => {
    loadSystemConfig();
  }, []);

  const loadSystemConfig = async () => {
    try {
      setLoading(true);
      // TODO: Implement API call to load system config
      // const data = await systemApi.getConfig();
      // setConfig(data);
      form.setFieldsValue(config);
    } catch (error: any) {
      console.error('Failed to load system config:', error);
      message.error('加载系统配置失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (values: SystemConfig) => {
    try {
      setLoading(true);
      // TODO: Implement API call to save system config
      // await systemApi.updateConfig(values);
      setConfig(values);
      message.success('系统配置保存成功');
    } catch (error: any) {
      console.error('Failed to save system config:', error);
      message.error('保存系统配置失败');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = (info: any) => {
    if (info.file.status === 'done') {
      const logoUrl = info.file.response?.url || '';
      form.setFieldValue('logoUrl', logoUrl);
      message.success('Logo上传成功');
    } else if (info.file.status === 'error') {
      message.error('Logo上传失败');
    }
  };

  return (
    <div>
      <PageHeaderBar title="系统配置" />

      <Alert
        message="系统配置说明"
        description="修改系统配置可能会影响所有用户的使用体验，请谨慎操作。某些配置项修改后需要重启服务才能生效。"
        type="warning"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSave}
        initialValues={config}
      >
        {/* 基础设置 */}
        <Card title={<Text strong><SettingOutlined /> 基础设置</Text>} style={{ marginBottom: 24 }}>
          <Form.Item
            name="siteName"
            label="网站名称"
            rules={[{ required: true, message: '请输入网站名称' }]}
          >
            <Input placeholder="赏金猎人平台" />
          </Form.Item>

          <Form.Item
            name="siteDescription"
            label="网站描述"
          >
            <TextArea rows={3} placeholder="基于任务的协作平台" />
          </Form.Item>

          <Form.Item
            name="logoUrl"
            label="网站Logo"
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Input placeholder="Logo URL" />
              <Upload
                name="logo"
                action="/api/upload/logo"
                onChange={handleLogoUpload}
                showUploadList={false}
              >
                <Button icon={<UploadOutlined />}>上传Logo</Button>
              </Upload>
            </Space>
          </Form.Item>
        </Card>

        {/* 用户设置 */}
        <Card title={<Text strong>👥 用户设置</Text>} style={{ marginBottom: 24 }}>
          <Form.Item
            name="allowRegistration"
            label="允许用户注册"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name="defaultUserRole"
            label="默认用户角色"
            rules={[{ required: true, message: '请选择默认用户角色' }]}
          >
            <Input placeholder="user" disabled />
          </Form.Item>
        </Card>

        {/* 系统设置 */}
        <Card title={<Text strong>⚙️ 系统设置</Text>} style={{ marginBottom: 24 }}>
          <Form.Item
            name="maintenanceMode"
            label="维护模式"
            valuePropName="checked"
            extra="开启后，只有管理员可以访问系统"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name="maxFileSize"
            label="最大文件上传大小 (MB)"
            rules={[{ required: true, message: '请输入最大文件大小' }]}
          >
            <InputNumber min={1} max={100} style={{ width: '100%' }} />
          </Form.Item>
        </Card>

        {/* 邮件设置 */}
        <Card title={<Text strong>📧 邮件设置</Text>} style={{ marginBottom: 24 }}>
          <Form.Item
            name="emailEnabled"
            label="启用邮件服务"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.emailEnabled !== currentValues.emailEnabled}
          >
            {({ getFieldValue }) =>
              getFieldValue('emailEnabled') ? (
                <>
                  <Form.Item
                    name="smtpHost"
                    label="SMTP服务器"
                    rules={[{ required: true, message: '请输入SMTP服务器地址' }]}
                  >
                    <Input placeholder="smtp.example.com" />
                  </Form.Item>

                  <Form.Item
                    name="smtpPort"
                    label="SMTP端口"
                    rules={[{ required: true, message: '请输入SMTP端口' }]}
                  >
                    <InputNumber min={1} max={65535} style={{ width: '100%' }} />
                  </Form.Item>

                  <Form.Item
                    name="smtpUser"
                    label="SMTP用户名"
                    rules={[{ required: true, message: '请输入SMTP用户名' }]}
                  >
                    <Input placeholder="user@example.com" />
                  </Form.Item>

                  <Form.Item
                    name="smtpPassword"
                    label="SMTP密码"
                    rules={[{ required: true, message: '请输入SMTP密码' }]}
                  >
                    <Input.Password placeholder="SMTP密码" />
                  </Form.Item>

                  <Form.Item
                    name="smtpSecure"
                    label="使用SSL/TLS"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </>
              ) : null
            }
          </Form.Item>
        </Card>

        <Card>
          <Space>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={loading}
              size="large"
            >
              保存配置
            </Button>
            <Button
              onClick={() => form.resetFields()}
              size="large"
            >
              重置
            </Button>
          </Space>
        </Card>
      </Form>
    </div>
  );
};