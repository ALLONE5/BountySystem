import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { App } from 'antd';
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
    throw nwew Error('useAuth must be used within an AuthProvider');
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
  const { message } = App.useApp();

  const isAuthenticated = !!user;

  console.log('🔐 [AuthProvider] State:', { 
    isAuthenticated, 
    isLoading, 
    hasUser: !!user,
    userId: user?.id 
  });
  
  // Debug: Log whenever isAuthenticated changes
  useEffect(() => {
    console.log('🔐 [AuthContext] Auth state changed:', {
      isAuthenticated,
      hasUser: !!user,
      userId: user?.id,
      username: user?.username,
      isLoading
    });
  }, [isAuthenticated, user, isLoading]);

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
      console.log('🔵 [AuthContext] Login function called - NEW CODE VERSION (no message.success)');
      setIsLoading(true);
      // Backend expects 'username' field which can be email or username
      const response = await authApi.login({ username: email, password });
      
      console.log('🟢 [AuthContext] Login API successful, storing auth data');
      // Store in both localStorage and zustand store
      localStorage.setItem('token', response.token);
      authStore.setAuth(response.token, response.user);
      
      // Update user state and wait for it to complete
      setUser(response.user);
      console.log('🟢 [AuthContext] User state updated, isAuthenticated should be true');
      
      // Don't show message here - let the calling component handle it
      // This avoids the static context warning
    } catch (error: any) {
      console.error('🔴 [AuthContext] Login failed:', error);
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
      
      // Don't show message here - let the calling component handle it
    } catch (error: any) {
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