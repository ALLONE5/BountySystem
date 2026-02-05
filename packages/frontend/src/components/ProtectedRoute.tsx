import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { UserRole } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole | UserRole[];
}

// 检查用户是否有所需角色
const hasRequiredRole = (userRole: UserRole, requiredRole?: UserRole | UserRole[]): boolean => {
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
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  if (requiredRole && user && !hasRequiredRole(user.role, requiredRole)) {
    // 如果需要特定角色但用户角色不匹配，重定向到仪表板
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
