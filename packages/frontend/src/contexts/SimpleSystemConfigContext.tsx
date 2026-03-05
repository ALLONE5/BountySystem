import React, { createContext, useContext, useState, useEffect } from 'react';

interface SystemConfig {
  siteName: string;
  siteDescription: string;
  logoUrl: string;
  isMaintenanceMode: boolean;
  isRegistrationAllowed: boolean;
  debugMode: boolean;
}

interface SystemConfigContextType {
  config: SystemConfig;
  loading: boolean;
  error: string | null;
  refreshConfig: () => Promise<void>;
}

const defaultConfig: SystemConfig = {
  siteName: '赏金平台',
  siteDescription: '专业的任务管理和赏金系统',
  logoUrl: '/logo.png',
  isMaintenanceMode: false,
  isRegistrationAllowed: true,
  debugMode: false,
};

const SimpleSystemConfigContext = createContext<SystemConfigContextType | undefined>(undefined);

export const SimpleSystemConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<SystemConfig>(defaultConfig);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshConfig = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/system-config/public', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });

      if (response.ok) {
        const data = await response.json();
        setConfig({ ...defaultConfig, ...data });
      } else {
        console.warn('无法获取系统配置，使用默认配置');
        setConfig(defaultConfig);
      }
    } catch (error) {
      console.warn('获取系统配置失败，使用默认配置:', error);
      setConfig(defaultConfig);
      setError('获取系统配置失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshConfig();
  }, []);

  const value: SystemConfigContextType = {
    config,
    loading,
    error,
    refreshConfig,
  };

  return (
    <SimpleSystemConfigContext.Provider value={value}>
      {children}
    </SimpleSystemConfigContext.Provider>
  );
};

export const useSimpleSystemConfig = () => {
  const context = useContext(SimpleSystemConfigContext);
  if (context === undefined) {
    throw new Error('useSimpleSystemConfig must be used within a SimpleSystemConfigProvider');
  }
  return context;
};