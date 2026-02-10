/**
 * Performance Monitor Utility
 * Tracks and logs performance metrics for operations
 */

import { logger } from '../config/logger.js';

interface PerformanceMetrics {
  operation: string;
  duration: number;
  cacheHit?: boolean;
  resultCount?: number;
  timestamp: Date;
}

interface AggregatedMetrics {
  operation: string;
  count: number;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  p50Duration: number;
  p95Duration: number;
  p99Duration: number;
  cacheHitRate?: number;
}

export class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics[]> = new Map();
  private readonly MAX_METRICS_PER_OPERATION = 1000; // Keep last 1000 metrics per operation

  /**
   * Start timing an operation
   * Returns a function to stop the timer and log metrics
   */
  startTimer(operation: string): () => void {
    const startTime = Date.now();
    
    return () => {
      const duration = Date.now() - startTime;
      return duration;
    };
  }

  /**
   * Log performance metrics
   */
  logMetrics(metrics: PerformanceMetrics): void {
    // Store metrics for aggregation
    if (!this.metrics.has(metrics.operation)) {
      this.metrics.set(metrics.operation, []);
    }
    
    const operationMetrics = this.metrics.get(metrics.operation)!;
    operationMetrics.push(metrics);
    
    // Keep only the last MAX_METRICS_PER_OPERATION entries
    if (operationMetrics.length > this.MAX_METRICS_PER_OPERATION) {
      operationMetrics.shift();
    }
    
    // Log the metrics
    const logData: any = {
      operation: metrics.operation,
      duration: metrics.duration,
      timestamp: metrics.timestamp,
    };
    
    if (metrics.cacheHit !== undefined) {
      logData.cacheHit = metrics.cacheHit;
    }
    
    if (metrics.resultCount !== undefined) {
      logData.resultCount = metrics.resultCount;
    }
    
    // Log warning if operation is slow
    if (metrics.duration > 15) {
      logger.warn('Slow operation detected', logData);
    } else {
      logger.info('Operation completed', logData);
    }
  }

  /**
   * Get aggregated metrics for an operation within a time window
   * @param operation - Operation name
   * @param timeWindowMs - Time window in milliseconds (default: 1 hour)
   */
  getMetrics(operation: string, timeWindowMs: number = 3600000): AggregatedMetrics | null {
    const operationMetrics = this.metrics.get(operation);
    if (!operationMetrics || operationMetrics.length === 0) {
      return null;
    }
    
    // Filter metrics within time window
    const cutoffTime = new Date(Date.now() - timeWindowMs);
    const recentMetrics = operationMetrics.filter(m => m.timestamp >= cutoffTime);
    
    if (recentMetrics.length === 0) {
      return null;
    }
    
    // Calculate aggregated metrics
    const durations = recentMetrics.map(m => m.duration).sort((a, b) => a - b);
    const sum = durations.reduce((acc, d) => acc + d, 0);
    
    const aggregated: AggregatedMetrics = {
      operation,
      count: recentMetrics.length,
      avgDuration: sum / recentMetrics.length,
      minDuration: durations[0],
      maxDuration: durations[durations.length - 1],
      p50Duration: this.percentile(durations, 0.5),
      p95Duration: this.percentile(durations, 0.95),
      p99Duration: this.percentile(durations, 0.99),
    };
    
    // Calculate cache hit rate if applicable
    const metricsWithCacheInfo = recentMetrics.filter(m => m.cacheHit !== undefined);
    if (metricsWithCacheInfo.length > 0) {
      const cacheHits = metricsWithCacheInfo.filter(m => m.cacheHit).length;
      aggregated.cacheHitRate = (cacheHits / metricsWithCacheInfo.length) * 100;
    }
    
    return aggregated;
  }

  /**
   * Calculate percentile from sorted array
   */
  private percentile(sortedArray: number[], p: number): number {
    if (sortedArray.length === 0) return 0;
    
    const index = Math.ceil(sortedArray.length * p) - 1;
    return sortedArray[Math.max(0, index)];
  }

  /**
   * Get all tracked operations
   */
  getTrackedOperations(): string[] {
    return Array.from(this.metrics.keys());
  }

  /**
   * Clear metrics for an operation
   */
  clearMetrics(operation: string): void {
    this.metrics.delete(operation);
  }

  /**
   * Clear all metrics
   */
  clearAllMetrics(): void {
    this.metrics.clear();
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();
