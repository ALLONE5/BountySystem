/**
 * 通用数据获取 Hook
 * 提供统一的数据加载、错误处理和状态管理
 */

import { useState, useEffect, useCallback } from 'react';
import { useErrorHandler } from './useErrorHandler';

export interface DataFetchOptions<T> {
  immediate?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  errorMessage?: string;
  context?: string;
}

export interface DataFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<T | null>;
  reset: () => void;
}

export const useDataFetch = <T>(
  fetchFn: () => Promise<T>,
  dependencies: any[] = [],
  options: DataFetchOptions<T> = {}
): DataFetchResult<T> => {
  const {
    immediate = true,
    onSuccess,
    onError,
    errorMessage,
    context = 'dataFetch'
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { handleError } = useErrorHandler();

  const fetch = useCallback(async (): Promise<T | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await fetchFn();
      setData(result);
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      
      if (onError) {
        onError(error);
      } else {
        handleError(error, errorMessage, { 
          context,
          showMessage: !!errorMessage 
        });
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchFn, onSuccess, onError, errorMessage, context, handleError]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (immediate) {
      fetch();
    }
  }, dependencies);

  return { 
    data, 
    loading, 
    error, 
    refetch: fetch, 
    reset 
  };
};