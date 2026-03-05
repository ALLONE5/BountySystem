import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ModernLayout } from '../layouts/ModernLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';

// 原有页面
import { DashboardPage } from '../pages/DashboardPage';
import { BrowseTasksPage } from '../pages/BrowseTasksPage';
import { RankingPage } from '../pages/RankingPage';
import { TaskListPage } from '../pages/TaskListPage';
import { CalendarPage } from '../pages/CalendarPage';
import { KanbanPage } from '../pages/KanbanPage';
import { GanttChartPage } from '../pages/GanttChartPage';
import { TaskVisualizationPage } from '../pages/TaskVisualizationPage';

// 其他页面
import { PublishedTasksPage } from '../pages/PublishedTasksPage';
import { AssignedTasksPage } from '../pages/AssignedTasksPage';
import { GroupsPage } from '../pages/GroupsPage';
import { NotificationPage } from '../pages/NotificationPage';
import { ProfilePage } from '../pages/ProfilePage';
import { SettingsPage } from '../pages/SettingsPage';
import { MyPage } from '../pages/MyPage';
import { AdminPage } from '../pages/AdminPage';
import { TaskInvitationsPage } from '../pages/TaskInvitationsPage';

// 管理页面
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage';
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

// 开发者页面
import { DevAuditLogPage } from '../pages/developer/DevAuditLogPage';
import { DevSystemMonitorPage } from '../pages/developer/DevSystemMonitorPage';
import { DevSystemConfigPage } from '../pages/developer/DevSystemConfigPage';

// 组件
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
          <ModernLayout />
        </ProtectedRoute>
      ),
      errorElement: <ErrorBoundary />,
      children: [
        // 默认仪表板
        {
          path: 'dashboard',
          element: <DashboardPage />,
        },
        
        // 我的工作台
        {
          path: 'my',
          element: <MyPage />,
        },
        {
          path: 'my/bounties',
          element: <PublishedTasksPage />,
        },
        {
          path: 'my/tasks',
          element: <AssignedTasksPage />,
        },
        {
          path: 'my/groups',
          element: <GroupsPage />,
        },
        
        // 任务市场
        {
          path: 'bounty-tasks',
          element: <BrowseTasksPage />,
        },
        
        // 任务相关页面
        {
          path: 'tasks/published',
          element: <PublishedTasksPage />,
        },
        {
          path: 'tasks/assigned',
          element: <AssignedTasksPage />,
        },
        {
          path: 'tasks/list',
          element: <TaskListPage />,
        },
        {
          path: 'tasks/browse',
          element: <BrowseTasksPage />,
        },
        {
          path: 'tasks/invitations',
          element: <TaskInvitationsPage />,
        },
        
        // 任务视图页面
        {
          path: 'tasks/calendar',
          element: <CalendarPage />,
        },
        {
          path: 'tasks/kanban',
          element: <KanbanPage />,
        },
        {
          path: 'tasks/gantt',
          element: <GanttChartPage />,
        },
        {
          path: 'tasks/visualization',
          element: <TaskVisualizationPage />,
        },
        
        // 项目组
        {
          path: 'groups',
          element: <GroupsPage />,
        },
        
        // 排行榜
        {
          path: 'ranking',
          element: <RankingPage />,
        },
        
        // 通知
        {
          path: 'notifications',
          element: <NotificationPage />,
        },
        
        // 个人页面
        {
          path: 'profile',
          element: <ProfilePage />,
        },
        {
          path: 'settings',
          element: <SettingsPage />,
        },
        
        // 管理中心
        {
          path: 'admin',
          element: <AdminPage />,
        },
        {
          path: 'admin/dashboard',
          element: <AdminDashboardPage />,
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
        
        // 开发者页面
        {
          path: 'dev/audit-logs',
          element: <DevAuditLogPage />,
        },
        {
          path: 'dev/system-monitor',
          element: <DevSystemMonitorPage />,
        },
        {
          path: 'dev/system-config',
          element: <DevSystemConfigPage />,
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