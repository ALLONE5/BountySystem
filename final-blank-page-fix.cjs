#!/usr/bin/env node

/**
 * 最终空白页面修复脚本
 * 确保所有组件都能正常工作
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 最终空白页面修复...\n');

// 检查关键文件是否存在
function checkCriticalFiles() {
    console.log('📋 检查关键文件:');
    console.log('─'.repeat(50));
    
    const criticalFiles = [
        'packages/frontend/src/App.tsx',
        'packages/frontend/src/router/minimal-working.tsx',
        'packages/frontend/src/layouts/ModernLayout.tsx',
        'packages/frontend/src/layouts/AuthLayout.tsx',
        'packages/frontend/src/pages/auth/LoginPage.tsx',
        'packages/frontend/src/pages/DashboardPage.tsx',
        'packages/frontend/src/pages/UIShowcasePage.tsx',
        'packages/frontend/src/components/ProtectedRoute.tsx',
        'packages/frontend/src/styles/glassmorphism.css'
    ];
    
    let allExist = true;
    
    criticalFiles.forEach(filePath => {
        const fullPath = path.join(__dirname, filePath);
        const exists = fs.existsSync(fullPath);
        console.log(`${exists ? '✅' : '❌'} ${filePath}`);
        if (!exists) allExist = false;
    });
    
    return allExist;
}

// 创建缺失的基础组件
function createMissingComponents() {
    console.log('\n🔧 创建缺失的基础组件:');
    console.log('─'.repeat(50));
    
    // 检查并创建 AuthLayout
    const authLayoutPath = path.join(__dirname, 'packages/frontend/src/layouts/AuthLayout.tsx');
    if (!fs.existsSync(authLayoutPath)) {
        const authLayoutContent = `import React from 'react';
import { Outlet } from 'react-router-dom';
import { Layout } from 'antd';

const { Content } = Layout;

export const AuthLayout: React.FC = () => {
  return (
    <Layout style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}>
      <Content style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.1)', 
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          padding: '40px',
          minWidth: '400px'
        }}>
          <Outlet />
        </div>
      </Content>
    </Layout>
  );
};`;
        fs.writeFileSync(authLayoutPath, authLayoutContent);
        console.log('✅ 创建 AuthLayout.tsx');
    }
    
    // 检查并创建 LoginPage
    const loginPagePath = path.join(__dirname, 'packages/frontend/src/pages/auth/LoginPage.tsx');
    if (!fs.existsSync(loginPagePath)) {
        // 确保目录存在
        const authDir = path.dirname(loginPagePath);
        if (!fs.existsSync(authDir)) {
            fs.mkdirSync(authDir, { recursive: true });
        }
        
        const loginPageContent = `import React from 'react';
import { Form, Input, Button, Card } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';

export const LoginPage: React.FC = () => {
  const onFinish = (values: any) => {
    console.log('Login:', values);
    // 简单的登录逻辑 - 直接跳转到主页
    window.location.href = '/dashboard';
  };

  return (
    <Card title="登录" style={{ background: 'rgba(255, 255, 255, 0.1)', border: 'none' }}>
      <Form onFinish={onFinish} autoComplete="off">
        <Form.Item
          name="username"
          rules={[{ required: true, message: '请输入用户名!' }]}
        >
          <Input prefix={<UserOutlined />} placeholder="用户名" />
        </Form.Item>
        <Form.Item
          name="password"
          rules={[{ required: true, message: '请输入密码!' }]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="密码" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" style={{ width: '100%' }}>
            登录
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};`;
        fs.writeFileSync(loginPagePath, loginPageContent);
        console.log('✅ 创建 LoginPage.tsx');
    }
    
    // 检查并创建 RegisterPage
    const registerPagePath = path.join(__dirname, 'packages/frontend/src/pages/auth/RegisterPage.tsx');
    if (!fs.existsSync(registerPagePath)) {
        const registerPageContent = `import React from 'react';
import { Form, Input, Button, Card } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';

export const RegisterPage: React.FC = () => {
  const onFinish = (values: any) => {
    console.log('Register:', values);
    // 简单的注册逻辑 - 直接跳转到登录页
    window.location.href = '/auth/login';
  };

  return (
    <Card title="注册" style={{ background: 'rgba(255, 255, 255, 0.1)', border: 'none' }}>
      <Form onFinish={onFinish} autoComplete="off">
        <Form.Item
          name="username"
          rules={[{ required: true, message: '请输入用户名!' }]}
        >
          <Input prefix={<UserOutlined />} placeholder="用户名" />
        </Form.Item>
        <Form.Item
          name="email"
          rules={[{ required: true, message: '请输入邮箱!' }]}
        >
          <Input prefix={<MailOutlined />} placeholder="邮箱" />
        </Form.Item>
        <Form.Item
          name="password"
          rules={[{ required: true, message: '请输入密码!' }]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="密码" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" style={{ width: '100%' }}>
            注册
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};`;
        fs.writeFileSync(registerPagePath, registerPageContent);
        console.log('✅ 创建 RegisterPage.tsx');
    }
    
    // 检查并创建 DashboardPage
    const dashboardPagePath = path.join(__dirname, 'packages/frontend/src/pages/DashboardPage.tsx');
    if (!fs.existsSync(dashboardPagePath)) {
        const dashboardPageContent = `import React from 'react';
import { Card, Button, Row, Col } from 'antd';

export const DashboardPage: React.FC = () => {
  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ color: 'white', marginBottom: '30px', textAlign: 'center' }}>
        🎉 现代化 UI 成功运行！
      </h1>
      
      <Row gutter={[24, 24]}>
        <Col xs={24} md={12}>
          <Card className="glass-card" title="欢迎使用" hoverable>
            <p>恭喜！您的现代化界面已经成功运行。</p>
            <p>这是一个具有 Discord 和 Midjourney 风格的现代化界面。</p>
          </Card>
        </Col>
        
        <Col xs={24} md={12}>
          <Card className="glass-card" title="功能展示" hoverable>
            <p>点击下方按钮查看完整的 UI 组件展示：</p>
            <Button 
              className="discord-button-primary" 
              onClick={() => window.location.href = '/ui-showcase'}
            >
              查看 UI 展示
            </Button>
          </Card>
        </Col>
      </Row>
      
      <div style={{ marginTop: '40px', textAlign: 'center' }}>
        <h2 style={{ color: 'rgba(255, 255, 255, 0.8)' }}>特性展示</h2>
        <Row gutter={[16, 16]} style={{ marginTop: '20px' }}>
          <Col xs={24} sm={8}>
            <div className="glass-card" style={{ padding: '20px', textAlign: 'center' }}>
              <h3 style={{ color: '#5865f2' }}>🌑 深色主题</h3>
              <p style={{ color: 'rgba(255, 255, 255, 0.8)' }}>优雅的深色背景</p>
            </div>
          </Col>
          <Col xs={24} sm={8}>
            <div className="glass-card" style={{ padding: '20px', textAlign: 'center' }}>
              <h3 style={{ color: '#57f287' }}>💎 玻璃态效果</h3>
              <p style={{ color: 'rgba(255, 255, 255, 0.8)' }}>半透明模糊背景</p>
            </div>
          </Col>
          <Col xs={24} sm={8}>
            <div className="glass-card" style