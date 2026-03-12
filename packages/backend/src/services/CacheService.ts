/**
 * Cache Service
 * Implements caching strategies for frequently accessed data
 * Uses Redis for distributed caching with TTL-based invalidation
 * Includes circuit breaker pattern for Redis failure resilience
 */

import { redisClient } from '../config/redis.js';
import { logger } from '../config/logger.js';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string; // Key prefix for namespacing
}

/**
 * L1 内存缓存（快速访问层）
 */
class MemoryCache {
  private cache: Map<string, { value: any; expiry: number }> = new Map();
  private readonly maxSize = 1000; // 最多缓存1000个键
  private readonly defaultTTL = 60000; // 默认60秒

  set(key: string, value: any, ttlMs: number = this.defaultTTL): void {
    // 如果缓存已满，删除最旧的条目
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      value,
      expiry: Date.now() + ttlMs
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // 检查是否过期
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

/**
 * Circuit Breaker for Redis operations
 * Prevents cascading failures by temporarily bypassing Redis when it's unavailable
 */
class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime: Date | null = null;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  
  private readonly FAILURE_THRESHOLD = 5;
  private readonly COOLDOWN_MS = 30000; // 30 seconds
  
  async execute<T>(operation: () => Promise<T>): Promise<T | null> {
    // If circuit is open, check if cooldown period has passed
    if (this.state === 'OPEN') {
      const timeSinceFailure = Date.now() - this.lastFailureTime!.getTime();
      if (timeSinceFailure < this.COOLDOWN_MS) {
        return null; // Circuit still open, skip operation
      }
      this.state = 'HALF_OPEN'; // Try one request
    }
    
    try {
      const result = await operation();
      // Success - reset circuit
      this.failureCount = 0;
      this.state = 'CLOSED';
      return result;
    } catch (error) {
      this.failureCount++;
      this.lastFailureTime = new Date();
      
      if (this.failureCount >= this.FAILURE_THRESHOLD) {
        this.state = 'OPEN';
        logger.warn('Circuit breaker opened', { failureCount: this.failureCount });
      }
      
      return null;
    }
  }
  
  isAvailable(): boolean {
    return this.state !== 'OPEN';
  }
}

export class CacheService {
  private static readonly DEFAULT_TTL = 300; // 5 minutes
  private static readonly SESSION_TTL = 86400; // 24 hours
  private static readonly RANKING_TTL = 3600; // 1 hour
  private static readonly AVATAR_TTL = 86400; // 1 day
  private static readonly TASK_LIST_TTL = 300; // 5 minutes
  private static readonly USER_PROFILE_TTL = 1800; // 30 minutes
  
  private circuitBreaker: CircuitBreaker;
  private static memoryCache = new MemoryCache(); // L1 缓存
  private static enableL1Cache = true; // 是否启用L1缓存

  constructor() {
    this.circuitBreaker = new CircuitBreaker();
  }

  /**
   * Check if Redis is available (circuit breaker not open)
   */
  isAvailable(): boolean {
    return this.circuitBreaker.isAvailable();
  }

  /**
   * Get value from cache with circuit breaker
   * 支持分层缓存：先查L1（内存），再查L2（Redis）
   */
  async get<T>(key: string): Promise<T | null> {
    const startTime = Date.now();

    // L1: 尝试从内存缓存获取
    if (CacheService.enableL1Cache) {
      const l1Value = CacheService.memoryCache.get(key);
      if (l1Value !== null) {
        const responseTime = Date.now() - startTime;
        logger.debug(`L1 cache hit: ${key}, ${responseTime}ms`);
        return l1Value as T;
      }
    }

    // L2: 从 Redis 获取
    const value = await this.circuitBreaker.execute(async () => {
      const redisValue = await redisClient.get(key);
      if (!redisValue) return null;
      return JSON.parse(redisValue) as T;
    });

    // 如果从 Redis 获取到数据，写入 L1 缓存
    if (value !== null && CacheService.enableL1Cache) {
      CacheService.memoryCache.set(key, value, 60000); // L1缓存60秒
    }

    const responseTime = Date.now() - startTime;
    logger.debug(`L2 cache ${value ? 'hit' : 'miss'}: ${key}, ${responseTime}ms`);

    return value;
  }

