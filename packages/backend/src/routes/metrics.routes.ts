import type { Request, Response } from 'express';
import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { UserRole } from '../models/User.js';
import { performanceMonitor } from '../utils/PerformanceMonitor.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { queryTransformers } from '../utils/queryValidation.js';
import { sendValidationError, sendNotFound, sendUnauthorized, sendForbidden } from '../utils/responseHelpers.js';

const router = Router();

/**
 * Get performance metrics
 * GET /api/metrics/performance
 * Requires admin authentication
 */
router.get('/performance', authenticate, asyncHandler(async (req: Request, res: Response) => {
  // Check if user is admin
  if (req.user!.role !== UserRole.SUPER_ADMIN && req.user!.role !== UserRole.POSITION_ADMIN) {
    return sendForbidden(res, 'Admin access required');
  }

  // Get time window from query parameter (default: 1 hour)
  const timeWindowMs = queryTransformers.toInt(req.query.timeWindow as string, 3600000);

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
    return sendForbidden(res, 'Admin access required');
  }

  const { operation } = req.params;
  
  // Get time window from query parameter (default: 1 hour)
  const timeWindowMs = queryTransformers.toInt(req.query.timeWindow as string, 3600000);

  const metrics = performanceMonitor.getMetrics(operation, timeWindowMs);
  
  if (!metrics) {
    return sendNotFound(res);
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
    return sendForbidden(res, 'Super admin access required');
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
    return sendForbidden(res, 'Super admin access required');
  }

  performanceMonitor.clearAllMetrics();

  res.json({ message: 'All metrics cleared' });
}));

export default router;
