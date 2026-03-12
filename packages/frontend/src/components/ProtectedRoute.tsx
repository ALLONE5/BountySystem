import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import { useAuth } from '../contexts/AuthContext';
import { logger } from '../utils/logger';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string | string[];
}

// 检查用户是否有所需角色
const hasRequiredRole = (userRole: string, requiredRole?: string | string[]): boolean => {
  if (!requiredRole) {
    return true;
  }

  if (Array.isArray(requiredRole)) {
    return requiredRole.includes(userRole);
  }

  return userRole === requiredRole;
};

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
}) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  useEffect(() => {
    logger.info('ProtectedRoute 状态', { 
      isAuthenticated, 
      hasUser: !!user, 
      isLoading,
      userId: user?.id 
    });
  }, [isAuthenticated, user, isLoading]);

  if (isLoading) {
    logger.info('ProtectedRoute: 正在加载认证状态');
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    logger.warn('ProtectedRoute: 用户未认证，重定向到登录页');
    return <Navigate to="/auth/login" replace />;
  }

  if (requiredRole && user && !hasRequiredRole(user.role, requiredRole)) {
    logger.warn('ProtectedRoute: 用户角色不匹配，重定向到仪表板');
    // 如果需要特定角色但用户角色不匹配，重定向到仪表板
    return <Navigate to="/dashboard" replace />;
  }

  logger.info('ProtectedRoute: 认证通过，渲染子组件');
  return <>{children}</>;
};