  /**
   * Set value in cache with TTL and circuit breaker
   * 同时写入L1和L2缓存
   */
  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    // L1: 写入内存缓存
    if (CacheService.enableL1Cache) {
      CacheService.memoryCache.set(key, value, Math.min(ttlSeconds * 1000, 60000));
    }

    // L2: 写入 Redis
    await this.circuitBreaker.execute(async () => {
      await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
      return true;
    });
  }

  /**
   * Delete value from cache with circuit breaker
   * 同时删除L1和L2缓存
   */
  async delete(key: string): Promise<void> {
    // L1: 删除内存缓存
    if (CacheService.enableL1Cache) {
      CacheService.memoryCache.delete(key);
    }

    // L2: 删除 Redis
    await this.circuitBreaker.execute(async () => {
      await redisClient.del(key);
      return true;
    });
  }

  /**
   * Delete multiple keys matching a pattern with circuit breaker
   */
  async deletePattern(pattern: string): Promise<void> {
    await this.circuitBreaker.execute(async () => {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
      return true;
    });
  }

  // ============================================================================
  // Static methods for backward compatibility
  // ============================================================================

  /**
   * Get value from cache (static method for backward compatibility)
   */
  static async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redisClient.get(key);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set value in cache with TTL (static method for backward compatibility)
   */
  static async set(key: string, value: any, options?: CacheOptions): Promise<void> {
    try {
      const ttl = options?.ttl || this.DEFAULT_TTL;
      const prefixedKey = options?.prefix ? `${options.prefix}:${key}` : key;
      
      await redisClient.setEx(
        prefixedKey,
        ttl,
        JSON.stringify(value)
      );
    } catch (error) {
      logger.error(`Cache set error for key ${key}:`, error);
    }
  }

  /**
   * Delete value from cache (static method for backward compatibility)
   */
  static async delete(key: string): Promise<void> {
    try {
      await redisClient.del(key);
    } catch (error) {
      logger.error(`Cache delete error for key ${key}:`, error);
    }
  }

