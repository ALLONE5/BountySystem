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
  InputNumber,
  Upload,
  Alert,
  List,
  Popconfirm,
} from 'antd';
import { SaveOutlined, UploadOutlined, SettingOutlined, DeleteOutlined } from '@ant-design/icons';
import { PageHeaderBar } from '../../components/common/PageHeaderBar';
import { systemConfigApi, SystemConfig, SystemConfigUpdate, UploadedLogo } from '../../api/systemConfig';
import { useSystemConfig } from '../../contexts/SystemConfigContext';

const { Text } = Typography;
const { TextArea } = Input;

export const SystemConfigPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [logos, setLogos] = useState<UploadedLogo[]>([]);
  const [form] = Form.useForm();
  const { refreshConfig } = useSystemConfig();

  useEffect(() => {
    loadSystemConfig();
    loadLogos();
  }, []);

  const loadSystemConfig = async () => {
    try {
      setLoading(true);
      const data = await systemConfigApi.getConfig();
      setConfig(data);
      form.setFieldsValue(data);
    } catch (error: any) {
      console.error('Failed to load system config:', error);
      message.error('加载系统配置失败');
    } finally {
      setLoading(false);
    }
  };

  const loadLogos = async () => {
    try {
      const data = await systemConfigApi.getLogos();
      setLogos(data);
    } catch (error: any) {
      console.error('Failed to load logos:', error);
    }
  };

  const handleSave = async (values: SystemConfigUpdate) => {
    try {
      setLoading(true);
      const updatedConfig = await systemConfigApi.updateConfig(values);
      setConfig(updatedConfig);
      
      // 刷新全局系统配置
      await refreshConfig();
      
      message.success('系统配置保存成功');
    } catch (error: any) {
      console.error('Failed to save system config:', error);
      message.error('保存系统配置失败');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (file: File) => {
    try {
      setUploadLoading(true);
      const result = await systemConfigApi.uploadLogo(file);
      form.setFieldValue('logoUrl', result.url);
      message.success('Logo上传成功');
      loadLogos(); // Refresh logos list
      return false; // Prevent default upload behavior
    } catch (error: any) {
      console.error('Failed to upload logo:', error);
      message.error('Logo上传失败');
      return false;
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDeleteLogo = async (filename: string) => {
    try {
      await systemConfigApi.deleteLogo(filename);
      message.success('Logo删除成功');
      loadLogos(); // Refresh logos list
      
      // If the deleted logo is currently selected, clear the form field
      const currentLogoUrl = form.getFieldValue('logoUrl');
      if (currentLogoUrl && currentLogoUrl.includes(filename)) {
        form.setFieldValue('logoUrl', '');
      }
    } catch (error: any) {
      console.error('Failed to delete logo:', error);
      message.error('Logo删除失败');
    }
  };

  const selectLogo = (logoUrl: string) => {
    form.setFieldValue('logoUrl', logoUrl);
    message.success('Logo已选择');
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
        initialValues={config || undefined}
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
                beforeUpload={handleLogoUpload}
                showUploadList={false}
                accept="image/*"
              >
                <Button icon={<UploadOutlined />} loading={uploadLoading}>
                  上传Logo
                </Button>
              </Upload>
              
              {/* Logo Gallery */}
              {logos.length > 0 && (
                <Card size="small" title="已上传的Logo" style={{ marginTop: 16 }}>
                  <List
                    grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4 }}
                    dataSource={logos}
                    renderItem={(logo) => (
                      <List.Item>
                        <Card
                          size="small"
                          hoverable
                          cover={
                            <img
                              alt={logo.filename}
                              src={logo.url.startsWith('http') ? logo.url : `http://localhost:3000${logo.url}`}
                              style={{ height: 80, objectFit: 'contain', padding: 8 }}
                              onError={(e) => {
                                console.error('Logo failed to load:', logo.url);
                                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik0yMCAyMEMyMiAyMCAyNCAyMiAyNCAyNEMyNCAyNiAyMiAyOCAyMCAyOEMxOCAyOCAxNiAyNiAxNiAyNEMxNiAyMiAxOCAyMCAyMCAyMFoiIGZpbGw9IiNEOUQ5RDkiLz4KPC9zdmc+';
                              }}
                            />
                          }
                          actions={[
                            <Button
                              type="link"
                              size="small"
                              onClick={() => selectLogo(logo.url)}
                            >
                              选择
                            </Button>,
                            <Popconfirm
                              title="确定删除这个Logo吗？"
                              onConfirm={() => handleDeleteLogo(logo.filename)}
                              okText="确定"
                              cancelText="取消"
                            >
                              <Button
                                type="link"
                                size="small"
                                danger
                                icon={<DeleteOutlined />}
                              />
                            </Popconfirm>,
                          ]}
                        >
                          <Card.Meta
                            description={
                              <div>
                                <div style={{ fontSize: 12, color: '#666' }}>
                                  {(logo.size / 1024).toFixed(1)} KB
                                </div>
                              </div>
                            }
                          />
                        </Card>
                      </List.Item>
                    )}
                  />
                </Card>
              )}
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
            name="debugMode"
            label="调试模式"
            valuePropName="checked"
            extra="开启后，右上角会显示系统配置调试信息"
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