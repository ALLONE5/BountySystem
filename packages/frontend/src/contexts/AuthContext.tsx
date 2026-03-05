import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { message } from 'antd';
import { authApi } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import { log } from '../utils/logger';
import { User } from '../types';

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
  const authStore = useAuthStore();

  const isAuthenticated = !!user;

  // Check if user is already logged in on app start
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // First check zustand store for persisted auth state
        const persistedToken = authStore.token;
        const persistedUser = authStore.user;
        
        if (persistedToken && persistedUser) {
          // Use persisted user data first
          setUser(persistedUser);
          
          // Then verify token is still valid by calling /auth/me
          try {
            const userData = await authApi.getCurrentUser();
            setUser(userData);
            // Update store with fresh user data
            authStore.setAuth(persistedToken, userData);
          } catch (error) {
            // Token is invalid, clear everything
            log.warn('Persisted token is invalid, clearing auth state');
            localStorage.removeItem('token');
            authStore.clearAuth();
            setUser(null);
          }
        } else {
          // Fallback to localStorage check
          const token = localStorage.getItem('token');
          if (token) {
            try {
              const userData = await authApi.getCurrentUser();
              setUser(userData);
              authStore.setAuth(token, userData);
            } catch (error) {
              log.error('Auth check failed', error);
              localStorage.removeItem('token');
              authStore.clearAuth();
            }
          }
        }
      } catch (error) {
        log.error('Auth initialization failed', error);
        localStorage.removeItem('token');
        authStore.clearAuth();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []); // 移除 authStore 依赖，只在组件挂载时执行一次

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      // Backend expects 'username' field which can be email or username
      const response = await authApi.login({ username: email, password });
      
      // Store in both localStorage and zustand store
      localStorage.setItem('token', response.token);
      authStore.setAuth(response.token, response.user);
      setUser(response.user);
      
      message.success('登录成功');
    } catch (error: any) {
      message.error(error.message || '登录失败');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: {
    username: string;
    email: string;
    password: string;
  }) => {
    try {
      setIsLoading(true);
      const response = await authApi.register(userData);
      
      // Store in both localStorage and zustand store
      localStorage.setItem('token', response.token);
      authStore.setAuth(response.token, response.user);
      setUser(response.user);
      
      message.success('注册成功');
    } catch (error: any) {
      message.error(error.message || '注册失败');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    authStore.clearAuth();
    setUser(null);
    message.success('已退出登录');
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