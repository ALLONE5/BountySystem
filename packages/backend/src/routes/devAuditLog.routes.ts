import type { Request, Response } from 'express';
import { Router } from 'express';
import { z } from 'zod';
import { AuditLogService } from '../services/AuditLogService.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireDeveloper } from '../middleware/permission.middleware.js';
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

// Apply authentication and developer permission to all routes
router.use(authenticate);
router.use(requireDeveloper);

/**
 * GET /api/dev/audit/logs
 * Get audit logs with filtering and pagination (Developer access)
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
 * GET /api/dev/audit/logs/:id
 * Get specific audit log by ID (Developer access)
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
 * GET /api/dev/audit/statistics
 * Get audit statistics (Developer access)
 */
router.get('/statistics', asyncHandler(async (req: Request, res: Response) => {
  const days = Math.min(parseInt(req.query.days as string || '30'), 90); // Max 90 days for developers
  
  const statistics = await auditLogService.getStatistics(days);
  
  res.status(200).json({
    success: true,
    data: statistics
  });
}));

/**
 * POST /api/dev/audit/export
 * Export audit logs to CSV (Developer access - limited)
 */
router.post('/export', asyncHandler(async (req: Request, res: Response) => {
  try {
    const validatedBody = exportLogsSchema.parse(req.body);
    
    // Limit export to last 30 days for developers
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const filters = {
      search: validatedBody.search,
      action: validatedBody.action,
      resource: validatedBody.resource,
      userId: validatedBody.userId,
      success: validatedBody.success ? validatedBody.success === 'true' : undefined,
      startDate: validatedBody.startDate ? 
        new Date(Math.max(new Date(validatedBody.startDate).getTime(), thirtyDaysAgo.getTime())) : 
        thirtyDaysAgo,
      endDate: validatedBody.endDate ? new Date(validatedBody.endDate) : new Date(),
    };

    const csvData = await auditLogService.exportLogs(filters);
    
    // Set headers for CSV download
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `dev_audit_logs_${timestamp}.csv`;
    
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

export default router;