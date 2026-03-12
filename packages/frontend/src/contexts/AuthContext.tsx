import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { App } from 'antd';
import { authApi } from '../api/auth';
import { log } from '../utils/logger';
import { User } from '../types';
import { useAuthStore } from '../store/authStore';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (userData: {
    username: string;
    email: string;
    password: string;
  }) => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { message } = App.useApp();
  const { setAuth, clearAuth } = useAuthStore();

  const isAuthenticated = !!user;

  // Check if user is already logged in on app start
  useEffect(() => {
    const checkAuth = async () => {
      try {
        log.info('开始检查认证状态');
        
        // Check localStorage for token
        const token = localStorage.getItem('token');
        log.info('检查 localStorage token', { hasToken: !!token });
        
        if (token) {
          try {
            log.info('验证 token 有效性');
            const userData = await authApi.getCurrentUser();
            // Response interceptor already extracted data from { success: true, data: user }
            log.info('Token 验证成功', { userId: userData.id });
            setUser(userData);
            // 同步到 authStore
            setAuth(token, userData);
          } catch (error) {
            // Token is invalid, clear everything
            log.warn('Token 无效，清除认证状态', error);
            localStorage.removeItem('token');
            setUser(null);
            clearAuth();
          }
        } else {
          log.info('未找到 token，用户未登录');
        }
      } catch (error) {
        log.error('认证初始化失败', error);
        localStorage.removeItem('token');
        setUser(null);
        clearAuth();
      } finally {
        log.info('认证检查完成，设置 isLoading = false');
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      log.info('AuthContext: 开始登录', { email });
      // Backend expects 'username' field which can be email or username
      const authResponse = await authApi.login({ username: email, password });
      
      // Response interceptor already extracted data from { success: true, data: { user, token } }
      const { token, user } = authResponse;
      
      log.info('AuthContext: 登录 API 成功', { 
        hasToken: !!token, 
        hasUser: !!user,
        userId: user?.id,
        tokenPreview: token ? token.substring(0, 30) + '...' : 'undefined'
      });
      
      if (!token) {
        throw new Error('登录响应中缺少 token');
      }
      
      if (!user) {
        throw new Error('登录响应中缺少 user');
      }
      
      // Store token in localStorage
      localStorage.setItem('token', token);
      setUser(user);
      // 同步到 authStore
      setAuth(token, user);
      
      log.info('AuthContext: Token 和用户信息已保存');
      message.success('登录成功');
    } catch (error: any) {
      log.error('AuthContext: 登录失败', error);
      // Don't show error message here, let the calling component handle it
      throw error;
    }
  };

  const register = async (userData: {
    username: string;
    email: string;
    password: string;
  }) => {
    try {
      const authResponse = await authApi.register(userData);
      
      // Response interceptor already extracted data from { success: true, data: { user, token } }
      const { token, user } = authResponse;
      
      // Store token in localStorage
      localStorage.setItem('token', token);
      setUser(user);
      // 同步到 authStore
      setAuth(token, user);
      
      message.success('注册成功');
    } catch (error: any) {
      // Don't show error message here, let the calling component handle it
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    clearAuth();
    message.success('已退出登录');
    // 使用 React Router 导航而不是硬刷新
    window.location.href = '/auth/login';
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    register,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};