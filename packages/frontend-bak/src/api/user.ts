import { createApiMethodWithParams, createApiMethod } from './createApiClient';
import { User } from '../types';

export interface NotificationPreferences {
  taskAssigned: boolean;
  taskCompleted: boolean;
  taskAbandoned: boolean;
  bountyReceived: boolean;
  systemNotifications: boolean;
}

export const userApi = {
	getUser: createApiMethodWithParams<User, string>('get', (id) => `/users/${id}`),

	getUsersBatch: createApiMethod<Record<string, User>>('post', '/users/batch'),

  searchUsers: async (query: string): Promise<User[]> => {
    return createApiMethod<User[]>('get', '/users/search')({ q: query });
  },

  updateProfile: createApiMethod<{ message: string; user: User }>('put', '/users/me'),

  changePassword: createApiMethod<{ message: string }>('put', '/users/me/password'),

  // Notification preferences
  getNotificationPreferences: createApiMethod<{ preferences: NotificationPreferences }>('get', '/users/me/notifications'),

  updateNotificationPreferences: createApiMethod<{ message: string; user: User }>('put', '/users/me/notifications'),
};
