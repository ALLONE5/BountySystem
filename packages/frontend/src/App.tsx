import { RouterProvider } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { router } from './router';
import { NotificationProvider } from './contexts/NotificationContext';
import { SystemConfigProvider } from './contexts/SystemConfigContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { theme } from './theme';
import { useEffect } from 'react';
import { initializeUserSettings } from './utils/timezone';

// Import Google Fonts
const fontLink = document.createElement('link');
fontLink.href = 'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Inter:wght@300;400;600;800&family=JetBrains+Mono:wght@400;700&display=swap';
fontLink.rel = 'stylesheet';
document.head.appendChild(fontLink);

function App() {
  useEffect(() => {
    // Initialize user settings (timezone only)
    initializeUserSettings();
  }, []);

  return (
    <ConfigProvider locale={zhCN} theme={theme}>
      <SystemConfigProvider>
        <ThemeProvider>
          <NotificationProvider>
            <RouterProvider router={router} />
          </NotificationProvider>
        </ThemeProvider>
      </SystemConfigProvider>
    </ConfigProvider>
  );
}

export default App;
