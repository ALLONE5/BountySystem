import React from 'react';
import { Card, Typography, List, Switch, Button, Space, Divider } from 'antd';
import { 
  BellOutlined, 
  EyeOutlined, 
  MoonOutlined, 
  GlobalOutlined,
  SafetyOutlined 
} from '@ant-design/icons';
import { useSimpleTheme } from '../contexts/SimpleThemeContext';
import { useSystemConfig } from '../contexts/SystemConfigContext';

const { Title, Text } = Typography;

export const SimpleSettingsPage: React.FC = () => {
  const { theme, setTheme } = useSimpleTheme();
  const { config: systemConfig } = useSystemConfig();

  const settingsItems = [
    {
      title: '通知设置',
      icon: <BellOutlined />,
      description: '管理推送通知',
      action: <Switch defaultChecked />,
    },
    {
      title: '隐私设置',
      icon: <EyeOutlined />,
      description: '控制信息可见性',
      action: <Switch />,
    },
    {
      title: '安全设置',
      icon: <SafetyOutlined />,
      description: '账户安全选项',
      action: <Button size="small">设置</Button>,
    },
    {
      title: '语言设置',
      icon: <GlobalOutlined />,
      description: '选择界面语言',
      action: <Button size="small">中文</Button>,
    },
  ];

  return (
    <div style={{ padding: '20px', minHeight: '100vh', background: '#f0f2f5' }}>
      <Card>
        <Title level={2}>⚙️ 设置</Title>
        <Text type="secondary">个性化您的应用体验</Text>

        <Divider>主题设置</Divider>
        <div style={{ marginBottom: '24px' }}>
          <Space>
            <MoonOutlined />
            <Text>当前主题: {theme}</Text>
          </Space>
          <div style={{ marginTop: '12px' }}>
            <Space>
              <Button 
                type={theme === 'light' ? 'primary' : 'default'}
                onClick={() => setTheme('light')}
                size="small"
              >
                浅色
              </Button>
              <Button 
                type={theme === 'dark' ? 'primary' : 'default'}
                onClick={() => setTheme('dark')}
                size="small"
              >
                深色
              </Button>
              <Button 
                type={theme === 'cyberpunk' ? 'primary' : 'default'}
                onClick={() => setTheme('cyberpunk')}
                size="small"
              >
                赛博朋克
              </Button>
            </Space>
          </div>
        </div>

        <Divider>应用设置</Divider>
        <List
          dataSource={settingsItems}
          renderItem={(item) => (
            <List.Item actions={[item.action]}>
              <List.Item.Meta
                avatar={item.icon}
                title={item.title}
                description={item.description}
              />
            </List.Item>
          )}
        />

        <Divider />
        <div style={{ textAlign: 'center' }}>
          <Space orientation="vertical">
            <Text type="secondary">{systemConfig?.siteName || '赏金平台'} v1.0.0</Text>
            <Button type="link" size="small">关于我们</Button>
          </Space>
        </div>
      </Card>
    </div>
  );
};