import { useState, useCallback } from 'react';

/**
 * 加载状态管理Hook
 * 用于统一管理异步操作的加载状态
 */

interface LoadingState {
  isLoading: boolean;
  error: Error | null;
  data: any;
}

export const useLoadingState = <T = any>(initialData?: T) => {
  const [state, setState] = useState<LoadingState>({
    isLoading: false,
    error: null,
    data: initialData || null,
  });

  const setLoading = useCallback((loading: boolean) => {
    setState((prev) => ({ ...prev, isLoading: loading }));
  }, []);

  const setError = useCallback((error: Error | null) => {
    setState((prev) => ({ ...prev, error, isLoading: false }));
  }, []);

  const setData = useCallback((data: T) => {
    setState({ isLoading: false, error: null, data });
  }, []);

  const reset = useCallback(() => {
    setState({ isLoading: false, error: null, data: initialData || null });
  }, [initialData]);

  /**
   * 执行异步操作并自动管理加载状态
   */
  const execute = useCallback(
    async <R = T>(asyncFn: () => Promise<R>): Promise<R | null> => {
      try {
        setLoading(true);
        const result = await asyncFn();
        setData(result as any);
        return result;
      } catch (error) {
        setError(error as Error);
        return null;
      }
    },
    [setLoading, setData, setError]
  );

  return {
    ...state,
    setLoading,
    setError,
    setData,
    reset,
    execute,
  };
};

/**
 * 延迟加载Hook - 避免闪烁
 * 如果加载时间很短，不显示加载状态
 */
export const useDeferredLoading = (delay: number = 300) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showLoading, setShowLoading] = useState(false);

  const startLoading = useCallback(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      if (isLoading) {
        setShowLoading(true);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, isLoading]);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
    setShowLoading(false);
  }, []);

  return {
    isLoading,
    showLoading,
    startLoading,
    stopLoading,
  };
};

/**
 * 防抖加载Hook
 * 防止频繁触发加载
 */
export const useDebouncedLoading = (delay: number = 500) => {
  const [isLoading, setIsLoading] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const startLoading = useCallback(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    const id = setTimeout(() => {
      setIsLoading(true);
    }, delay);

    setTimeoutId(id);
  }, [delay, timeoutId]);

  const stopLoading = useCallback(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    setIsLoading(false);
  }, [timeoutId]);

  return {
    isLoading,
    startLoading,
    stopLoading,
  };
};
