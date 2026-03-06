/**
 * Tests for SystemMetricsCollector
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SystemMetricsCollector } from './SystemMetricsCollector.js';

describe('SystemMetricsCollector', () => {
  let collector: SystemMetricsCollector;

  beforeEach(() => {
    collector = new SystemMetricsCollector();
  });

  afterEach(() => {
    collector.clearCache();
  });

  describe('getSystemMetrics', () => {
    it('should return system metrics with valid ranges', async () => {
      const metrics = await collector.getSystemMetrics();

      expect(metrics).toHaveProperty('cpuUsage');
      expect(metrics).toHaveProperty('memoryUsage');
      expect(metrics).toHaveProperty('diskUsage');
      expect(metrics).toHaveProperty('networkLoad');
      expect(metrics).toHaveProperty('uptime');
      expect(metrics).toHaveProperty('apiResponseTime');

      // Validate ranges
      expect(metrics.cpuUsage).toBeGreaterThanOrEqual(0);
      expect(metrics.cpuUsage).toBeLessThanOrEqual(100);
      
      expect(metrics.memoryUsage).toBeGreaterThanOrEqual(0);
      expect(metrics.memoryUsage).toBeLessThanOrEqual(100);
      
      expect(metrics.diskUsage).toBeGreaterThanOrEqual(0);
      expect(metrics.diskUsage).toBeLessThanOrEqual(100);
      
      expect(metrics.networkLoad).toBeGreaterThanOrEqual(0);
      expect(metrics.networkLoad).toBeLessThanOrEqual(100);
      
      expect(typeof metrics.uptime).toBe('string');
      expect(metrics.uptime.length).toBeGreaterThan(0);
      
      expect(metrics.apiResponseTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getCpuUsage', () => {
    it('should return CPU usage percentage', async () => {
      const cpuUsage = await collector.getCpuUsage();
      
      expect(typeof cpuUsage).toBe('number');
      expect(cpuUsage).toBeGreaterThanOrEqual(0);
      expect(cpuUsage).toBeLessThanOrEqual(100);
    });
  });

  describe('getMemoryUsage', () => {
    it('should return memory usage percentage', () => {
      const memoryUsage = collector.getMemoryUsage();
      
      expect(typeof memoryUsage).toBe('number');
      expect(memoryUsage).toBeGreaterThanOrEqual(0);
      expect(memoryUsage).toBeLessThanOrEqual(100);
    });
  });

  describe('getDiskUsage', () => {
    it('should return disk usage percentage', async () => {
      const diskUsage = await collector.getDiskUsage();
      
      expect(typeof diskUsage).toBe('number');
      expect(diskUsage).toBeGreaterThanOrEqual(0);
      expect(diskUsage).toBeLessThanOrEqual(100);
    });

    it('should use cache for subsequent calls within TTL', async () => {
      const firstCall = await collector.getDiskUsage();
      const secondCall = await collector.getDiskUsage();
      
      // Should be the same due to caching
      expect(firstCall).toBe(secondCall);
    });
  });

  describe('getNetworkLoad', () => {
    it('should return network load percentage', async () => {
      const networkLoad = await collector.getNetworkLoad();
      
      expect(typeof networkLoad).toBe('number');
      expect(networkLoad).toBeGreaterThanOrEqual(0);
      expect(networkLoad).toBeLessThanOrEqual(100);
    });

    it('should return 0 for first call (insufficient data)', async () => {
      collector.clearCache(); // Ensure no history
      const networkLoad = await collector.getNetworkLoad();
      
      expect(networkLoad).toBe(0);
    });
  });

  describe('getApiResponseTime', () => {
    it('should return API response time', () => {
      const responseTime = collector.getApiResponseTime();
      
      expect(typeof responseTime).toBe('number');
      expect(responseTime).toBeGreaterThan(0);
    });
  });

  describe('metrics collection lifecycle', () => {
    it('should start and stop metrics collection', () => {
      const interval = collector.startMetricsCollection(1000);
      expect(interval).toBeDefined();
      
      collector.stopMetricsCollection(interval);
      // Should not throw
    });
  });

  describe('cache management', () => {
    it('should clear cache', async () => {
      // Generate some cache data
      await collector.getDiskUsage();
      await collector.getNetworkLoad();
      
      // Clear cache
      collector.clearCache();
      
      // Should not throw and should work normally
      const diskUsage = await collector.getDiskUsage();
      expect(typeof diskUsage).toBe('number');
    });
  });
});