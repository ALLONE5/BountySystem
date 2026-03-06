import axios from 'axios';
import { message } from '../utils/message';
import { log } from '../utils/logger';

// 创建 axios 实例
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 30000, // 增加到 30 秒，因为完成任务操作可能需要处理赏金分配、通知等
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加 token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理错误
apiClient.interceptors.response.use(
  (response) => {
    // 成功响应直接返回
    return response;
  },
  (error) => {
    // 处理错误响应
    if (error.response) {
      const { status, data } = error.response;
      const skipErrorMessage = error.config?.headers?.['X-Skip-Error-Message'];
      const isLoginRequest = error.config?.url?.includes('/auth/login');
      
      // 401 未授权 - token过期或无效
      if (status === 401) {
        // 如果是登录请求失败，不要自动跳转，让登录页面自己处理错误
        if (!isLoginRequest) {
          log.warn('Authentication failed, redirecting to login');
          // 清除token并跳转到登录页
          localStorage.removeItem('token');
          window.location.href = '/auth/login';
        }
        return Promise.reject(error);
      }
      
      // 403 权限不足
      if (status === 403) {
        // 只有在非预期的403错误时才显示消息
        if (!skipErrorMessage || skipErrorMessage !== '403') {
          message.error(data.message || '权限不足');
        }
        return Promise.reject(error);
      }
      
      // 404 资源不存在 - 检查是否应该跳过错误消息
      if (status === 404) {
        if (skipErrorMessage !== '404') {
          // 只有在关键API调用失败时才显示错误消息
          const isCriticalAPI = error.config?.url && (
            error.config.url.includes('/auth/') ||
            error.config.url.includes('/users/') ||
            error.config.url.includes('/tasks/') ||
            error.config.url.includes('/positions/') ||
            error.config.url.includes('/notifications')
          );
          
          // 排除已知的可选API调用
          const isOptionalAPI = error.config?.url && (
            error.config.url.includes('/avatars/user/me') ||
            error.config.url.includes('/stats') ||
            error.config.url.includes('/dashboard') ||
            error.config.url.includes('/profile')
          );
          
          if (isCriticalAPI && !isOptionalAPI) {
            message.error(data.message || '请求的资源不存在');
          }
        }
        return Promise.reject(error);
      }
      
      // 500 服务器错误
      if (status >= 500) {
        message.error(data.message || '服务器错误，请稍后重试');
        return Promise.reject(error);
      }
      
      // 其他错误
      if (data.message) {
        message.error(data.message);
      }
    } else if (error.request) {
      // 请求已发送但没有收到响应
      message.error('网络错误，请检查网络连接');
    } else {
      // 请求配置出错
      message.error('请求失败：' + error.message);
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
