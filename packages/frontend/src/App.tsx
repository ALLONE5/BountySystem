import { RouterProvider } from 'react-router-dom';
import { ConfigProvider, App as AntdApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { router } from './router/index';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { SystemConfigProvider } from './contexts/SystemConfigContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { useEffect } from 'react';
import { initializeUserSettings } from './utils/timezone';
import { getThemeConfig } from './theme/index';
import { setGlobalMessage } from './utils/message';
import './styles/global.css';
import './styles/global-theme.css';
import './styles/glassmorphism.css';
import './styles/components.css';
import './styles/search-harmonization.css';

// Import Google Fonts
const fontLink = document.createElement('link');
fontLink.href = 'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Inter:wght@300;400;600;800&family=JetBrains+Mono:wght@400;700&display=swap';
fontLink.rel = 'stylesheet';
document.head.appendChild(fontLink);

/**
 * 内部应用组件，使用主题上下文
 */
function AppContent() {
  const { themeMode } = useTheme();
  const themeConfig = getThemeConfig(themeMode);

  return (
    <ConfigProvider locale={zhCN} theme={themeConfig}>
      <AntdApp>
        <AppWithMessage />
      </AntdApp>
    </ConfigProvider>
  );
}

/**
 * 初始化全局message实例的组件
 */
function AppWithMessage() {
  const { message } = AntdApp.useApp();

  useEffect(() => {
    // 设置全局message实例
    setGlobalMessage(message);
  }, [message]);

  return (
    <AuthProvider>
      <NotificationProvider>
        <RouterProvider router={router} />
      </NotificationProvider>
    </AuthProvider>
  );
}

function App() {
  useEffect(() => {
    // Initialize user settings (timezone only)
    initializeUserSettings();
  }, []);

  return (
    <SystemConfigProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SystemConfigProvider>
  );
}

export default App;
