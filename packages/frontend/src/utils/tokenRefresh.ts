import { useAuthStore } from '../store/authStore';
import apiClient from '../api/client';

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });

  failedQueue = [];
};

export const setupTokenRefresh = () => {
  // 响应拦截器 - 处理 token 刷新
  apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      // 如果是 401 错误且不是登录请求，尝试刷新 token
      if (
        error.response?.status === 401 &&
        !originalRequest._retry &&
        !originalRequest.url?.includes('/auth/login') &&
        !originalRequest.url?.includes('/auth/register')
      ) {
        if (isRefreshing) {
          // 如果正在刷新，将请求加入队列
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then(() => {
              return apiClient(originalRequest);
            })
            .catch((err) => {
              return Promise.reject(err);
            });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          // 尝试刷新 token
          const response = await apiClient.post('/auth/refresh');
          const { token, user } = response.data;

          // 更新存储的 token
          useAuthStore.getState().setAuth(token, user);

          // 处理队列中的请求
          processQueue();

          // 重试原始请求
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        } catch (refreshError) {
          // 刷新失败，清除认证状态
          processQueue(refreshError);
          useAuthStore.getState().clearAuth();
          window.location.href = '/auth/login';
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    }
  );
};
