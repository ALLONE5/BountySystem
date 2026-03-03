import React from 'react';
import { Outlet } from 'react-router-dom';
import { Layout } from 'antd';

const { Content } = Layout;

export const SimpleAuthLayout: React.FC = () => {
  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Content
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '400px',
            background: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            padding: '32px',
          }}
        >
          <Outlet />
        </div>
      </Content>
    </Layout>
  );
};