/**
 * Performance Monitoring Middleware
 * Automatically tracks API response times and other performance metrics
 */

import type { Request, Response, NextFunction } from 'express';
import { performanceMonitor } from '../utils/PerformanceMonitor.js';
import { logger } from '../config/logger.js';
import type { RealTimeMetricsService } from '../services/RealTimeMetrics.js';
import type { PerformanceAlertService } from '../services/PerformanceAlert.js';

/**
 * Middleware to track API response times
 * Integrates with RealTimeMetricsService for live monitoring
 */
export const trackPerformance = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const operation = `${req.method} ${req.route?.path || req.path}`;

  // 获取实时指标服务（如果可用）
  const metricsService = req.app.locals.metricsService as RealTimeMetricsService;
  const alertService = req.app.locals.alertService as PerformanceAlertService;
  
  // 记录活跃请求数增加
  if (metricsService) {
    metricsService.recordActiveRequests(1);
  }

  // Override res.end to capture response time
  const originalEnd = res.end;
  res.end = function(this: Response, chunk?: any, encoding?: any): any {
    const duration = Date.now() - startTime;
    const isError = res.statusCode >= 400;
    
    // Log performance metrics
    performanceMonitor.logMetrics({
      operation,
      duration,
      timestamp: new Date()
    });

    // Record metrics in RealTimeMetricsService
    if (metricsService) {
      metricsService.recordApiRequest(duration, isError);
      metricsService.recordActiveRequests(-1);
      
      // Get current metrics and check for alerts
      metricsService.getCurrentMetrics().then(metrics => {
        if (alertService) {
          alertService.checkMetrics(metrics);
        }
      }).catch(error => {
        logger.warn('Failed to check metrics for alerts:', error);
      });
    }

    // Log slow requests
    if (duration > 1000) {
      logger.warn('Slow API request detected', {
        method: req.method,
        path: req.path,
        duration,
        statusCode: res.statusCode,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      });
    }

    // Call original end method
    return originalEnd.call(this, chunk, encoding);
  } as any;

  next();
};

/**
 * Middleware to track database query performance
 */
export const trackDatabasePerformance = (queryName: string) => {
  return async <T>(queryFn: () => Promise<T>): Promise<T> => {
    return performanceMonitor.timeOperation(`db_${queryName}`, queryFn);
  };
};

/**
 * Middleware to track cache performance
 */
export const trackCachePerformance = (cacheName: string, hit: boolean) => {
  return async <T>(fn: () => Promise<T>): Promise<T> => {
    const startTime = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - startTime;
      
      performanceMonitor.logMetrics({
        operation: `cache_${cacheName}`,
        duration,
        cacheHit: hit,
        timestamp: new Date()
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      performanceMonitor.logMetrics({
        operation: `cache_${cacheName}`,
        duration,
        cacheHit: hit,
        timestamp: new Date()
      });
      
      throw error;
    }
  };
};