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
          <ModernLayout showInfoPanel={true} />
        </ProtectedRoute>
      ),
      errorElement: <ErrorBoundary />,
      children: [
        {
          path: 'dashboard',
          element: <DashboardPage />,
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
