import type { Request, Response } from 'express';
import { Router } from 'express';
import { z } from 'zod';
import { AuditLogService } from '../services/AuditLogService.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireSuperAdmin } from '../middleware/permission.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ValidationError } from '../utils/errors.js';

const router = Router();
const auditLogService = new AuditLogService();

// Validation schemas
const getLogsSchema = z.object({
  search: z.string().optional(),
  action: z.string().optional(),
  resource: z.string().optional(),
  userId: z.string().uuid().optional(),
  success: z.enum(['true', 'false']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.string().regex(/^\d+$/).optional(),
  pageSize: z.string().regex(/^\d+$/).optional(),
});

const exportLogsSchema = z.object({
  search: z.string().optional(),
  action: z.string().optional(),
  resource: z.string().optional(),
  userId: z.string().uuid().optional(),
  success: z.enum(['true', 'false']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// Apply authentication and super admin permission to all routes
router.use(authenticate);
router.use(requireSuperAdmin);

/**
 * GET /api/admin/audit/logs
 * Get audit logs with filtering and pagination
 */
router.get('/logs', asyncHandler(async (req: Request, res: Response) => {
  try {
    const validatedQuery = getLogsSchema.parse(req.query);
    
    const page = parseInt(validatedQuery.page || '1');
    const pageSize = Math.min(parseInt(validatedQuery.pageSize || '20'), 100); // Max 100 per page
    const offset = (page - 1) * pageSize;

    const filters = {
      search: validatedQuery.search,
      action: validatedQuery.action,
      resource: validatedQuery.resource,
      userId: validatedQuery.userId,
      success: validatedQuery.success ? validatedQuery.success === 'true' : undefined,
      startDate: validatedQuery.startDate ? new Date(validatedQuery.startDate) : undefined,
      endDate: validatedQuery.endDate ? new Date(validatedQuery.endDate) : undefined,
      limit: pageSize,
      offset
    };

    const result = await auditLogService.getLogs(filters);
    
    res.status(200).json({
      success: true,
      data: {
        logs: result.logs,
        pagination: {
          total: result.total,
          page: result.page,
          pageSize: result.pageSize,
          totalPages: Math.ceil(result.total / result.pageSize)
        }
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid query parameters', error.errors);
    }
    throw error;
  }
}));

/**
 * GET /api/admin/audit/logs/:id
 * Get specific audit log by ID
 */
router.get('/logs/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    throw new ValidationError('Invalid audit log ID');
  }

  const log = await auditLogService.getLogById(id);
  
  res.status(200).json({
    success: true,
    data: log
  });
}));

/**
 * GET /api/admin/audit/users/:userId/logs
 * Get audit logs for a specific user
 */
router.get('/users/:userId/logs', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const limit = Math.min(parseInt(req.query.limit as string || '50'), 200);
  
  if (!userId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
    throw new ValidationError('Invalid user ID');
  }

  const logs = await auditLogService.getLogsByUser(userId, limit);
  
  res.status(200).json({
    success: true,
    data: logs
  });
}));

/**
 * GET /api/admin/audit/resources/:resource/:resourceId/logs
 * Get audit logs for a specific resource
 */
router.get('/resources/:resource/:resourceId/logs', asyncHandler(async (req: Request, res: Response) => {
  const { resource, resourceId } = req.params;
  const limit = Math.min(parseInt(req.query.limit as string || '50'), 200);
  
  if (!resource || !resourceId) {
    throw new ValidationError('Resource and resource ID are required');
  }

  const logs = await auditLogService.getLogsByResource(resource, resourceId, limit);
  
  res.status(200).json({
    success: true,
    data: logs
  });
}));

/**
 * GET /api/admin/audit/failed
 * Get failed operations
 */
router.get('/failed', asyncHandler(async (req: Request, res: Response) => {
  const limit = Math.min(parseInt(req.query.limit as string || '100'), 500);
  
  const logs = await auditLogService.getFailedOperations(limit);
  
  res.status(200).json({
    success: true,
    data: logs
  });
}));

/**
 * GET /api/admin/audit/statistics
 * Get audit statistics
 */
router.get('/statistics', asyncHandler(async (req: Request, res: Response) => {
  const days = Math.min(parseInt(req.query.days as string || '30'), 365);
  
  const statistics = await auditLogService.getStatistics(days);
  
  res.status(200).json({
    success: true,
    data: statistics
  });
}));

/**
 * POST /api/admin/audit/export
 * Export audit logs to CSV
 */
router.post('/export', asyncHandler(async (req: Request, res: Response) => {
  try {
    const validatedBody = exportLogsSchema.parse(req.body);
    
    const filters = {
      search: validatedBody.search,
      action: validatedBody.action,
      resource: validatedBody.resource,
      userId: validatedBody.userId,
      success: validatedBody.success ? validatedBody.success === 'true' : undefined,
      startDate: validatedBody.startDate ? new Date(validatedBody.startDate) : undefined,
      endDate: validatedBody.endDate ? new Date(validatedBody.endDate) : undefined,
    };

    const csvData = await auditLogService.exportLogs(filters);
    
    // Set headers for CSV download
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `audit_logs_${timestamp}.csv`;
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-cache');
    
    res.status(200).send(csvData);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid export parameters', error.errors);
    }
    throw error;
  }
}));

/**
 * DELETE /api/admin/audit/cleanup
 * Clean up old audit logs
 */
router.delete('/cleanup', asyncHandler(async (req: Request, res: Response) => {
  const daysToKeep = Math.max(parseInt(req.query.daysToKeep as string || '365'), 30); // Minimum 30 days
  
  const deletedCount = await auditLogService.deleteOldLogs(daysToKeep);
  
  res.status(200).json({
    success: true,
    message: `Deleted ${deletedCount} old audit log entries`,
    data: {
      deletedCount,
      daysToKeep
    }
  });
}));

export default router;