  /**
   * Delete multiple keys matching a pattern (static method for backward compatibility)
   */
  static async deletePattern(pattern: string): Promise<void> {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    } catch (error) {
      logger.error(`Cache delete pattern error for ${pattern}:`, error);
    }
  }

  /**
   * Check if key exists in cache
   */
  static async exists(key: string): Promise<boolean> {
    try {
      const result = await redisClient.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  // ============================================================================
  // Session Caching
  // ============================================================================

  /**
   * Store user session
   */
  static async setSession(userId: string, sessionData: any): Promise<void> {
    const key = `session:${userId}`;
    await this.set(key, sessionData, { ttl: this.SESSION_TTL });
  }

  /**
   * Get user session
   */
  static async getSession(userId: string): Promise<any | null> {
    const key = `session:${userId}`;
    return this.get(key);
  }

  /**
   * Delete user session
   */
  static async deleteSession(userId: string): Promise<void> {
    const key = `session:${userId}`;
    await this.delete(key);
  }

  /**
   * Extend session TTL
   */
  static async extendSession(userId: string): Promise<void> {
    const key = `session:${userId}`;
    try {
      await redisClient.expire(key, this.SESSION_TTL);
    } catch (error) {
      logger.error(`Session extend error for user ${userId}:`, error);
    }
  }

  // ============================================================================
  // Task List Caching
  // ============================================================================

  /**
   * Cache task list for a user
   */
  static async setTaskList(
    userId: string,
    role: 'publisher' | 'assignee',
    tasks: any[]
  ): Promise<void> {
    const key = `tasks:${role}:${userId}`;
    await this.set(key, tasks, { ttl: this.TASK_LIST_TTL });
  }

  /**
   * Get cached task list
   */
  static async getTaskList(
    userId: string,
    role: 'publisher' | 'assignee'
  ): Promise<any[] | null> {
    const key = `tasks:${role}:${userId}`;
    return this.get(key);
  }

  /**
   * Invalidate task list cache for a user
   */
  static async invalidateTaskList(userId: string): Promise<void> {
    await this.deletePattern(`tasks:*:${userId}`);
  }

  /**
   * Invalidate all task lists (when task is created/updated)
   */
  static async invalidateAllTaskLists(): Promise<void> {
    await this.deletePattern('tasks:*');
  }

  // ============================================================================
  // Ranking Caching
  // ============================================================================

  /**
   * Cache ranking data
   */
  static async setRanking(
    period: string,
    year: number,
    month: number | null,
    quarter: number | null,
    rankings: any[]
  ): Promise<void> {
    const key = `ranking:${period}:${year}:${month || 'null'}:${quarter || 'null'}`;
    await this.set(key, rankings, { ttl: this.RANKING_TTL });
  }

  /**
   * Get cached ranking data
   */
  static async getRanking(
    period: string,
    year: number,
    month: number | null,
    quarter: number | null
  ): Promise<any[] | null> {
    const key = `ranking:${period}:${year}:${month || 'null'}:${quarter || 'null'}`;
    return this.get(key);
  }

  /**
   * Invalidate ranking cache
   */
  static async invalidateRankings(): Promise<void> {
    await this.deletePattern('ranking:*');
  }

  // ============================================================================
  // Avatar Unlocking Cache
  // ============================================================================

  /**
   * Cache user's available avatars
   */
  static async setUserAvatars(userId: string, avatars: any[]): Promise<void> {
    const key = `avatars:${userId}`;
    await this.set(key, avatars, { ttl: this.AVATAR_TTL });
  }

  /**
   * Get cached user avatars
   */
  static async getUserAvatars(userId: string): Promise<any[] | null> {
    const key = `avatars:${userId}`;
    return this.get(key);
  }

  /**
   * Invalidate user avatar cache (when ranking updates)
   */
  static async invalidateUserAvatars(userId: string): Promise<void> {
    const key = `avatars:${userId}`;
    await this.delete(key);
  }

  /**
   * Invalidate all user avatar caches
   */
  static async invalidateAllAvatars(): Promise<void> {
    await this.deletePattern('avatars:*');
  }

  // ============================================================================
  // User Profile Caching
  // ============================================================================

  /**
   * Cache user profile
   */
  static async setUserProfile(userId: string, profile: any): Promise<void> {
    const key = `user:profile:${userId}`;
    await this.set(key, profile, { ttl: this.USER_PROFILE_TTL });
  }

  /**
   * Get cached user profile
   */
  static async getUserProfile(userId: string): Promise<any | null> {
    const key = `user:profile:${userId}`;
    return this.get(key);
  }

  /**
   * Invalidate user profile cache
   */
  static async invalidateUserProfile(userId: string): Promise<void> {
    const key = `user:profile:${userId}`;
    await this.delete(key);
  }

  // ============================================================================
  // Position Data Caching
  // ============================================================================

  /**
   * Cache user positions
   */
  static async setUserPositions(userId: string, positions: any[]): Promise<void> {
    const key = `positions:${userId}`;
    await this.set(key, positions, { ttl: this.USER_PROFILE_TTL });
  }

  /**
   * Get cached user positions
   */
  static async getUserPositions(userId: string): Promise<any[] | null> {
    const key = `positions:${userId}`;
    return this.get(key);
  }

  /**
   * Invalidate user positions cache
   */
  static async invalidateUserPositions(userId: string): Promise<void> {
    const key = `positions:${userId}`;
    await this.delete(key);
  }

  // ============================================================================
  // Notification Caching
  // ============================================================================

  /**
   * Cache unread notification count
   */
  static async setUnreadCount(userId: string, count: number): Promise<void> {
    const key = `notifications:unread:${userId}`;
    await this.set(key, count, { ttl: 60 }); // Short TTL for real-time updates
  }

  /**
   * Get cached unread notification count
   */
  static async getUnreadCount(userId: string): Promise<number | null> {
    const key = `notifications:unread:${userId}`;
    return this.get(key);
  }

  /**
   * Invalidate notification count cache
   */
  static async invalidateUnreadCount(userId: string): Promise<void> {
    const key = `notifications:unread:${userId}`;
    await this.delete(key);
  }

  // ============================================================================
  // Task Dependency Caching
  // ============================================================================

  /**
   * Cache task dependencies
   */
  static async setTaskDependencies(taskId: string, dependencies: any[]): Promise<void> {
    const key = `dependencies:${taskId}`;
    await this.set(key, dependencies, { ttl: this.TASK_LIST_TTL });
  }

  /**
   * Get cached task dependencies
   */
  static async getTaskDependencies(taskId: string): Promise<any[] | null> {
    const key = `dependencies:${taskId}`;
    return this.get(key);
  }

  /**
   * Invalidate task dependencies cache
   */
  static async invalidateTaskDependencies(taskId: string): Promise<void> {
    const key = `dependencies:${taskId}`;
    await this.delete(key);
  }

  // ============================================================================
  // Bounty Algorithm Caching
  // ============================================================================

  /**
   * Cache current bounty algorithm
   */
  static async setBountyAlgorithm(algorithm: any): Promise<void> {
    const key = 'bounty:algorithm:current';
    await this.set(key, algorithm, { ttl: 3600 }); // 1 hour
  }

  /**
   * Get cached bounty algorithm
   */
  static async getBountyAlgorithm(): Promise<any | null> {
    const key = 'bounty:algorithm:current';
    return this.get(key);
  }

  /**
   * Invalidate bounty algorithm cache
   */
  static async invalidateBountyAlgorithm(): Promise<void> {
    const key = 'bounty:algorithm:current';
    await this.delete(key);
  }

  // ============================================================================
  // Cache Statistics
  // ============================================================================

  /**
   * Get cache statistics
   */
  static async getStats(): Promise<any> {
    try {
      const info = await redisClient.info('stats');
      return info;
    } catch (error) {
      logger.error('Error getting cache stats:', error);
      return null;
    }
  }

  /**
   * Clear all cache
   */
  static async clearAll(): Promise<void> {
    try {
      await redisClient.flushDb();
      this.memoryCache.clear();
      logger.info('All cache cleared');
    } catch (error) {
      logger.error('Error clearing cache:', error);
    }
  }

  /**
   * 获取缓存信息（用于监控）
   */
  async getInfo(): Promise<{ memoryUsage: number; keyCount: number } | null> {
    try {
      const dbSize = await redisClient.dbSize();
      const info = await redisClient.info('memory');
      
      // 解析内存使用情况
      const memoryMatch = info.match(/used_memory:(\d+)/);
      const memoryUsage = memoryMatch ? parseInt(memoryMatch[1]) : 0;

      return {
        memoryUsage,
        keyCount: dbSize
      };
    } catch (error) {
      logger.error('获取缓存信息失败:', error);
      return null;
    }
  }

  /**
   * 获取L1缓存统计
   */
  static getL1Stats(): { size: number; enabled: boolean } {
    return {
      size: this.memoryCache.size(),
      enabled: this.enableL1Cache
    };
  }

  /**
   * 启用/禁用L1缓存
   */
  static setL1CacheEnabled(enabled: boolean): void {
    this.enableL1Cache = enabled;
    if (!enabled) {
      this.memoryCache.clear();
    }
    logger.info(`L1缓存已${enabled ? '启用' : '禁用'}`);
  }
}
