import React from 'react';

interface SimpleProtectedRouteProps {
  children: React.ReactNode;
}

export const SimpleProtectedRoute: React.FC<SimpleProtectedRouteProps> = ({ children }) => {
  // 暂时跳过认证检查，直接渲染子组件
  return <>{children}</>;
};