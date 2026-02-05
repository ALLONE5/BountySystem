import { createApiMethod } from './createApiClient';
import { AuthResponse, LoginRequest, RegisterRequest } from '../types';

export const authApi = {
  // 登录
  login: createApiMethod<AuthResponse>('post', '/auth/login'),

  // 注册
  register: createApiMethod<AuthResponse>('post', '/auth/register'),

  // 获取当前用户信息
  getCurrentUser: createApiMethod('get', '/auth/me'),

  // 登出
  logout: createApiMethod('post', '/auth/logout'),
};
