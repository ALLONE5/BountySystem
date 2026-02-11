import React, { createContext, useContext, useEffect, useState } from 'react';
import { systemConfigApi, SystemConfig } from '../api/systemConfig';

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
      console.log('🔄 Loading system config...');
      const data = await systemConfigApi.getPublicConfig();
      console.log('✅ System config loaded:', data);
      
      // Convert public config to full config format
      const fullConfig: SystemConfig = {
        id: 'public',
        siteName: data.siteName,
        siteDescription: data.siteDescription,
        logoUrl: data.logoUrl,
        debugMode: data.debugMode,
        allowRegistration: true,
        maintenanceMode: false,
        maxFileSize: 10,
        defaultUserRole: 'user',
        emailEnabled: false,
        smtpHost: '',
        smtpPort: 587,
        smtpUser: '',
        smtpSecure: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      setConfig(fullConfig);
      
      // 动态更新页面标题
      if (data.siteName) {
        document.title = data.siteName;
        console.log('📝 Updated page title to:', data.siteName);
      }
      
      // 动态更新favicon（如果有Logo）
      if (data.logoUrl) {
        updateFavicon(data.logoUrl);
        console.log('🖼️ Updated favicon to:', data.logoUrl);
      }
    } catch (error) {
      console.error('❌ Failed to load system config:', error);
      // 使用默认配置
      const defaultConfig = {
        id: 'default',
        siteName: '赏金猎人平台',
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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      console.log('🔧 Using default config:', defaultConfig);
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
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
      faviconUrl = `${baseUrl}${logoUrl.startsWith('/') ? logoUrl : '/' + logoUrl}`;
    }
    
    link.href = faviconUrl;
    document.head.appendChild(link);
    
    // 添加错误处理
    link.onerror = () => {
      console.warn('Failed to load favicon:', faviconUrl);
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