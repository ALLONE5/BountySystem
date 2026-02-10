/**
 * Cache Middleware
 * Provides automatic caching for API responses
 */

import type { Request, Response, NextFunction } from 'express';
import { CacheService } from '../services/CacheService';

export interface CacheMiddlewareOptions {
  ttl?: number;
  keyGenerator?: (req: Request) => string;
  condition?: (req: Request) => boolean;
}

/**
 * Cache middleware factory
 * Creates a middleware that caches GET request responses
 */
export function cacheMiddleware(options: CacheMiddlewareOptions = {}) {
  const {
    ttl = 300,
    keyGenerator = defaultKeyGenerator,
    condition = defaultCondition,
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Check condition
    if (!condition(req)) {
      return next();
    }

    try {
      // Generate cache key
      const cacheKey = keyGenerator(req);

      // Try to get from cache
      const cachedData = await CacheService.get(cacheKey);

      if (cachedData) {
        // Cache hit
        res.setHeader('X-Cache', 'HIT');
        return res.json(cachedData);
      }

      // Cache miss - intercept response
      res.setHeader('X-Cache', 'MISS');

      // Store original json method
      const originalJson = res.json.bind(res);

      // Override json method to cache response
      res.json = function (data: any) {
        // Cache the response
        CacheService.set(cacheKey, data, { ttl }).catch((error) => {
          console.error('Error caching response:', error);
        });

        // Call original json method
        return originalJson(data);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
}

/**
 * Default cache key generator
 * Uses URL and query parameters
 */
function defaultKeyGenerator(req: Request): string {
  const userId = (req as any).user?.id || 'anonymous';
  const url = req.originalUrl || req.url;
  return `api:${userId}:${url}`;
}

/**
 * Default condition - cache all GET requests
 */
function defaultCondition(req: Request): boolean {
  return true;
}

/**
 * Cache invalidation middleware
 * Invalidates cache on write operations (POST, PUT, PATCH, DELETE)
 */
export function cacheInvalidationMiddleware(patterns: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only invalidate on write operations
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      // Store original json method
      const originalJson = res.json.bind(res);

      // Override json method to invalidate cache after successful response
      res.json = function (data: any) {
        // Only invalidate on successful responses (2xx status codes)
        if (res.statusCode >= 200 && res.statusCode < 300) {
          // Invalidate cache patterns
          Promise.all(
            patterns.map((pattern) => CacheService.deletePattern(pattern))
          ).catch((error) => {
            console.error('Error invalidating cache:', error);
          });
        }

        // Call original json method
        return originalJson(data);
      };
    }

    next();
  };
}

/**
 * User-specific cache invalidation
 * Invalidates user-related caches on profile updates
 */
export function invalidateUserCache(userId: string): Promise<void[]> {
  return Promise.all([
    CacheService.invalidateUserProfile(userId),
    CacheService.invalidateUserPositions(userId),
    CacheService.invalidateUserAvatars(userId),
    CacheService.invalidateTaskList(userId),
  ]);
}

/**
 * Task-related cache invalidation
 * Invalidates task-related caches when tasks are modified
 */
export function invalidateTaskCache(): Promise<void[]> {
  return Promise.all([
    CacheService.invalidateAllTaskLists(),
    CacheService.deletePattern('api:*:/api/tasks*'),
  ]);
}

/**
 * Ranking cache invalidation
 * Invalidates ranking caches when rankings are recalculated
 */
export function invalidateRankingCache(): Promise<void[]> {
  return Promise.all([
    CacheService.invalidateRankings(),
    CacheService.invalidateAllAvatars(),
    CacheService.deletePattern('api:*:/api/rankings*'),
  ]);
}
