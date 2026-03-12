import { logger } from '../config/logger';
import { CacheService } from './CacheService';

/**
 * 缓存监控指标
 */
export interface CacheMetrics {
  hits: number;
  misses: number;
  hitRate: number;
  totalRequests: number;
  avgResponseTime: number;
  memoryUsage: number;
  keyCount: number;
  evictions: number;
  errors: number;
}

/**
 * 缓存性能统计
 */
interface CacheStats {
  key: string;
  hits: number;
  misses: number;
  avgResponseTime: number;
  lastAccessTime: Date;
}

/**
 * 缓存监控服务
 * 监控缓存性能和使用情况
 */
export class CacheMonitorService {
  private static instance: CacheMonitorService;
  
  // 全局统计
  private hits = 0;
  private misses = 0;
  private totalResponseTime = 0;
  private requestCount = 0;
  private evictions = 0;
  private errors = 0;

  // 按键统计
  private keyStats: Map<string, CacheStats> = new Map();
  
  // 监控配置
  private readonly maxKeyStatsSize = 1000; // 最多保留1000个键的统计
  private readonly statsResetInterval = 3600000; // 1小时重置一次统计

  private constructor(private cacheService: CacheService) {
    this.startPeriodicReset();
  }

  static getInstance(cacheService: CacheService): CacheMonitorService {
    if (!CacheMonitorService.instance) {
      CacheMonitorService.instance = new CacheMonitorService(cacheService);
    }
    return CacheMonitorService.instance;
  }

  /**
   * 记录缓存命中
   */
  recordHit(key: string, responseTime: number): void {
    this.hits++;
    this.requestCount++;
    this.totalResponseTime += responseTime;

    this.updateKeyStats(key, true, responseTime);
  }

  /**
   * 记录缓存未命中
   */
  recordMiss(key: string, responseTime: number): void {
    this.misses++;
    this.requestCount++;
    this.totalResponseTime += responseTime;

    this.updateKeyStats(key, false, responseTime);
  }

  /**
   * 记录缓存驱逐
   */
  recordEviction(): void {
    this.evictions++;
  }

  /**
   * 记录缓存错误
   */
  recordError(): void {
    this.errors++;
  }

  /**
   * 更新键统计
   */
  private updateKeyStats(key: string, isHit: boolean, responseTime: number): void {
    let stats = this.keyStats.get(key);

    if (!stats) {
      // 如果统计数据过多，移除最旧的
      if (this.keyStats.size >= this.maxKeyStatsSize) {
        const oldestKey = this.findOldestKey();
        if (oldestKey) {
          this.keyStats.delete(oldestKey);
        }
      }

      stats = {
        key,
        hits: 0,
        misses: 0,
        avgResponseTime: 0,
        lastAccessTime: new Date()
      };
      this.keyStats.set(key, stats);
    }

    // 更新统计
    if (isHit) {
      stats.hits++;
    } else {
      stats.misses++;
    }

    // 更新平均响应时间
    const totalRequests = stats.hits + stats.misses;
    stats.avgResponseTime = 
      (stats.avgResponseTime * (totalRequests - 1) + responseTime) / totalRequests;
    
    stats.lastAccessTime = new Date();
  }

  /**
   * 查找最旧的键
   */
  private findOldestKey(): string | null {
    let oldestKey: string | null = null;
    let oldestTime: Date | null = null;

    for (const [key, stats] of this.keyStats.entries()) {
      if (!oldestTime || stats.lastAccessTime < oldestTime) {
        oldestKey = key;
        oldestTime = stats.lastAccessTime;
      }
    }

    return oldestKey;
  }

  /**
   * 获取缓存指标
   */
  async getMetrics(): Promise<CacheMetrics> {
    const hitRate = this.requestCount > 0 
      ? (this.hits / this.requestCount) * 100 
      : 0;

    const avgResponseTime = this.requestCount > 0
      ? this.totalResponseTime / this.requestCount
      : 0;

    // 获取内存使用情况（如果可用）
    const memoryUsage = await this.getMemoryUsage();
    const keyCount = await this.getKeyCount();

    return {
      hits: this.hits,
      misses: this.misses,
      hitRate: Math.round(hitRate * 100) / 100,
      totalRequests: this.requestCount,
      avgResponseTime: Math.round(avgResponseTime * 100) / 100,
      memoryUsage,
      keyCount,
      evictions: this.evictions,
      errors: this.errors
    };
  }

  /**
   * 获取热门缓存键
   * @param limit 返回数量限制
   */
  getHotKeys(limit: number = 10): CacheStats[] {
    const sortedStats = Array.from(this.keyStats.values())
      .sort((a, b) => (b.hits + b.misses) - (a.hits + a.misses))
      .slice(0, limit);

    return sortedStats;
  }

