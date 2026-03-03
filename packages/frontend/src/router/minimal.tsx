import { createBrowserRouter } from 'react-router-dom';
import { TestPage } from '../pages/TestPage';
import { SimpleAuthLayout } from '../layouts/SimpleAuthLayout';
import { SimpleLoginPage } from '../pages/auth/SimpleLoginPage';
import { VerySimpleDashboardPage } from '../pages/VerySimpleDashboardPage';

export const minimalRouter = createBrowserRouter([
  {
    path: '/',
    element: <TestPage />,
  },
  {
    path: '/test',
    element: <TestPage />,
  },
  {
    path: '/dashboard',
    element: <VerySimpleDashboardPage />,
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
  {
    path: '*',
    element: <TestPage />,
  },
]);