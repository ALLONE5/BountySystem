import { EventEmitter } from 'events';
import { logger } from '../config/logger';
import { CacheMonitorService } from './CacheMonitor';
import { SystemMetricsCollector } from '../utils/SystemMetricsCollector';

/**
 * 实时性能指标
 */
export interface RealTimeMetrics {
  timestamp: number;
  api: {
    avgResponseTime: number;
    requestsPerSecond: number;
    errorRate: number;
    activeRequests: number;
  };
  cache: {
    hitRate: number;
    avgResponseTime: number;
    memoryUsage: number;
  };
  database: {
    avgQueryTime: number;
    activeConnections: number;
    slowQueries: number;
  };
  system: {
    cpuUsage: number;
    memoryUsage: number;
    uptime: number;
  };
}

/**
 * 实时性能指标服务
 * 收集和推送实时性能数据
 */
export class RealTimeMetricsService extends EventEmitter {
  private static instance: RealTimeMetricsService;
  
  // 指标收集
  private metricsHistory: RealTimeMetrics[] = [];
  private readonly maxHistorySize = 1000; // 保留最近1000条记录
  
  // API 指标
  private apiMetrics = {
    totalRequests: 0,
    totalResponseTime: 0,
    totalErrors: 0,
    activeRequests: 0,
    requestTimestamps: [] as number[]
  };

  // 数据库指标
  private dbMetrics = {
    totalQueries: 0,
    totalQueryTime: 0,
    activeConnections: 0,
    slowQueries: 0
  };

  // 更新间隔
  private updateInterval: NodeJS.Timeout | null = null;
  private readonly updateIntervalMs = 5000; // 5秒更新一次

  private constructor(
    private cacheMonitor: CacheMonitorService,
    private systemMetrics: SystemMetricsCollector
  ) {
    super();
  }

  static getInstance(
    cacheMonitor: CacheMonitorService,
    systemMetrics: SystemMetricsCollector
  ): RealTimeMetricsService {
    if (!RealTimeMetricsService.instance) {
      RealTimeMetricsService.instance = new RealTimeMetricsService(
        cacheMonitor,
        systemMetrics
      );
    }
    return RealTimeMetricsService.instance;
  }

  /**
   * 启动实时指标收集
   */
  start(): void {
    if (this.updateInterval) {
      logger.warn('实时指标收集已在运行');
      return;
    }

    logger.info('启动实时指标收集');
    
    // 立即收集一次
    this.collectMetrics();

    // 定期收集
    this.updateInterval = setInterval(() => {
      this.collectMetrics();
    }, this.updateIntervalMs);
  }

