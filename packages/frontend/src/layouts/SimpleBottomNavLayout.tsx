import React from 'react';
import { Outlet } from 'react-router-dom';
import { Layout } from 'antd';

const { Content } = Layout;

export const SimpleBottomNavLayout: React.FC = () => {
  console.log('🔥 SimpleBottomNavLayout is rendering!');
  
  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      {/* 临时调试横幅 */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: '#52c41a',
        color: 'white',
        textAlign: 'center',
        padding: '10px',
        fontSize: '16px',
        fontWeight: 'bold',
        zIndex: 99999
      }}>
        ✅ SimpleBottomNavLayout 正在工作！
      </div>
      
      <Content style={{ padding: '60px 24px 24px' }}>
        <div style={{
          background: 'white',
          padding: '24px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <Outlet />
        </div>
      </Content>
      
      {/* 简单的底部导航 */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '60px',
        backgroundColor: '#1890ff',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '16px',
        fontWeight: 'bold'
      }}>
        🎯 简化版底部导航 - 测试成功！
      </div>
    </Layout>
  );
};