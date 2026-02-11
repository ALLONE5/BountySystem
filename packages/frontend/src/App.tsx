import { RouterProvider } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { router } from './router';
import { NotificationProvider } from './contexts/NotificationContext';
import { SystemConfigProvider } from './contexts/SystemConfigContext';
import { theme } from './theme';
import { useEffect } from 'react';
import { initializeUserSettings } from './utils/timezone';

function App() {
  useEffect(() => {
    // Initialize user settings (timezone only)
    initializeUserSettings();
  }, []);

  return (
    <ConfigProvider locale={zhCN} theme={theme}>
      <SystemConfigProvider>
        <NotificationProvider>
          <RouterProvider router={router} />
        </NotificationProvider>
      </SystemConfigProvider>
    </ConfigProvider>
  );
}

export default App;
