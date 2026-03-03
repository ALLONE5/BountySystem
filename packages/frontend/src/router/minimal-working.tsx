import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ModernLayout } from '../layouts/ModernLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { DashboardPage } from '../pages/DashboardPage';
import { UIShowcasePage } from '../pages/UIShowcasePage';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Result, Button } from 'antd';

const ErrorBoundary = () => (
  <Result
    status="404"
    title="404"
    subTitle="抱歉，您访问的页面不存在。"
    extra={
      <Button type="primary" onClick={() => window.location.href = '/dashboard'}>
        返回首页
      </Button>
    }
  />
);

// 简单的测试页面组件
const TestDashboard = () => (
  <div style={{ padding: '20px', color: 'white' }}>
    <h1>🎉 现代化 UI 测试成功！</h1>
    <p>如果您能看到这个页面，说明路由已经正常工作了。</p>
    <div style={{ marginTop: '20px' }}>
      <a href="/ui-showcase" style={{ color: '#5865f2', textDecoration: 'none' }}>
        → 查看 UI 展示页面
      </a>
    </div>
  </div>
);

export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <Navigate to="/dashboard" replace />,
      errorElement: <ErrorBoundary />,
    },
    {
      path: '/auth',
      element: <AuthLayout />,
      errorElement: <ErrorBoundary />,
      children: [
        {
          path: 'login',
          element: <LoginPage />,
        },
        {
          path: 'register',
          element: <RegisterPage />,
        },
      ],
    },
    {
      path: '/',
      element: (
        <ProtectedRoute>
          <ModernLayout showInfoPanel={false} />
        </ProtectedRoute>
      ),
      errorElement: <ErrorBoundary />,
      children: [
        {
          path: 'dashboard',
          element: <TestDashboard />,
        },
        {
          path: 'ui-showcase',
          element: <UIShowcasePage />,
        },
      ],
    },
    {
      path: '*',
      element: <ErrorBoundary />,
    },
  ],
  {
    future: {
      v7_relativeSplatPath: true,
    },
  }
);