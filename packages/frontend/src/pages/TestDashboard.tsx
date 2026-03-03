import React from 'react';
import { Card, Typography } from 'antd';

const { Title, Text } = Typography;

export const TestDashboard: React.FC = () => {
  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Title level={2}>🎉 现代化 UI 测试页面</Title>
        <Text>如果您能看到这个页面，说明基本路由和组件加载正常！</Text>
        
        <div style={{ marginTop: '24px' }}>
          <h3>✅ 成功加载的组件：</h3>
          <ul>
            <li>React 应用</li>
            <li>路由系统</li>
            <li>Ant Design 组件</li>
            <li>现代化布局</li>
          </ul>
        </div>
        
        <div style={{ marginTop: '24px' }}>
          <h3>🎨 现代化 UI 特性：</h3>
          <ul>
            <li>Discord 风格布局</li>
            <li>玻璃态效果</li>
            <li>响应式设计</li>
            <li>流畅动画</li>
          </ul>
        </div>
        
        <div style={{ marginTop: '24px', padding: '16px', background: '#f0f0f0', borderRadius: '8px' }}>
          <Text strong>下一步：</Text>
          <br />
          <Text>访问 /ui-showcase 查看完整的现代化组件展示</Text>
        </div>
      </Card>
    </div>
  );
};