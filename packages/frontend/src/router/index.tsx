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
import { ProtectedRoute } from '../components/ProtectedRoute';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '/auth',
    element: <AuthLayout />,
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
    ],
  },
]);
