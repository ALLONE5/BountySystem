import { createExtendedApi, createApiMethod, createApiMethodWithParams } from './createApiClient';
import apiClient from './client';

export interface Avatar {
  id: string;
  name: string;
  imageUrl: string;
  requiredRank: number;
  createdAt: string;
}

// 使用工厂函数创建API客户端
const baseCrudApi = createExtendedApi<Avatar>({
  basePath: '/avatars',
  customMethods: {
    // Get available avatars for current user
    getAvailableAvatars: createApiMethod<Avatar[]>('get', '/avatars/available/me'),

    // Get user's current avatar (with 404 handling)
    getUserAvatar: async (): Promise<Avatar | null> => {
      try {
        const response = await apiClient.get('/avatars/user/me', {
          // 告诉拦截器不要显示404错误消息
          headers: { 'X-Skip-Error-Message': '404' }
        });
        return response.data;
      } catch (error: any) {
        if (error.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },

    // Select avatar
    selectAvatar: createApiMethodWithParams<void, string>(
      'post',
      (avatarId) => `/avatars/select/${avatarId}`
    ),
  },
});

// 导出带有语义化方法名的API
export const avatarApi = {
  getAllAvatars: baseCrudApi.getAll,
  getAvailableAvatars: baseCrudApi.getAvailableAvatars,
  getUserAvatar: baseCrudApi.getUserAvatar,
  selectAvatar: baseCrudApi.selectAvatar,
  createAvatar: baseCrudApi.create,
  updateAvatar: baseCrudApi.update,
  deleteAvatar: baseCrudApi.delete,
};
