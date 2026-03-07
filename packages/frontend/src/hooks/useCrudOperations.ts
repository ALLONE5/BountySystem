import { useState, useCallback } from 'react';
import { message } from 'antd';
import { logger } from '../utils/logger';

export interface UseCrudOperationsOptions<T> {
  fetchAll: () => Promise<T[]>;
  fetchOne?: (id: string) => Promise<T>;
  create?: (data: Partial<T>) => Promise<T>;
  update?: (id: string, data: Partial<T>) => Promise<T>;
  delete?: (id: string) => Promise<void>;
  onSuccess?: (action: 'fetch' | 'create' | 'update' | 'delete', data?: T) => void;
  onError?: (action: 'fetch' | 'create' | 'update' | 'delete', error: any) => void;
  successMessages?: {
    create?: string;
    update?: string;
    delete?: string;
  };
  errorMessages?: {
    fetch?: string;
    create?: string;
    update?: string;
    delete?: string;
  };
}

export interface UseCrudOperationsReturn<T> {
  data: T[];
  loading: boolean;
  selectedItem: T | null;
  setSelectedItem: (item: T | null) => void;
  loadAll: () => Promise<void>;
  loadOne: (id: string) => Promise<T | null>;
  create: (data: Partial<T>) => Promise<T | null>;
  update: (id: string, data: Partial<T>) => Promise<T | null>;
  deleteItem: (id: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

/**
 * 通用CRUD操作Hook
 * 
 * @example
 * const { data, loading, create, update, deleteItem } = useCrudOperations({
 *   fetchAll: () => userApi.getAll(),
 *   create: (data) => userApi.create(data),
 *   update: (id, data) => userApi.update(id, data),
 *   delete: (id) => userApi.delete(id),
 * });
 */
export function useCrudOperations<T extends { id: string }>(
  options: UseCrudOperationsOptions<T>
): UseCrudOperationsReturn<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<T | null>(null);

  const {
    fetchAll,
    fetchOne,
    create: createFn,
    update: updateFn,
    delete: deleteFn,
    onSuccess,
    onError,
    successMessages = {},
    errorMessages = {},
  } = options;

  // 加载所有数据
  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      const result = await fetchAll();
      setData(result);
      onSuccess?.('fetch', undefined);
    } catch (error: any) {
      const errorMsg = errorMessages.fetch || error.response?.data?.message || '加载数据失败';
      message.error(errorMsg);
      onError?.('fetch', error);
      logger.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 加载单个数据
  const loadOne = useCallback(async (id: string): Promise<T | null> => {
    if (!fetchOne) {
      logger.warn('fetchOne is not provided');
      return null;
    }

    try {
      setLoading(true);
      const result = await fetchOne(id);
      setSelectedItem(result);
      onSuccess?.('fetch', result);
      return result;
    } catch (error: any) {
      const errorMsg = errorMessages.fetch || error.response?.data?.message || '加载数据失败';
      message.error(errorMsg);
      onError?.('fetch', error);
      logger.error('Failed to fetch item:', error);
      return null;
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 创建数据
  const create = useCallback(async (data: Partial<T>): Promise<T | null> => {
    if (!createFn) {
      logger.warn('create function is not provided');
      return null;
    }

    try {
      setLoading(true);
      const result = await createFn(data);
      setData((prev) => [...prev, result]);
      const successMsg = successMessages.create || '创建成功';
      message.success(successMsg);
      onSuccess?.('create', result);
      return result;
    } catch (error: any) {
      const errorMsg = errorMessages.create || error.response?.data?.message || '创建失败';
      message.error(errorMsg);
      onError?.('create', error);
      logger.error('Failed to create item:', error);
      return null;
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 更新数据
  const update = useCallback(async (id: string, updateData: Partial<T>): Promise<T | null> => {
    if (!updateFn) {
      logger.warn('update function is not provided');
      return null;
    }

    try {
      setLoading(true);
      const result = await updateFn(id, updateData);
      setData((prev) => prev.map((item) => (item.id === id ? result : item)));
      if (selectedItem?.id === id) {
        setSelectedItem(result);
      }
      const successMsg = successMessages.update || '更新成功';
      message.success(successMsg);
      onSuccess?.('update', result);
      return result;
    } catch (error: any) {
      const errorMsg = errorMessages.update || error.response?.data?.message || '更新失败';
      message.error(errorMsg);
      onError?.('update', error);
      logger.error('Failed to update item:', error);
      return null;
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedItem]);

  // 删除数据
  const deleteItem = useCallback(async (id: string): Promise<boolean> => {
    if (!deleteFn) {
      logger.warn('delete function is not provided');
      return false;
    }

    try {
      setLoading(true);
      await deleteFn(id);
      setData((prev) => prev.filter((item) => item.id !== id));
      if (selectedItem?.id === id) {
        setSelectedItem(null);
      }
      const successMsg = successMessages.delete || '删除成功';
      message.success(successMsg);
      onSuccess?.('delete', undefined);
      return true;
    } catch (error: any) {
      const errorMsg = errorMessages.delete || error.response?.data?.message || '删除失败';
      message.error(errorMsg);
      onError?.('delete', error);
      logger.error('Failed to delete item:', error);
      return false;
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedItem]);

  // 刷新数据（重新加载）
  const refresh = useCallback(async () => {
    await loadAll();
  }, [loadAll]);

  return {
    data,
    loading,
    selectedItem,
    setSelectedItem,
    loadAll,
    loadOne,
    create,
    update,
    deleteItem,
    refresh,
  };
}