  /**
   * 停止实时指标收集
   */
  stop(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
      logger.info('实时指标收集已停止');
    }
  }

  /**
   * 收集当前指标
   */
  private async collectMetrics(): Promise<void> {
    try {
      const metrics: RealTimeMetrics = {
        timestamp: Date.now(),
        api: this.getApiMetrics(),
        cache: await this.getCacheMetrics(),
        database: this.getDatabaseMetrics(),
        system: await this.getSystemMetrics()
      };

      // 保存到历史记录
      this.metricsHistory.push(metrics);
      if (this.metricsHistory.length > this.maxHistorySize) {
        this.metricsHistory.shift();
      }

      // 发送更新事件
      this.emit('metrics', metrics);
    } catch (error) {
      logger.error('收集实时指标失败:', error);
    }
  }

  /**
   * 获取 API 指标
   */
  private getApiMetrics() {
    const now = Date.now();
    const oneSecondAgo = now - 1000;

    // 计算最近1秒的请求数
    const recentRequests = this.apiMetrics.requestTimestamps.filter(
      ts => ts > oneSecondAgo
    );
    const requestsPerSecond = recentRequests.length;

    // 清理旧的时间戳
    this.apiMetrics.requestTimestamps = recentRequests;

    const avgResponseTime = this.apiMetrics.totalRequests > 0
      ? this.apiMetrics.totalResponseTime / this.apiMetrics.totalRequests
      : 0;

    const errorRate = this.apiMetrics.totalRequests > 0
      ? (this.apiMetrics.totalErrors / this.apiMetrics.totalRequests) * 100
      : 0;

    return {
      avgResponseTime: Math.round(avgResponseTime * 100) / 100,
      requestsPerSecond,
      errorRate: Math.round(errorRate * 100) / 100,
      activeRequests: this.apiMetrics.activeRequests
    };
  }

  /**
   * 获取缓存指标
   */
  private async getCacheMetrics() {
    const cacheMetrics = await this.cacheMonitor.getMetrics();
    
    return {
      hitRate: cacheMetrics.hitRate,
      avgResponseTime: cacheMetrics.avgResponseTime,
      memoryUsage: cacheMetrics.memoryUsage
    };
  }

  /**
   * 获取数据库指标
   */
  private getDatabaseMetrics() {
    const avgQueryTime = this.dbMetrics.totalQueries > 0
      ? this.dbMetrics.totalQueryTime / this.dbMetrics.totalQueries
      : 0;

    return {
      avgQueryTime: Math.round(avgQueryTime * 100) / 100,
      activeConnections: this.dbMetrics.activeConnections,
      slowQueries: this.dbMetrics.slowQueries
    };
  }

  /**
   * 获取系统指标
   */
  private async getSystemMetrics() {
    const metrics = await this.systemMetrics.getSystemMetrics();
    
    return {
      cpuUsage: metrics.cpuUsage,
      memoryUsage: metrics.memoryUsage,
      uptime: process.uptime()
    };
  }

  /**
   * 记录 API 请求
   */
  recordApiRequest(responseTime: number, isError: boolean = false): void {
    this.apiMetrics.totalRequests++;
    this.apiMetrics.totalResponseTime += responseTime;
    this.apiMetrics.requestTimestamps.push(Date.now());
    
    if (isError) {
      this.apiMetrics.totalErrors++;
    }
  }

  /**
   * 记录活跃请求数变化
   */
  recordActiveRequests(delta: number): void {
    this.apiMetrics.activeRequests += delta;
    if (this.apiMetrics.activeRequests < 0) {
      this.apiMetrics.activeRequests = 0;
    }
  }

  /**
   * 记录数据库查询
   */
  recordDatabaseQuery(queryTime: number, isSlow: boolean = false): void {
    this.dbMetrics.totalQueries++;
    this.dbMetrics.totalQueryTime += queryTime;
    
    if (isSlow) {
      this.dbMetrics.slowQueries++;
    }
  }

  /**
   * 记录数据库连接数
   */
  recordDatabaseConnections(count: number): void {
    this.dbMetrics.activeConnections = count;
  }

  /**
   * 获取当前指标
   */
  async getCurrentMetrics(): Promise<RealTimeMetrics> {
    return {
      timestamp: Date.now(),
      api: this.getApiMetrics(),
      cache: await this.getCacheMetrics(),
      database: this.getDatabaseMetrics(),
      system: await this.getSystemMetrics()
    };
  }

  /**
   * 获取历史指标
   * @param minutes 获取最近N分钟的数据
   */
  getHistoricalMetrics(minutes: number = 5): RealTimeMetrics[] {
    const cutoffTime = Date.now() - (minutes * 60 * 1000);
    return this.metricsHistory.filter(m => m.timestamp > cutoffTime);
  }

  /**
   * 获取指标统计
   * @param minutes 统计最近N分钟的数据
   */
  getMetricsStats(minutes: number = 5): {
    api: { min: number; max: number; avg: number };
    cache: { min: number; max: number; avg: number };
    database: { min: number; max: number; avg: number };
  } {
    const history = this.getHistoricalMetrics(minutes);
    
    if (history.length === 0) {
      return {
        api: { min: 0, max: 0, avg: 0 },
        cache: { min: 0, max: 0, avg: 0 },
        database: { min: 0, max: 0, avg: 0 }
      };
    }

    // API 响应时间统计
    const apiTimes = history.map(m => m.api.avgResponseTime);
    const apiMin = Math.min(...apiTimes);
    const apiMax = Math.max(...apiTimes);
    const apiAvg = apiTimes.reduce((a, b) => a + b, 0) / apiTimes.length;

    // 缓存命中率统计
    const cacheRates = history.map(m => m.cache.hitRate);
    const cacheMin = Math.min(...cacheRates);
    const cacheMax = Math.max(...cacheRates);
    const cacheAvg = cacheRates.reduce((a, b) => a + b, 0) / cacheRates.length;

    // 数据库查询时间统计
    const dbTimes = history.map(m => m.database.avgQueryTime);
    const dbMin = Math.min(...dbTimes);
    const dbMax = Math.max(...dbTimes);
    const dbAvg = dbTimes.reduce((a, b) => a + b, 0) / dbTimes.length;

    return {
      api: {
        min: Math.round(apiMin * 100) / 100,
        max: Math.round(apiMax * 100) / 100,
        avg: Math.round(apiAvg * 100) / 100
      },
      cache: {
        min: Math.round(cacheMin * 100) / 100,
        max: Math.round(cacheMax * 100) / 100,
        avg: Math.round(cacheAvg * 100) / 100
      },
      database: {
        min: Math.round(dbMin * 100) / 100,
        max: Math.round(dbMax * 100) / 100,
        avg: Math.round(dbAvg * 100) / 100
      }
    };
  }

  /**
   * 重置统计数据
   */
  resetStats(): void {
    this.apiMetrics = {
      totalRequests: 0,
      totalResponseTime: 0,
      totalErrors: 0,
      activeRequests: 0,
      requestTimestamps: []
    };

    this.dbMetrics = {
      totalQueries: 0,
      totalQueryTime: 0,
      activeConnections: 0,
      slowQueries: 0
    };

    logger.info('实时指标统计已重置');
  }
}
