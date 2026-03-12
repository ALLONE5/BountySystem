import { logger } from '../config/logger';
import { CacheService } from './CacheService';

/**
 * 缓存失效策略服务
 * 智能管理缓存失效，支持级联失效和延迟失效
 */
export class CacheInvalidationService {
  private static instance: CacheInvalidationService;
  private invalidationQueue: Map<string, NodeJS.Timeout> = new Map();

  // 缓存依赖关系映射
  private readonly dependencyMap: Record<string, string[]> = {
    // 用户相关
    'user': ['user:*', 'ranking:*', 'task:assigned:*'],
    'user:profile': ['user:*'],
    
    // 任务相关
    'task': ['task:*', 'task:list:*', 'task:stats:*', 'group:tasks:*'],
    'task:status': ['task:*', 'task:list:*', 'task:stats:*'],
    'task:assignment': ['task:assigned:*', 'user:tasks:*'],
    
    // 项目组相关
    'group': ['group:*', 'group:list:*', 'group:stats:*'],
    'group:members': ['group:*', 'user:groups:*'],
    
    // 排名相关
    'ranking': ['ranking:*', 'ranking:list:*'],
    
    // 系统配置
    'system:config': ['system:config:*'],
    
    // 岗位相关
    'position': ['position:*', 'position:list:*']
  };

  private constructor(private cacheService: CacheService) {}

  static getInstance(cacheService: CacheService): CacheInvalidationService {
    if (!CacheInvalidationService.instance) {
      CacheInvalidationService.instance = new CacheInvalidationService(cacheService);
    }
    return CacheInvalidationService.instance;
  }

  /**
   * 使缓存失效
   * @param key 缓存键
   * @param cascade 是否级联失效相关缓存
   */
  async invalidate(key: string, cascade: boolean = true): Promise<void> {
    try {
      // 删除主缓存
      await this.cacheService.delete(key);
      logger.debug(`缓存失效: ${key}`);

      // 级联失效相关缓存
      if (cascade) {
        await this.cascadeInvalidate(key);
      }
    } catch (error) {
      logger.error(`缓存失效失败: ${key}`, error);
      throw error;
    }
  }

  /**
   * 延迟失效
   * 在指定延迟后使缓存失效，避免频繁更新
   * @param key 缓存键
   * @param delayMs 延迟时间（毫秒）
   * @param cascade 是否级联失效
   */
  async invalidateDelayed(
    key: string,
    delayMs: number = 1000,
    cascade: boolean = true
  ): Promise<void> {
    // 取消之前的延迟失效
    const existingTimeout = this.invalidationQueue.get(key);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // 设置新的延迟失效
    const timeout = setTimeout(async () => {
      await this.invalidate(key, cascade);
      this.invalidationQueue.delete(key);
    }, delayMs);

    this.invalidationQueue.set(key, timeout);
    logger.debug(`延迟缓存失效: ${key}, 延迟: ${delayMs}ms`);
  }

  /**
   * 批量失效
   * @param keys 缓存键数组
   * @param cascade 是否级联失效
   */
  async invalidateBatch(keys: string[], cascade: boolean = true): Promise<void> {
    try {
      await Promise.all(
        keys.map(key => this.invalidate(key, cascade))
      );
      logger.debug(`批量缓存失效: ${keys.length} 个键`);
    } catch (error) {
      logger.error('批量缓存失效失败:', error);
      throw error;
    }
  }

  /**
   * 按模式失效
   * @param pattern 缓存键模式（支持通配符 *）
   */
  async invalidateByPattern(pattern: string): Promise<void> {
    try {
      await this.cacheService.deletePattern(pattern);
      logger.debug(`按模式缓存失效: ${pattern}`);
    } catch (error) {
      logger.error(`按模式缓存失效失败: ${pattern}`, error);
      throw error;
    }
  }

  /**
   * 级联失效相关缓存
   * @param key 缓存键
   */
  private async cascadeInvalidate(key: string): Promise<void> {
    // 提取缓存类型
    const cacheType = this.extractCacheType(key);
    
    // 获取依赖的缓存模式
    const dependentPatterns = this.dependencyMap[cacheType];
    
    if (!dependentPatterns || dependentPatterns.length === 0) {
      return;
    }

    // 失效所有依赖的缓存
    await Promise.all(
      dependentPatterns.map(pattern => 
        this.invalidateByPattern(pattern).catch(err => {
          logger.warn(`级联失效失败: ${pattern}`, err);
        })
      )
    );

    logger.debug(`级联失效完成: ${cacheType} -> ${dependentPatterns.join(', ')}`);
  }

  /**
   * 提取缓存类型
   * @param key 缓存键
   */
  private extractCacheType(key: string): string {
    // 提取缓存键的前缀作为类型
    const parts = key.split(':');
    
    if (parts.length >= 2) {
      return `${parts[0]}:${parts[1]}`;
    }
    
    return parts[0];
  }

  /**
   * 用户相关缓存失效
   */
  async invalidateUserCache(userId: number): Promise<void> {
    await this.invalidateBatch([
      `user:${userId}`,
      `user:profile:${userId}`,
      `user:tasks:${userId}`,
      `user:groups:${userId}`
    ]);
  }

  /**
   * 任务相关缓存失效
   */
  async invalidateTaskCache(taskId: number): Promise<void> {
    await this.invalidateBatch([
      `task:${taskId}`,
      `task:details:${taskId}`,
      `task:comments:${taskId}`,
      `task:attachments:${taskId}`
    ]);
    
    // 延迟失效列表缓存，避免频繁更新
    await this.invalidateDelayed('task:list:*', 2000);
    await this.invalidateDelayed('task:stats:*', 2000);
  }

  /**
   * 项目组相关缓存失效
   */
  async invalidateGroupCache(groupId: number): Promise<void> {
    await this.invalidateBatch([
      `group:${groupId}`,
      `group:details:${groupId}`,
      `group:members:${groupId}`,
      `group:tasks:${groupId}`
    ]);
    
    // 延迟失效列表缓存
    await this.invalidateDelayed('group:list:*', 2000);
    await this.invalidateDelayed('group:stats:*', 2000);
  }

  /**
   * 排名相关缓存失效
   */
  async invalidateRankingCache(): Promise<void> {
    await this.invalidateByPattern('ranking:*');
  }

  /**
   * 系统配置缓存失效
   */
  async invalidateSystemConfigCache(): Promise<void> {
    await this.invalidateByPattern('system:config:*');
  }

  /**
   * 清理所有待处理的延迟失效
   */
  clearPendingInvalidations(): void {
    this.invalidationQueue.forEach(timeout => clearTimeout(timeout));
    this.invalidationQueue.clear();
    logger.debug('清理所有待处理的延迟失效');
  }

  /**
   * 获取待处理的延迟失效数量
   */
  getPendingInvalidationsCount(): number {
    return this.invalidationQueue.size;
  }
}
