import apiClient from '../api/client';
import { log } from './logger';

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
  // 响应拦截器 - 处理 token 过期
  apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      // 如果是 401 错误且不是登录请求，清除认证状态并跳转到登录页
      if (
        error.response?.status === 401 &&
        !originalRequest._retry &&
        !originalRequest.url?.includes('/auth/login') &&
        !originalRequest.url?.includes('/auth/register')
      ) {
        if (isRefreshing) {
          // 如果正在处理，将请求加入队列
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then(() => {
              return Promise.reject(error); // 直接拒绝，因为没有刷新机制
            })
            .catch((err) => {
              return Promise.reject(err);
            });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          // 清除认证状态
          localStorage.removeItem('token');
          
          // 处理队列中的请求
          processQueue(error);

          // 跳转到登录页
          log.warn('Token expired, redirecting to login');
          window.location.href = '/auth/login';
          
          return Promise.reject(error);
        } catch (refreshError) {
          // 处理失败
          processQueue(refreshError);
          log.error('Token refresh failed', refreshError);
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
