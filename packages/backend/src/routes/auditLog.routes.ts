import type { Request, Response } from 'express';
import { Router } from 'express';
import { z } from 'zod';
import { AuditLogService } from '../services/AuditLogService.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireSuperAdmin, requireDeveloper } from '../middleware/permission.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ValidationError } from '../utils/errors.js';
import { parsePagination, createPaginatedResponse } from '../utils/pagination.js';
import { createSearchSchema, queryTransformers } from '../utils/queryValidation.js';

const adminRouter = Router();
const devRouter = Router();
const auditLogService = new AuditLogService();

// Validation schemas using utility
const getLogsSchema = createSearchSchema({
  action: z.string().optional(),
  resource: z.string().optional(),
  userId: z.string().uuid().optional(),
  success: z.enum(['true', 'false']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
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

// Shared handler for getting logs
const getLogsHandler = asyncHandler(async (req: Request, res: Response) => {
  try {
    const validatedQuery = getLogsSchema.parse(req.query) as any;
    
    // Use pagination utility
    const { page, pageSize, offset, limit } = parsePagination({
      page: validatedQuery.page,
      pageSize: validatedQuery.pageSize,
      maxPageSize: 100
    });

    const filters = {
      search: validatedQuery.search,
      action: validatedQuery.action,
      resource: validatedQuery.resource,
      userId: validatedQuery.userId,
      success: queryTransformers.toBoolean(validatedQuery.success),
      startDate: queryTransformers.toDate(validatedQuery.startDate),
      endDate: queryTransformers.toDate(validatedQuery.endDate),
      limit,
      offset
    };

    const result = await auditLogService.getLogs(filters);
    
    // Use pagination response utility
    res.status(200).json({
      success: true,
      data: createPaginatedResponse(result.logs, page, pageSize, result.total)
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid query parameters', error.errors);
    }
    throw error;
  }
});

// Shared handler for getting log by ID
const getLogByIdHandler = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    throw new ValidationError('Invalid audit log ID');
  }

  const log = await auditLogService.getLogById(id);
  
  res.status(200).json({
    success: true,
    data: log
  });
});

// Shared handler for statistics
const getStatisticsHandler = (maxDays: number) => asyncHandler(async (req: Request, res: Response) => {
  const days = queryTransformers.toIntBounded(req.query.days as string, 30, 1, maxDays);
  
  const statistics = await auditLogService.getStatistics(days);
  
  res.status(200).json({
    success: true,
    data: statistics
  });
});

// Shared handler for export
const exportLogsHandler = (maxDaysBack?: number) => asyncHandler(async (req: Request, res: Response) => {
  try {
    const validatedBody = exportLogsSchema.parse(req.body);
    
    let filters: any = {
      search: validatedBody.search,
      action: validatedBody.action,
      resource: validatedBody.resource,
      userId: validatedBody.userId,
      success: queryTransformers.toBoolean(validatedBody.success),
      startDate: queryTransformers.toDate(validatedBody.startDate),
      endDate: queryTransformers.toDate(validatedBody.endDate),
    };

    // Apply date restrictions for developers
    if (maxDaysBack) {
      const limitDate = new Date();
      limitDate.setDate(limitDate.getDate() - maxDaysBack);
      
      if (filters.startDate) {
        filters.startDate = new Date(Math.max(filters.startDate.getTime(), limitDate.getTime()));
      } else {
        filters.startDate = limitDate;
      }
      
      if (!filters.endDate) {
        filters.endDate = new Date();
      }
    }

    const csvData = await auditLogService.exportLogs(filters);
    
    // Set headers for CSV download
    const timestamp = new Date().toISOString().split('T')[0];
    const prefix = maxDaysBack ? 'dev_' : '';
    const filename = `${prefix}audit_logs_${timestamp}.csv`;
    
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
});

// ============================================
// ADMIN ROUTES (Super Admin only)
// ============================================
adminRouter.use(authenticate);
adminRouter.use(requireSuperAdmin);

/**
 * GET /api/admin/audit/logs
 * Get audit logs with filtering and pagination
 */
adminRouter.get('/logs', getLogsHandler);

/**
 * GET /api/admin/audit/logs/:id
 * Get specific audit log by ID
 */
adminRouter.get('/logs/:id', getLogByIdHandler);

/**
 * GET /api/admin/audit/users/:userId/logs
 * Get audit logs for a specific user
 */
adminRouter.get('/users/:userId/logs', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const limit = queryTransformers.toIntBounded(req.query.limit as string, 50, 1, 200);
  
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
adminRouter.get('/resources/:resource/:resourceId/logs', asyncHandler(async (req: Request, res: Response) => {
  const { resource, resourceId } = req.params;
  const limit = queryTransformers.toIntBounded(req.query.limit as string, 50, 1, 200);
  
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
adminRouter.get('/failed', asyncHandler(async (req: Request, res: Response) => {
  const limit = queryTransformers.toIntBounded(req.query.limit as string, 100, 1, 500);
  
  const logs = await auditLogService.getFailedOperations(limit);
  
  res.status(200).json({
    success: true,
    data: logs
  });
}));

/**
 * GET /api/admin/audit/statistics
 * Get audit statistics (up to 365 days)
 */
adminRouter.get('/statistics', getStatisticsHandler(365));

/**
 * POST /api/admin/audit/export
 * Export audit logs to CSV (no date restrictions)
 */
adminRouter.post('/export', exportLogsHandler());

/**
 * DELETE /api/admin/audit/cleanup
 * Clean up old audit logs
 */
adminRouter.delete('/cleanup', asyncHandler(async (req: Request, res: Response) => {
  const daysToKeep = queryTransformers.toIntBounded(req.query.daysToKeep as string, 365, 30, 3650);
  
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

// ============================================
// DEVELOPER ROUTES (Developer role)
// ============================================
devRouter.use(authenticate);
devRouter.use(requireDeveloper);

/**
 * GET /api/dev/audit/logs
 * Get audit logs with filtering and pagination (Developer access)
 */
devRouter.get('/logs', getLogsHandler);

/**
 * GET /api/dev/audit/logs/:id
 * Get specific audit log by ID (Developer access)
 */
devRouter.get('/logs/:id', getLogByIdHandler);

/**
 * GET /api/dev/audit/statistics
 * Get audit statistics (up to 90 days for developers)
 */
devRouter.get('/statistics', getStatisticsHandler(90));

/**
 * POST /api/dev/audit/export
 * Export audit logs to CSV (limited to last 30 days)
 */
devRouter.post('/export', exportLogsHandler(30));

// Export both routers
export { adminRouter, devRouter };
export default adminRouter;
