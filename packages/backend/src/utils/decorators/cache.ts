/**
 * 缓存装饰器
 * 自动缓存方法结果，减少重复计算和数据库查询
 */

import { CacheService } from '../../services/CacheService.js';
import { logger } from '../../config/logger.js';

export interface CacheOptions {
  ttl?: number; // 缓存时间（秒）
  keyGenerator?: (...args: any[]) => string; // 自定义缓存键生成器
  prefix?: string; // 缓存键前缀
  condition?: (...args: any[]) => boolean; // 缓存条件
}

/**
 * 方法结果缓存装饰器
 */
export const Cache = (options: CacheOptions = {}) => {
  const {
    ttl = 300, // 默认5分钟
    keyGenerator,
    prefix = 'method_cache',
    condition
  } = options;

  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      // 检查缓存条件
      if (condition && !condition(...args)) {
        return await originalMethod.apply(this, args);
      }

      // 生成缓存键
      let cacheKey: string;
      if (keyGenerator) {
        cacheKey = keyGenerator(...args);
      } else {
        const className = target.constructor.name;
        const argsHash = JSON.stringify(args);
        cacheKey = `${prefix}:${className}:${propertyKey}:${Buffer.from(argsHash).toString('base64')}`;
      }

      try {
        // 尝试从缓存获取
        const cached = await CacheService.get(cacheKey);
        if (cached !== null) {
          logger.debug('Cache hit', {
            key: cacheKey,
            method: `${target.constructor.name}.${propertyKey}`
          });
          return cached;
        }

        // 缓存未命中，执行原方法
        logger.debug('Cache miss', {
          key: cacheKey,
          method: `${target.constructor.name}.${propertyKey}`
        });

        const result = await originalMethod.apply(this, args);
        
        // 缓存结果
        await CacheService.set(cacheKey, result, { ttl });
        
        return result;
      } catch (error) {
        logger.error('Cache operation failed, executing method directly', {
          error: error instanceof Error ? error.message : String(error),
          method: `${target.constructor.name}.${propertyKey}`,
          key: cacheKey
        });
        
        // 缓存失败时直接执行原方法
        return await originalMethod.apply(this, args);
      }
    };
    
    return descriptor;
  };
};

/**
 * 缓存失效装饰器
 * 在方法执行后自动失效相关缓存
 */
export const CacheEvict = (options: {
  keys?: string[];
  patterns?: string[];
  keyGenerator?: (...args: any[]) => string[];
}) => {
  const { keys = [], patterns = [], keyGenerator } = options;

  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const result = await originalMethod.apply(this, args);
      
      try {
        // 失效指定的缓存键
        for (const key of keys) {
          await CacheService.delete(key);
        }
        
        // 失效匹配模式的缓存键
        for (const pattern of patterns) {
          await CacheService.deletePattern(pattern);
        }
        
        // 使用自定义键生成器失效缓存
        if (keyGenerator) {
          const keysToEvict = keyGenerator(...args);
          for (const key of keysToEvict) {
            await CacheService.delete(key);
          }
        }
        
        logger.debug('Cache evicted', {
          method: `${target.constructor.name}.${propertyKey}`,
          keys,
          patterns
        });
      } catch (error) {
        logger.error('Cache eviction failed', {
          error: error instanceof Error ? error.message : String(error),
          method: `${target.constructor.name}.${propertyKey}`
        });
      }
      
      return result;
    };
    
    return descriptor;
  };
};

/**
 * 用户相关缓存装饰器
 */
export const UserCache = (ttl: number = 1800) => {
  return Cache({
    ttl,
    prefix: 'user',
    keyGenerator: (userId: string, ...args: any[]) => {
      const argsHash = args.length > 0 ? `:${JSON.stringify(args)}` : '';
      return `user:${userId}${argsHash}`;
    }
  });
};

/**
 * 任务相关缓存装饰器
 */
export const TaskCache = (ttl: number = 300) => {
  return Cache({
    ttl,
    prefix: 'task',
    keyGenerator: (taskId: string, ...args: any[]) => {
      const argsHash = args.length > 0 ? `:${JSON.stringify(args)}` : '';
      return `task:${taskId}${argsHash}`;
    }
  });
};

/**
 * 排名相关缓存装饰器
 */
export const RankingCache = (ttl: number = 3600) => {
  return Cache({
    ttl,
    prefix: 'ranking',
    keyGenerator: (...args: any[]) => {
      return `ranking:${JSON.stringify(args)}`;
    }
  });
};

/**
 * 通知相关缓存装饰器
 */
export const NotificationCache = (ttl: number = 60) => {
  return Cache({
    ttl,
    prefix: 'notification',
    keyGenerator: (userId: string, ...args: any[]) => {
      const argsHash = args.length > 0 ? `:${JSON.stringify(args)}` : '';
      return `notification:${userId}${argsHash}`;
    }
  });
};