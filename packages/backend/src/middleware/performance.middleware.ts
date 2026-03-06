/**
 * Performance Monitoring Middleware
 * Automatically tracks API response times and other performance metrics
 */

import type { Request, Response, NextFunction } from 'express';
import { performanceMonitor } from '../utils/PerformanceMonitor.js';
import { logger } from '../config/logger.js';

/**
 * Middleware to track API response times
 */
export const trackPerformance = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const operation = `${req.method} ${req.route?.path || req.path}`;

  // Override res.end to capture response time
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any) {
    const duration = Date.now() - startTime;
    
    // Log performance metrics
    performanceMonitor.logMetrics({
      operation,
      duration,
      timestamp: new Date()
    });

    // Log slow requests
    if (duration > 1000) { // > 1 second
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
    originalEnd.call(this, chunk, encoding);
  };

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