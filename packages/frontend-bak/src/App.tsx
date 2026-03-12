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
import { startOpaqueFixedColumnFix } from './utils/tableFixedColumnOpaqueFix';
import './styles/global.css';
import './styles/global-theme.css';
import './styles/glassmorphism.css';
import './styles/components.css';
import './styles/search-harmonization.css';
import './styles/table-fixed-column-override.css';
import './styles/table-fixed-column-nuclear.css';
import './styles/table-fixed-column-ultimate-fix.css';
import './styles/table-fixed-column-opaque-force.css';
import './styles/table-fixed-column-opaque.css';
import './styles/table-fixed-column-nuclear-opaque.css';
import './styles/table-fixed-column-ultimate-opaque.css';
import './styles/table-fixed-column-brute-force.css';
import './utils/fixedColumnFix';
import './utils/tableFixedColumnInlineStyles';
import './utils/forceOpaqueFixedColumns';
import './styles/table-fixed-column-absolute.css';
import './utils/tableFixedColumnAbsoluteFix';
import './utils/tableFixedColumnUltimateFix';
import './styles/table-fixed-column-final-solution.css';
import './utils/tableFixedColumnOpaqueFix';
import './utils/nuclearOpaqueFixedColumns';
import './utils/ultimateOpaqueFixedColumns';
import './utils/bruteForceFixedColumnFix';
import './utils/debugFixedColumns';

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

  useEffect(() => {
    // 启动表格固定列不透明修复
    startOpaqueFixedColumnFix({
      forceUpdate: true
    });
  }, []);

  return (
    <ConfigProvider locale={zhCN} theme={themeConfig}>
      <AntdApp>
        <AuthProvider>
          <NotificationProvider>
            <RouterProvider router={router} />
          </NotificationProvider>
        </AuthProvider>
      </AntdApp>
    </ConfigProvider>
  );
}

function App() {
  console.log('🚀🚀🚀 [App] FRONTEND-BAK STARTED - VERSION 2.0 WITH DEBUG LOGS 🚀🚀🚀');
  
  useEffect(() => {
    // Initialize user settings (timezone only)
    initializeUserSettings();
    console.log('✅ [App] User settings initialized');
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
