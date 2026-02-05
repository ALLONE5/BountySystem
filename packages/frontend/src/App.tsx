import { RouterProvider } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { router } from './router';
import { NotificationProvider } from './contexts/NotificationContext';
import { theme } from './theme';

function App() {
  return (
    <ConfigProvider locale={zhCN} theme={theme}>
      <NotificationProvider>
        <RouterProvider router={router} />
      </NotificationProvider>
    </ConfigProvider>
  );
}

export default App;
