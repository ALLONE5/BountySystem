import React from 'react';

export const VerySimpleTestPage: React.FC = () => {
  return (
    <div style={{ 
      padding: '20px', 
      minHeight: '100vh', 
      background: '#f0f2f5',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ 
        maxWidth: '800px', 
        margin: '0 auto',
        background: 'white',
        padding: '30px',
        borderRadius: '10px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ color: '#1890ff', marginBottom: '20px' }}>
          🎉 超简单测试页面
        </h1>
        <p style={{ fontSize: '16px', lineHeight: '1.6' }}>
          如果你能看到这个页面，说明基础 React 应用正常工作！
        </p>
        <div style={{ marginTop: '20px' }}>
          <p>✅ React 应用正常运行</p>
          <p>✅ 路由系统正常工作</p>
          <p>✅ TypeScript 编译正常</p>
          <p>✅ 基础样式正常加载</p>
        </div>
        <div style={{ 
          marginTop: '30px', 
          padding: '15px', 
          background: '#f6ffed', 
          border: '1px solid #b7eb8f',
          borderRadius: '6px'
        }}>
          <strong>当前时间:</strong> {new Date().toLocaleString()}
        </div>
      </div>
    </div>
  );
};