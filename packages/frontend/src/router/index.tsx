import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { DashboardPage } from '../pages/DashboardPage';
import PublishedTasksPage from '../pages/PublishedTasksPage';
import { AssignedTasksPage } from '../pages/AssignedTasksPage';
import { BrowseTasksPage } from '../pages/BrowseTasksPage';
import { GroupsPage } from '../pages/GroupsPage';
import { RankingPage } from '../pages/RankingPage';
import { NotificationPage } from '../pages/NotificationPage';
import { ProfilePage } from '../pages/ProfilePage';
import { SettingsPage } from '../pages/SettingsPage';
import { UserManagementPage } from '../pages/admin/UserManagementPage';
import { GroupManagementPage } from '../pages/admin/GroupManagementPage';
import { TaskManagementPage } from '../pages/admin/TaskManagementPage';
import { ApplicationReviewPage } from '../pages/admin/ApplicationReviewPage';
import { AvatarManagementPage } from '../pages/admin/AvatarManagementPage';
import { PositionManagementPage } from '../pages/admin/PositionManagementPage';
import { BountyAlgorithmPage } from '../pages/admin/BountyAlgorithmPage';
import { NotificationBroadcastPage } from '../pages/admin/NotificationBroadcastPage';
import { SystemConfigPage } from '../pages/admin/SystemConfigPage';
import { AuditLogPage } from '../pages/admin/AuditLogPage';
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

export const router = createBrowserRouter([
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
        <MainLayout />
      </ProtectedRoute>
    ),
    errorElement: <ErrorBoundary />,
    children: [
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'tasks/published',
        element: <PublishedTasksPage />,
      },
      {
        path: 'tasks/assigned',
        element: <AssignedTasksPage />,
      },
      {
        path: 'groups',
        element: <GroupsPage />,
      },
      {
        path: 'tasks/browse',
        element: <BrowseTasksPage />,
      },
      {
        path: 'ranking',
        element: <RankingPage />,
      },
      {
        path: 'notifications',
        element: <NotificationPage />,
      },
      {
        path: 'profile',
        element: <ProfilePage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
      {
        path: 'admin/users',
        element: <UserManagementPage />,
      },
      {
        path: 'admin/groups',
        element: <GroupManagementPage />,
      },
      {
        path: 'admin/tasks',
        element: <TaskManagementPage />,
      },
      {
        path: 'admin/approval',
        element: <ApplicationReviewPage />,
      },
      {
        path: 'admin/avatars',
        element: <AvatarManagementPage />,
      },
      {
        path: 'admin/positions',
        element: <PositionManagementPage />,
      },
      {
        path: 'admin/bounty-algorithm',
        element: <BountyAlgorithmPage />,
      },
      {
        path: 'admin/notifications',
        element: <NotificationBroadcastPage />,
      },
      {
        path: 'admin/system-config',
        element: <SystemConfigPage />,
      },
      {
        path: 'admin/audit-logs',
        element: <AuditLogPage />,
      },
    ],
  },
  {
    path: '*',
    element: <ErrorBoundary />,
  },
]);
