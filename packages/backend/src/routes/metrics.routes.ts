import type { Request, Response } from 'express';
import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { UserRole } from '../models/User.js';
import { performanceMonitor } from '../utils/PerformanceMonitor.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

/**
 * Get performance metrics
 * GET /api/metrics/performance
 * Requires admin authentication
 */
router.get('/performance', authenticate, asyncHandler(async (req: Request, res: Response) => {
  // Check if user is admin
  if (req.user!.role !== UserRole.SUPER_ADMIN && req.user!.role !== UserRole.POSITION_ADMIN) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  // Get time window from query parameter (default: 1 hour)
  const timeWindowMs = req.query.timeWindow 
    ? parseInt(req.query.timeWindow as string) 
    : 3600000; // 1 hour

  // Get all tracked operations
  const operations = performanceMonitor.getTrackedOperations();
  
  // Get metrics for each operation
  const metrics: any = {};
  for (const operation of operations) {
    const operationMetrics = performanceMonitor.getMetrics(operation, timeWindowMs);
    if (operationMetrics) {
      metrics[operation] = operationMetrics;
    }
  }

  res.json({
    timeWindowMs,
    operations: metrics,
  });
}));

/**
 * Get metrics for a specific operation
 * GET /api/metrics/performance/:operation
 * Requires admin authentication
 */
router.get('/performance/:operation', authenticate, asyncHandler(async (req: Request, res: Response) => {
  // Check if user is admin
  if (req.user!.role !== UserRole.SUPER_ADMIN && req.user!.role !== UserRole.POSITION_ADMIN) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { operation } = req.params;
  
  // Get time window from query parameter (default: 1 hour)
  const timeWindowMs = req.query.timeWindow 
    ? parseInt(req.query.timeWindow as string) 
    : 3600000; // 1 hour

  const metrics = performanceMonitor.getMetrics(operation, timeWindowMs);
  
  if (!metrics) {
    return res.status(404).json({ error: 'No metrics found for this operation' });
  }

  res.json(metrics);
}));

/**
 * Clear metrics for an operation
 * DELETE /api/metrics/performance/:operation
 * Requires super admin authentication
 */
router.delete('/performance/:operation', authenticate, asyncHandler(async (req: Request, res: Response) => {
  // Check if user is super admin
  if (req.user!.role !== UserRole.SUPER_ADMIN) {
    return res.status(403).json({ error: 'Super admin access required' });
  }

  const { operation } = req.params;
  performanceMonitor.clearMetrics(operation);

  res.json({ message: `Metrics cleared for operation: ${operation}` });
}));

/**
 * Clear all metrics
 * DELETE /api/metrics/performance
 * Requires super admin authentication
 */
router.delete('/performance', authenticate, asyncHandler(async (req: Request, res: Response) => {
  // Check if user is super admin
  if (req.user!.role !== UserRole.SUPER_ADMIN) {
    return res.status(403).json({ error: 'Super admin access required' });
  }

  performanceMonitor.clearAllMetrics();

  res.json({ message: 'All metrics cleared' });
}));

export default router;
