import { createBrowserRouter, Navigate } from 'react-router-dom';
import { TestDashboard } from '../pages/TestDashboard';
import { UIShowcasePage } from '../pages/UIShowcasePage';
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

// 简化的布局组件
const SimpleLayout = ({ children }: { children: React.ReactNode }) => (
  <div style={{ 
    minHeight: '100vh', 
    background: 'linear-gradient(135deg, #2f3136 0%, #36393f 50%, #40444b 100%)',
    padding: '20px'
  }}>
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      background: 'rgba(255, 255, 255, 0.1)',
      borderRadius: '16px',
      padding: '24px',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
    }}>
      {children}
    </div>
  </div>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/dashboard',
    element: (
      <SimpleLayout>
        <TestDashboard />
      </SimpleLayout>
    ),
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/ui-showcase',
    element: (
      <SimpleLayout>
        <UIShowcasePage />
      </SimpleLayout>
    ),
    errorElement: <ErrorBoundary />,
  },
  {
    path: '*',
    element: <ErrorBoundary />,
  },
], {
  future: {
    v7_relativeSplatPath: true,
  },
});