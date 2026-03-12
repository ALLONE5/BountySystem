import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../store/authStore';
import { UserRole } from '../types';

describe('ProtectedRoute Authentication', () => {
  beforeEach(() => {
    // 清除认证状态
    useAuthStore.getState().clearAuth();
  });

  it('should store and retrieve auth token', () => {
    const mockUser = {
    id: 'test-user-id',
    username: 'testuser',
    email: 'test@example.com',
    avatarId: 'avatar-1',
    role: UserRole.USER,
    positions: [],
    balance: 100,
    bounty: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

    const mockToken = 'test-jwt-token';

    // 设置认证
    useAuthStore.getState().setAuth(mockToken, mockUser);

    // 验证状态
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.token).toBe(mockToken);
    expect(state.user?.username).toBe('testuser');
    expect(state.user?.role).toBe(UserRole.USER);
  });

  it('should clear auth state on logout', () => {
    const mockUser = {
      id: '1',
      username: 'testuser',
      email: 'test@example.com',
      avatarId: 'avatar1',
      role: UserRole.USER,
      positions: [],
      balance: 0,
      bounty: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 设置认证
    useAuthStore.getState().setAuth('token', mockUser);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);

    // 清除认证
    useAuthStore.getState().clearAuth();

    // 验证状态已清除
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.token).toBe(null);
    expect(state.user).toBe(null);
  });

  it('should persist auth state', () => {
    const mockUser = {
      id: '1',
      username: 'testuser',
      email: 'test@example.com',
      avatarId: 'avatar1',
      role: UserRole.USER,
      positions: [],
      balance: 0,
      bounty: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const mockToken = 'persistent-token';

    // 设置认证
    useAuthStore.getState().setAuth(mockToken, mockUser);

    // 验证 localStorage 中存储了数据
    const stored = localStorage.getItem('auth-storage');
    expect(stored).toBeTruthy();

    if (stored) {
      const parsed = JSON.parse(stored);
      expect(parsed.state.token).toBe(mockToken);
      expect(parsed.state.isAuthenticated).toBe(true);
    }
  });

  it('should handle different user roles', () => {
    const roles = [UserRole.USER, UserRole.POSITION_ADMIN, UserRole.SUPER_ADMIN];

    roles.forEach((role) => {
      const mockUser = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        avatarId: 'avatar1',
        role,
        positions: [],
        balance: 0,
        bounty: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      useAuthStore.getState().setAuth('token', mockUser);
      expect(useAuthStore.getState().user?.role).toBe(role);
      useAuthStore.getState().clearAuth();
    });
  });
});
