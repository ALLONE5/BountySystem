import { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '../utils/logger';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  staleWhileRevalidate?: boolean; // Return stale data while fetching fresh data
}

class DataCache {
  private cache = new Map<string, CacheEntry<any>>();
  private pendingRequests = new Map<string, Promise<any>>();

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
    this.pendingRequests.clear();
  }

  async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const { ttl = 5 * 60 * 1000, staleWhileRevalidate = false } = options;

    // Check if there's already a pending request for this key
    const pendingRequest = this.pendingRequests.get(key);
    if (pendingRequest) {
      return pendingRequest;
    }

    // Check cache first
    const cached = this.get<T>(key);
    if (cached !== null) {
      if (staleWhileRevalidate) {
        // Return cached data immediately and fetch fresh data in background
        this.fetchAndCache(key, fetcher, ttl).catch(error => {
          logger.error('Background fetch failed', { key, error });
        });
      }
      return cached;
    }

    // Fetch and cache
    return this.fetchAndCache(key, fetcher, ttl);
  }

  private async fetchAndCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number
  ): Promise<T> {
    const fetchPromise = fetcher();
    this.pendingRequests.set(key, fetchPromise);

    try {
      const data = await fetchPromise;
      this.set(key, data, ttl);
      return data;
    } catch (error) {
      logger.error('Fetch failed', { key, error });
      throw error;
    } finally {
      this.pendingRequests.delete(key);
    }
  }
}

// Global cache instance
const globalCache = new DataCache();

export function useDataCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions & { enabled?: boolean } = {}
) {
  const { ttl = 5 * 60 * 1000, staleWhileRevalidate = false, enabled = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const fetcherRef = useRef(fetcher);

  // Update fetcher ref when it changes
  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  const fetchData = useCallback(async (force = false) => {
    if (!enabled) return;

    try {
      setLoading(true);
      setError(null);

      let result: T;
      if (force) {
        // Force fetch bypasses cache
        globalCache.delete(key);
        result = await fetcherRef.current();
        globalCache.set(key, result, ttl);
      } else {
        result = await globalCache.getOrFetch(key, fetcherRef.current, {
          ttl,
          staleWhileRevalidate
        });
      }

      setData(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      logger.error('Data fetch failed', { key, error: error.message });
    } finally {
      setLoading(false);
    }
  }, [key, ttl, staleWhileRevalidate, enabled]);

  // Initial fetch
  useEffect(() => {
    if (enabled) {
      fetchData();
    }
  }, [fetchData, enabled]);

  const invalidate = useCallback(() => {
    globalCache.delete(key);
  }, [key]);

  const refresh = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refresh,
    invalidate,
    fetchData
  };
}

// Hook for managing multiple related data sources
export function useMultiDataCache<T extends Record<string, any>>(
  sources: Record<keyof T, { fetcher: () => Promise<T[keyof T]>; options?: CacheOptions }>
) {
  const [data, setData] = useState<Partial<T>>({});
  const [loading, setLoading] = useState<Record<keyof T, boolean>>({} as Record<keyof T, boolean>);
  const [errors, setErrors] = useState<Record<keyof T, Error | null>>({} as Record<keyof T, Error | null>);

  const fetchAll = useCallback(async () => {
    const promises = Object.entries(sources).map(async ([key, { fetcher, options = {} }]) => {
      const cacheKey = `multi_${String(key)}`;
      setLoading(prev => ({ ...prev, [key]: true }));
      setErrors(prev => ({ ...prev, [key]: null }));

      try {
        const result = await globalCache.getOrFetch(cacheKey, fetcher, options);
        setData(prev => ({ ...prev, [key]: result }));
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        setErrors(prev => ({ ...prev, [key]: err }));
        logger.error('Multi-data fetch failed', { key, error: err.message });
      } finally {
        setLoading(prev => ({ ...prev, [key]: false }));
      }
    });

    await Promise.allSettled(promises);
  }, [sources]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const invalidateAll = useCallback(() => {
    Object.keys(sources).forEach(key => {
      globalCache.delete(`multi_${String(key)}`);
    });
  }, [sources]);

  const refreshAll = useCallback(() => {
    invalidateAll();
    return fetchAll();
  }, [invalidateAll, fetchAll]);

  return {
    data,
    loading,
    errors,
    refreshAll,
    invalidateAll,
    isLoading: Object.values(loading).some(Boolean),
    hasErrors: Object.values(errors).some(Boolean)
  };
}

export { globalCache };