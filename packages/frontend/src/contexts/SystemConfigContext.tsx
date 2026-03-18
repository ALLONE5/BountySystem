import React, { createContext, useContext, useEffect, useState } from 'react';
import { systemConfigApi, SystemConfig } from '../api/systemConfig';
import { log } from '../utils/logger';

interface SystemConfigContextType {
  config: SystemConfig | null;
  loading: boolean;
  refreshConfig: () => Promise<void>;
}

const SystemConfigContext = createContext<SystemConfigContextType | undefined>(undefined);

export const SystemConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshConfig = async () => {
    try {
      setLoading(true);
      log.info('Loading system config...');
      const data = await systemConfigApi.getPublicConfig();
      log.info('System config loaded successfully', data);
      
      // Check if data is valid
      if (!data) {
        throw new Error('API returned null or undefined data');
      }
      
      // Convert public config to full config format
      const fullConfig: SystemConfig = {
        id: 'public',
        siteName: data.siteName || '赏金平台',
        siteDescription: data.siteDescription || '基于任务的协作平台',
        logoUrl: data.logoUrl || '',
        debugMode: data.debugMode || false,
        allowRegistration: true,
        maintenanceMode: false,
        maxFileSize: 10,
        defaultUserRole: 'user',
        emailEnabled: false,
        smtpHost: '',
        smtpPort: 587,
        smtpUser: '',
        smtpSecure: false,
        // UI Theme settings from API
        defaultTheme: data.defaultTheme || 'dark',
        allowThemeSwitch: data.allowThemeSwitch !== false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      setConfig(fullConfig);
      
      // 动态更新页面标题
      if (fullConfig.siteName) {
        document.title = fullConfig.siteName;
        log.debug('Updated page title', { siteName: fullConfig.siteName });
      }
      
      // 动态更新favicon（如果有Logo）
      if (fullConfig.logoUrl) {
        updateFavicon(fullConfig.logoUrl);
        log.debug('Updated favicon', { logoUrl: fullConfig.logoUrl });
      }
    } catch (error) {
      log.error('Failed to load system config', error);
      // 使用默认配置
      const defaultConfig = {
        id: 'default',
        siteName: '赏金平台',
        siteDescription: '基于任务的协作平台',
        logoUrl: '',
        debugMode: false,
        allowRegistration: true,
        maintenanceMode: false,
        maxFileSize: 10,
        defaultUserRole: 'user',
        emailEnabled: false,
        smtpHost: '',
        smtpPort: 587,
        smtpUser: '',
        smtpSecure: false,
        // UI Theme defaults
        defaultTheme: 'dark' as const,
        allowThemeSwitch: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      log.info('Using default system config', defaultConfig);
      setConfig(defaultConfig);
    } finally {
      setLoading(false);
    }
  };

  const updateFavicon = (logoUrl: string) => {
    // 移除现有的favicon
    const existingFavicon = document.querySelector('link[rel="icon"]') || 
                           document.querySelector('link[rel="shortcut icon"]');
    if (existingFavicon) {
      existingFavicon.remove();
    }

    // 添加新的favicon
    const link = document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/png';
    
    // 构建正确的URL
    let faviconUrl = logoUrl;
    if (!logoUrl.startsWith('http')) {
      // 如果是相对路径，添加后端服务器地址
      const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';
      faviconUrl = `${baseUrl}${logoUrl.startsWith('/') ? logoUrl : '/' + logoUrl}`;
    }
    
    link.href = faviconUrl;
    document.head.appendChild(link);
    
    // 添加错误处理
    link.onerror = () => {
      log.warn('Failed to load favicon', { faviconUrl });
      // 如果加载失败，尝试使用默认favicon
      link.href = '/favicon.ico';
    };
  };

  useEffect(() => {
    refreshConfig();
  }, []);

  return (
    <SystemConfigContext.Provider value={{ config, loading, refreshConfig }}>
      {children}
    </SystemConfigContext.Provider>
  );
};

export const useSystemConfig = () => {
  const context = useContext(SystemConfigContext);
  if (context === undefined) {
    throw new Error('useSystemConfig must be used within a SystemConfigProvider');
  }
  return context;
};