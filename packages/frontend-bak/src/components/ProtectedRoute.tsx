import React from 'react';
import { Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import { useAuth } from '../contexts/AuthContext';

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

  console.log('🔒 [ProtectedRoute] Checking auth:', {
    isAuthenticated,
    isLoading,
    hasUser: !!user,
    userRole: user?.role,
    requiredRole
  });

  if (isLoading) {
    console.log('⏳ [ProtectedRoute] Still loading, showing spinner');
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('❌ [ProtectedRoute] Not authenticated, redirecting to login');
    return <Navigate to="/auth/login" replace />;
  }

  if (requiredRole && user && !hasRequiredRole(user.role, requiredRole)) {
    console.log('⚠️ [ProtectedRoute] Role mismatch, redirecting to dashboard');
    // 如果需要特定角色但用户角色不匹配，重定向到仪表板
    return <Navigate to="/dashboard" replace />;
  }

  console.log('✅ [ProtectedRoute] Auth check passed, rendering children');
  return <>{children}</>;
};
