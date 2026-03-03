import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { TestPage } from '../pages/TestPage';
import { SimpleAuthLayout } from '../layouts/SimpleAuthLayout';
import { SimpleLoginPage } from '../pages/auth/SimpleLoginPage';
import { VerySimpleDashboardPage } from '../pages/VerySimpleDashboardPage';
import { SimpleBottomNavLayout } from '../layouts/SimpleBottomNavLayout';
import { SimpleTasksPage } from '../pages/SimpleTasksPage';
import { SimpleRankingPage } from '../pages/SimpleRankingPage';
import { SimpleProfilePage } from '../pages/SimpleProfilePage';
import { SimpleSettingsPage } from '../pages/SimpleSettingsPage';

// 创建一个简单的受保护路由组件
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    // 如果没有token，重定向到登录页
    window.location.href = '/auth/login';
    return null;
  }
  
  return <>{children}</>;
};

export const enhancedRouter = createBrowserRouter([
  {
    path: '/',
    element: <TestPage />,
  },
  {
    path: '/test',
    element: <TestPage />,
  },
  {
    path: '/auth/login',
    element: <SimpleAuthLayout />,
    children: [
      {
        path: '',
        element: <SimpleLoginPage />,
      },
    ],
  },
  // 受保护的路由，使用底部导航布局
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <SimpleBottomNavLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: 'dashboard',
        element: <VerySimpleDashboardPage />,
      },
      {
        path: 'tasks',
        element: <SimpleTasksPage />,
      },
      {
        path: 'ranking',
        element: <SimpleRankingPage />,
      },
      {
        path: 'profile',
        element: <SimpleProfilePage />,
      },
      {
        path: 'settings',
        element: <SimpleSettingsPage />,
      },
    ],
  },
  {
    path: '*',
    element: <TestPage />,
  },
]);