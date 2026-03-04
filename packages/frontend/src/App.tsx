import { RouterProvider } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { router } from './router';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { SystemConfigProvider } from './contexts/SystemConfigContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { useEffect } from 'react';
import { initializeUserSettings } from './utils/timezone';
import { getThemeConfig } from './theme';
import './styles/global-theme.css';
import './styles/discord-global.css';
import './styles/search-bar.css';
import './styles/collapse.css';
import './styles/glassmorphism.css';

// CACHE BUSTER: 2026-03-03-17:00:00 - Apply Modern UI Design
console.log('🎨 APP.TSX MODERN UI APPLIED - 2026-03-03-17:00:00 🎨');

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
      <AuthProvider>
        <NotificationProvider>
          <RouterProvider router={router} />
        </NotificationProvider>
      </AuthProvider>
    </ConfigProvider>
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