  /**
   * 获取低效缓存键（命中率低）
   * @param limit 返回数量限制
   */
  getIneffectiveKeys(limit: number = 10): CacheStats[] {
    const sortedStats = Array.from(this.keyStats.values())
      .filter(stats => (stats.hits + stats.misses) >= 10) // 至少10次请求
      .sort((a, b) => {
        const hitRateA = a.hits / (a.hits + a.misses);
        const hitRateB = b.hits / (b.hits + b.misses);
        return hitRateA - hitRateB;
      })
      .slice(0, limit);

    return sortedStats;
  }

  /**
   * 获取慢缓存键（响应时间长）
   * @param limit 返回数量限制
   */
  getSlowKeys(limit: number = 10): CacheStats[] {
    const sortedStats = Array.from(this.keyStats.values())
      .sort((a, b) => b.avgResponseTime - a.avgResponseTime)
      .slice(0, limit);

    return sortedStats;
  }

  /**
   * 获取内存使用情况
   */
  private async getMemoryUsage(): Promise<number> {
    try {
      // 尝试从 Redis 获取内存使用情况
      const info = await this.cacheService.getInfo();
      return info?.memoryUsage || 0;
    } catch (error) {
      logger.warn('获取缓存内存使用失败:', error);
      return 0;
    }
  }

  /**
   * 获取缓存键数量
   */
  private async getKeyCount(): Promise<number> {
    try {
      const info = await this.cacheService.getInfo();
      return info?.keyCount || 0;
    } catch (error) {
      logger.warn('获取缓存键数量失败:', error);
      return 0;
    }
  }

  /**
   * 重置统计数据
   */
  resetStats(): void {
    this.hits = 0;
    this.misses = 0;
    this.totalResponseTime = 0;
    this.requestCount = 0;
    this.evictions = 0;
    this.errors = 0;
    this.keyStats.clear();

    logger.info('缓存统计数据已重置');
  }

  /**
   * 启动定期重置
   */
  private startPeriodicReset(): void {
    setInterval(() => {
      const metrics = this.getMetrics();
      logger.info('缓存性能报告:', metrics);
      
      // 不完全重置，保留键统计但重置计数器
      this.hits = 0;
      this.misses = 0;
      this.totalResponseTime = 0;
      this.requestCount = 0;
      this.evictions = 0;
      this.errors = 0;
    }, this.statsResetInterval);
  }

  /**
   * 生成性能报告
   */
  async generateReport(): Promise<string> {
    const metrics = await this.getMetrics();
    const hotKeys = this.getHotKeys(5);
    const ineffectiveKeys = this.getIneffectiveKeys(5);
    const slowKeys = this.getSlowKeys(5);

    let report = '=== 缓存性能报告 ===\n\n';
    
    report += '总体指标:\n';
    report += `  命中次数: ${metrics.hits}\n`;
    report += `  未命中次数: ${metrics.misses}\n`;
    report += `  命中率: ${metrics.hitRate}%\n`;
    report += `  总请求数: ${metrics.totalRequests}\n`;
    report += `  平均响应时间: ${metrics.avgResponseTime}ms\n`;
    report += `  内存使用: ${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB\n`;
    report += `  缓存键数量: ${metrics.keyCount}\n`;
    report += `  驱逐次数: ${metrics.evictions}\n`;
    report += `  错误次数: ${metrics.errors}\n\n`;

    if (hotKeys.length > 0) {
      report += '热门缓存键:\n';
      hotKeys.forEach((stats, index) => {
        const hitRate = (stats.hits / (stats.hits + stats.misses) * 100).toFixed(2);
        report += `  ${index + 1}. ${stats.key}\n`;
        report += `     命中率: ${hitRate}%, 平均响应: ${stats.avgResponseTime.toFixed(2)}ms\n`;
      });
      report += '\n';
    }

    if (ineffectiveKeys.length > 0) {
      report += '低效缓存键:\n';
      ineffectiveKeys.forEach((stats, index) => {
        const hitRate = (stats.hits / (stats.hits + stats.misses) * 100).toFixed(2);
        report += `  ${index + 1}. ${stats.key}\n`;
        report += `     命中率: ${hitRate}%, 请求数: ${stats.hits + stats.misses}\n`;
      });
      report += '\n';
    }

    if (slowKeys.length > 0) {
      report += '慢缓存键:\n';
      slowKeys.forEach((stats, index) => {
        report += `  ${index + 1}. ${stats.key}\n`;
        report += `     平均响应: ${stats.avgResponseTime.toFixed(2)}ms\n`;
      });
    }

    return report;
  }
}
