import { AxiosInstance } from 'axios';
import apiClient from './client';

/**
 * API响应包装器类型
 */
export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  [key: string]: any;
}

/**
 * CRUD操作配置
 */
export interface CrudConfig<T = any> {
  basePath: string;
  client?: AxiosInstance;
}

/**
 * 创建标准CRUD API客户端
 * 
 * @example
 * const positionApi = createCrudApi<Position>({ basePath: '/positions' });
 * // 自动生成: getAll, getOne, create, update, delete
 */
export function createCrudApi<T = any>(config: CrudConfig<T>) {
  const { basePath, client = apiClient } = config;

  return {
    /**
     * 获取所有资源
     */
    getAll: async (): Promise<T[]> => {
      const response = await client.get(basePath);
      return response.data;
    },

    /**
     * 获取单个资源
     */
    getOne: async (id: string): Promise<T> => {
      const response = await client.get(`${basePath}/${id}`);
      return response.data;
    },

    /**
     * 创建资源
     */
    create: async (data: Partial<T>): Promise<T> => {
      const response = await client.post(basePath, data);
      return response.data;
    },

    /**
     * 更新资源
     */
    update: async (id: string, data: Partial<T>): Promise<T> => {
      const response = await client.put(`${basePath}/${id}`, data);
      return response.data;
    },

    /**
     * 删除资源
     */
    delete: async (id: string): Promise<void> => {
      await client.delete(`${basePath}/${id}`);
    },
  };
}

/**
 * 创建自定义API方法
 * 
 * @example
 * const customMethod = createApiMethod<User>('get', '/users/me');
 * const user = await customMethod();
 */
export function createApiMethod<T = any>(
  method: 'get' | 'post' | 'put' | 'delete',
  path: string,
  client: AxiosInstance = apiClient
) {
  return async (data?: any): Promise<T> => {
    let response;
    
    switch (method) {
      case 'get':
        response = await client.get(path, { params: data });
        break;
      case 'post':
        response = await client.post(path, data);
        break;
      case 'put':
        response = await client.put(path, data);
        break;
      case 'delete':
        response = await client.delete(path, { data });
        break;
    }
    
    return response.data;
  };
}

/**
 * 创建带参数的API方法
 * 
 * @example
 * const getUserById = createApiMethodWithParams<User>('get', (id) => `/users/${id}`);
 * const user = await getUserById('123');
 */
export function createApiMethodWithParams<T = any, P = any>(
  method: 'get' | 'post' | 'put' | 'delete',
  pathBuilder: (params: P) => string,
  client: AxiosInstance = apiClient
) {
  return async (params: P, data?: any): Promise<T> => {
    const path = pathBuilder(params);
    let response;
    
    switch (method) {
      case 'get':
        response = await client.get(path, { params: data });
        break;
      case 'post':
        response = await client.post(path, data);
        break;
      case 'put':
        response = await client.put(path, data);
        break;
      case 'delete':
        response = await client.delete(path, { data });
        break;
    }
    
    return response.data;
  };
}

/**
 * 创建扩展的API客户端
 * 结合CRUD操作和自定义方法
 * 
 * @example
 * const userApi = createExtendedApi<User>({
 *   basePath: '/users',
 *   customMethods: {
 *     getMe: createApiMethod('get', '/users/me'),
 *     updatePassword: createApiMethod('post', '/users/password'),
 *   }
 * });
 */
export function createExtendedApi<T = any, M = any>(config: {
  basePath: string;
  customMethods?: M;
  client?: AxiosInstance;
}) {
  const { basePath, customMethods = {} as M, client = apiClient } = config;
  
  const crudMethods = createCrudApi<T>({ basePath, client });
  
  return {
    ...crudMethods,
    ...customMethods,
  };
}

/**
 * 批量操作辅助函数
 */
export const batchOperations = {
  /**
   * 批量获取
   */
  batchGet: async <T>(
    ids: string[],
    getOne: (id: string) => Promise<T>
  ): Promise<T[]> => {
    return Promise.all(ids.map(id => getOne(id)));
  },

  /**
   * 批量创建
   */
  batchCreate: async <T>(
    items: Partial<T>[],
    create: (data: Partial<T>) => Promise<T>
  ): Promise<T[]> => {
    return Promise.all(items.map(item => create(item)));
  },

  /**
   * 批量删除
   */
  batchDelete: async (
    ids: string[],
    deleteOne: (id: string) => Promise<void>
  ): Promise<void> => {
    await Promise.all(ids.map(id => deleteOne(id)));
  },
};

/**
 * 错误处理辅助函数
 */
export const handleApiError = (error: any, defaultMessage: string = '操作失败') => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return defaultMessage;
};

/**
 * 创建带错误处理的API方法
 */
export function createSafeApiMethod<T = any>(
  method: () => Promise<T>,
  errorMessage?: string
) {
  return async (): Promise<{ data: T | null; error: string | null }> => {
    try {
      const data = await method();
      return { data, error: null };
    } catch (error) {
      return { data: null, error: handleApiError(error, errorMessage) };
    }
  };
}
