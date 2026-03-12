/**
 * 查询性能监控中间件
 * 监控数据库查询性能并提供优化建议
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger.js';
import { RealTimeMetricsService } from '../services/RealTimeMetrics.js';

export interface QueryPerformanceMetrics {
  queryCount: number;
  totalExecutionTime: number;
  slowQueries: number;
  cacheHits: number;
  cacheMisses: number;
}

class QueryPerformanceMonitor {
  private metrics: QueryPerformanceMetrics = {
    queryCount: 0,
    totalExecutionTime: 0,
    slowQueries: 0,
    cacheHits: 0,
    cacheMisses: 0
  };

  private slowQueryThreshold = 1000; // 1秒
  private metricsService?: RealTimeMetricsService;

  constructor() {
    // 定期重置指标
    setInterval(() => {
      this.resetMetrics();
    }, 60000); // 每分钟重置
  }

  setMetricsService(service: RealTimeMetricsService) {
    this.metricsService = service;
  }

  recordQuery(executionTime: number, fromCache: boolean = false) {
    this.metrics.queryCount++;
    this.metrics.totalExecutionTime += executionTime;

    if (fromCache) {
      this.metrics.cacheHits++;
    } else {
      this.metrics.cacheMisses++;
    }

    if (executionTime > this.slowQueryThreshold) {
      this.metrics.slowQueries++;
      logger.warn('Slow query detected', {
        executionTime,
        threshold: this.slowQueryThreshold
      });
    }

    // 发送实时指标
    if (this.metricsService) {
      this.metricsService.recordDatabaseQuery(executionTime, executionTime > this.slowQueryThreshold);
    }
  }

  getMetrics(): QueryPerformanceMetrics & {
    avgExecutionTime: number;
    cacheHitRate: number;
    slowQueryRate: number;
  } {
    const avgExecutionTime = this.metrics.queryCount > 0 
      ? this.metrics.totalExecutionTime / this.metrics.queryCount 
      : 0;

    const totalCacheRequests = this.metrics.cacheHits + this.metrics.cacheMisses;
    const cacheHitRate = totalCacheRequests > 0 
      ? this.metrics.cacheHits / totalCacheRequests 
      : 0;

    const slowQueryRate = this.metrics.queryCount > 0 
      ? this.metrics.slowQueries / this.metrics.queryCount 
      : 0;

    return {
      ...this.metrics,
      avgExecutionTime,
      cacheHitRate,
      slowQueryRate
    };
  }

  private resetMetrics() {
    const currentMetrics = this.getMetrics();
    
    // 记录周期性指标
    logger.info('Query performance metrics', currentMetrics);

    // 重置计数器
    this.metrics = {
      queryCount: 0,
      totalExecutionTime: 0,
      slowQueries: 0,
      cacheHits: 0,
      cacheMisses: 0
    };
  }

  setSlowQueryThreshold(threshold: number) {
    this.slowQueryThreshold = threshold;
  }
}

// 全局实例
export const queryPerformanceMonitor = new QueryPerformanceMonitor();

/**
 * 查询性能监控中间件
 */
export const queryPerformanceMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  // 拦截响应结束事件
  const originalEnd = res.end.bind(res);
  res.end = function(chunk?: any, encoding?: any, callback?: any): any {
    const executionTime = Date.now() - startTime;
    
    // 记录请求性能（作为查询性能的代理指标）
    queryPerformanceMonitor.recordQuery(executionTime);

    // 添加性能头
    res.setHeader('X-Query-Time', executionTime.toString());
    
    // 调用原始的end方法
    return originalEnd(chunk, encoding, callback);
  } as any;

  next();
};

/**
 * 获取查询性能报告
 */
export const getQueryPerformanceReport = (req: Request, res: Response) => {
  const metrics = queryPerformanceMonitor.getMetrics();
  
  const report = {
    timestamp: new Date().toISOString(),
    metrics,
    recommendations: generatePerformanceRecommendations(metrics),
    status: getPerformanceStatus(metrics)
  };

  res.json({
    success: true,
    data: report
  });
};

/**
 * 生成性能优化建议
 */
function generatePerformanceRecommendations(metrics: ReturnType<typeof queryPerformanceMonitor.getMetrics>): string[] {
  const recommendations: string[] = [];

  if (metrics.avgExecutionTime > 500) {
    recommendations.push('平均查询时间较长，考虑优化查询或添加索引');
  }

  if (metrics.slowQueryRate > 0.1) {
    recommendations.push('慢查询比例较高，需要分析和优化慢查询');
  }

  if (metrics.cacheHitRate < 0.7) {
    recommendations.push('缓存命中率较低，考虑优化缓存策略');
  }

  if (metrics.queryCount > 1000) {
    recommendations.push('查询频率较高，考虑实施查询合并或批处理');
  }

  if (recommendations.length === 0) {
    recommendations.push('查询性能良好，继续保持');
  }

  return recommendations;
}

/**
 * 获取性能状态
 */
function getPerformanceStatus(metrics: ReturnType<typeof queryPerformanceMonitor.getMetrics>): 'excellent' | 'good' | 'warning' | 'critical' {
  if (metrics.avgExecutionTime > 2000 || metrics.slowQueryRate > 0.2) {
    return 'critical';
  }
  
  if (metrics.avgExecutionTime > 1000 || metrics.slowQueryRate > 0.1 || metrics.cacheHitRate < 0.5) {
    return 'warning';
  }
  
  if (metrics.avgExecutionTime > 500 || metrics.cacheHitRate < 0.8) {
    return 'good';
  }
  
  return 'excellent';
}