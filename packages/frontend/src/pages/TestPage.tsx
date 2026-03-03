import React from 'react';
import { Card, Typography, Button, Space, Alert } from 'antd';

const { Title, Text } = Typography;

export const TestPage: React.FC = () => {
  return (
    <div style={{ padding: '20px', minHeight: '100vh', background: '#f0f2f5' }}>
      <Card style={{ maxWidth: 800, margin: '0 auto' }}>
        <Title level={2}>🎉 测试页面</Title>
        <Text>
          如果你能看到这个页面，说明路由系统工作正常！
        </Text>
        <div style={{ marginTop: '20px' }}>
          <p>✅ React 应用正常运行</p>
          <p>✅ 路由系统正常工作</p>
          <p>✅ Ant Design 组件正常加载</p>
          <p>✅ TypeScript 编译正常</p>
        </div>
        
        <Alert
          message="测试账号信息"
          description={
            <div>
              <p>可以使用以下测试账号登录：</p>
              <ul>
                <li><strong>admin</strong> / Password123</li>
                <li><strong>developer1</strong> / Password123</li>
                <li><strong>developer2</strong> / Password123</li>
                <li><strong>designer1</strong> / Password123</li>
                <li><strong>manager1</strong> / Password123</li>
              </ul>
            </div>
          }
          type="info"
          style={{ marginTop: '20px' }}
        />
        
        <div style={{ marginTop: '30px' }}>
          <Title level={4}>测试导航</Title>
          <Space orientation="vertical" style={{ width: '100%' }}>
            <Button 
              type="primary" 
              onClick={() => window.location.href = '/auth/login'}
              block
            >
              测试登录页面
            </Button>
            <Button 
              onClick={() => window.location.href = '/dashboard'}
              block
            >
              进入完整应用 (需要登录)
            </Button>
          </Space>
        </div>
      </Card>
    </div>
  );
};