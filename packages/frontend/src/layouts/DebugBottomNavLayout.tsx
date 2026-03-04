import React, { useEffect, useMemo, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Button, Avatar, Dropdown, Space, Badge } from 'antd';

const { Header, Content } = Layout;

export const DebugBottomNavLayout: React.FC = () => {
  console.log('🔍 DebugBottomNavLayout - Step 1: Basic structure');
  
  const navigate = useNavigate();
  const location = useLocation();

  // Step 1: 基本结构 - 只使用基本的 React hooks
  try {
    console.log('✅ Step 1: Basic hooks work');
  } catch (error) {
    console.error('❌ Step 1 failed:', error);
    return <div>Step 1 failed: Basic hooks</div>;
  }

  // Step 2: 尝试使用 useAuthStore
  let authStoreData;
  try {
    const { useAuthStore } = require('../store/authStore');
    authStoreData = useAuthStore();
    console.log('✅ Step 2: useAuthStore works', authStoreData);
  } catch (error) {
    console.error('❌ Step 2 failed: useAuthStore', error);
    return <div>Step 2 failed: useAuthStore - {error.message}</div>;
  }

  // Step 3: 尝试使用 usePermission
  let permissionData;
  try {
    const { usePermission } = require('../hooks/usePermission');
    permissionData = usePermission();
    console.log('✅ Step 3: usePermission works', permissionData);
  } catch (error) {
    console.error('❌ Step 3 failed: usePermission', error);
    return <div>Step 3 failed: usePermission - {error.message}</div>;
  }

  // Step 4: 尝试使用 useNotificationContext
  let notificationData;
  try {
    const { useNotificationContext } = require('../contexts/NotificationContext');
    notificationData = useNotificationContext();
    console.log('✅ Step 4: useNotificationContext works', notificationData);
  } catch (error) {
    console.error('❌ Step 4 failed: useNotificationContext', error);
    return <div>Step 4 failed: useNotificationContext - {error.message}</div>;
  }

  // Step 5: 尝试使用 useSystemConfig
  let systemConfigData;
  try {
    const { useSystemConfig } = require('../contexts/SystemConfigContext');
    systemConfigData = useSystemConfig();
    console.log('✅ Step 5: useSystemConfig works', systemConfigData);
  } catch (error) {
    console.error('❌ Step 5 failed: useSystemConfig', error);
    return <div>Step 5 failed: useSystemConfig - {error.message}</div>;
  }

  // Step 6: 尝试使用 useTheme
  let themeData;
  try {
    const { useTheme } = require('../contexts/ThemeContext');
    themeData = useTheme();
    console.log('✅ Step 6: useTheme works', themeData);
  } catch (error) {
    console.error('❌ Step 6 failed: useTheme', error);
    return <div>Step 6 failed: useTheme - {error.message}</div>;
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 调试信息横幅 */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: '#52c41a',
        color: 'white',
        textAlign: 'center',
        padding: '10px',
        fontSize: '14px',
        fontWeight: 'bold',
        zIndex: 99999
      }}>
        🔍 DebugBottomNavLayout - 所有依赖项检查通过！
      </div>
      
      <Header style={{ 
        background: '#001529', 
        color: 'white', 
        display: 'flex', 
        alignItems: 'center',
        marginTop: '50px' // 为调试横幅留空间
      }}>
        <div>调试版本 - 用户: {authStoreData?.user?.username || '未登录'}</div>
      </Header>
      
      <Content style={{ padding: '24px' }}>
        <div style={{
          background: 'white',
          padding: '24px',
          borderRadius: '8px',
          marginBottom: '100px'
        }}>
          <h2>依赖项检查结果:</h2>
          <ul>
            <li>✅ useAuthStore: {authStoreData ? '正常' : '异常'}</li>
            <li>✅ usePermission: {permissionData ? '正常' : '异常'}</li>
            <li>✅ useNotificationContext: {notificationData ? '正常' : '异常'}</li>
            <li>✅ useSystemConfig: {systemConfigData ? '正常' : '异常'}</li>
            <li>✅ useTheme: {themeData ? '正常' : '异常'}</li>
          </ul>
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
        fontSize: '16px'
      }}>
        🔍 调试版本 - 所有 hooks 正常工作
      </div>
    </Layout>
  );
};