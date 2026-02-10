import { createApiMethodWithParams, createApiMethod } from './createApiClient';
import { User } from '../types';

export const userApi = {
	getUser: createApiMethodWithParams<User, string>('get', (id) => `/users/${id}`),

	getUsersBatch: createApiMethod<Record<string, User>>('post', '/users/batch'),

  searchUsers: async (query: string): Promise<User[]> => {
    return createApiMethod<User[]>('get', '/users/search')({ q: query });
  },

  updateProfile: createApiMethod<{ message: string; user: User }>('put', '/users/me'),

  changePassword: createApiMethod<{ message: string }>('put', '/users/me/password'),
};
