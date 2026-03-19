import apiClient from './client';
import { User, UserRole } from '../types';

export interface DevCreateUserRequest {
  username: string;
  email: string;
  password: string;
  role?: UserRole;
}

export interface DevUpdateUserRequest {
  username?: string;
  email?: string;
  role?: UserRole;
  positionIds?: string[];
  managedPositionIds?: string[];
}

export const devUserApi = {
  getUsers: async (): Promise<{ users: User[]; count: number }> => {
    const res = await apiClient.get('/dev/users');
    return res.data;
  },

  getUser: async (userId: string): Promise<{ user: User & { positions: any[] } }> => {
    const res = await apiClient.get(`/dev/users/${userId}`);
    return res.data;
  },

  createUser: async (data: DevCreateUserRequest): Promise<{ message: string; user: User }> => {
    const res = await apiClient.post('/dev/users', data);
    return res.data;
  },

  updateUser: async (userId: string, data: DevUpdateUserRequest): Promise<{ message: string; user: User }> => {
    const res = await apiClient.put(`/dev/users/${userId}`, data);
    return res.data;
  },

  deleteUser: async (userId: string): Promise<{ message: string }> => {
    const res = await apiClient.delete(`/dev/users/${userId}`);
    return res.data;
  },

  resetPassword: async (userId: string, newPassword: string): Promise<{ message: string }> => {
    const res = await apiClient.post(`/dev/users/${userId}/reset-password`, { newPassword });
    return res.data;
  },
};
