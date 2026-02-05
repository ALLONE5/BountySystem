import { useAuthStore } from '../store/authStore';
import { UserRole } from '../types';

export const usePermission = () => {
  const { user } = useAuthStore();

  const hasRole = (role: UserRole | UserRole[]): boolean => {
    if (!user) return false;

    if (Array.isArray(role)) {
      return role.includes(user.role);
    }

    return user.role === role;
  };

  const isAdmin = (): boolean => {
    return hasRole([UserRole.POSITION_ADMIN, UserRole.SUPER_ADMIN]);
  };

  const isSuperAdmin = (): boolean => {
    return hasRole(UserRole.SUPER_ADMIN);
  };

  const isPositionAdmin = (): boolean => {
    return hasRole(UserRole.POSITION_ADMIN);
  };

  const canAccessAdminPanel = (): boolean => {
    return isAdmin();
  };

  const canManageAllUsers = (): boolean => {
    return isSuperAdmin();
  };

  const canManageAllTasks = (): boolean => {
    return isSuperAdmin();
  };

  return {
    user,
    hasRole,
    isAdmin,
    isSuperAdmin,
    isPositionAdmin,
    canAccessAdminPanel,
    canManageAllUsers,
    canManageAllTasks,
  };
};
