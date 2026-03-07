import type { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger.js';
import { AuditLogService } from '../services/AuditLogService.js';
import { AuditAction, AuditResource } from '../models/AuditLog.js';

const auditLogService = new AuditLogService();

/**
 * Audit middleware to automatically log user actions
 */
export interface AuditOptions {
  action: AuditAction;
  resource: AuditResource;
  getResourceId?: (req: Request) => string;
  getDetails?: (req: Request, res: Response) => any;
  skipIf?: (req: Request) => boolean;
}

export const auditMiddleware = (options: AuditOptions) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip if condition is met
    if (options.skipIf && options.skipIf(req)) {
      return next();
    }

    // Store original res.json to capture response
    const originalJson = res.json;
    let responseData: any;
    let success = true;

    res.json = function (data: any) {
      responseData = data;
      success = res.statusCode < 400;
      return originalJson.call(this, data);
    };

    // Store original res.status to capture error status
    const originalStatus = res.status;
    res.status = function (code: number) {
      if (code >= 400) {
        success = false;
      }
      return originalStatus.call(this, code);
    };

    // Continue with the request
    next();

    // Log after response is sent
    res.on('finish', async () => {
      try {
        const user = (req as any).user;
        if (!user) {
          return; // Skip if no authenticated user
        }

        const resourceId = options.getResourceId ? options.getResourceId(req) : '';
        const details = options.getDetails ? options.getDetails(req, res) : {
          method: req.method,
          url: req.url,
          body: req.body,
          params: req.params,
          query: req.query,
          response: responseData
        };

        await auditLogService.logUserAction(
          user.userId,
          user.username,
          options.action,
          options.resource,
          resourceId,
          details,
          req.ip || req.connection.remoteAddress || '',
          req.get('User-Agent') || '',
          success
        );
      } catch (error) {
        logger.error('Audit logging failed:', error);
      }
    });
  };
};

/**
 * Predefined audit middleware for common operations
 */

// User management
export const auditUserCreate = auditMiddleware({
  action: AuditAction.CREATE_USER,
  resource: AuditResource.USER,
  getResourceId: (req) => req.body.id || '',
  getDetails: (req) => ({
    username: req.body.username,
    email: req.body.email,
    role: req.body.role
  })
});

export const auditUserUpdate = auditMiddleware({
  action: AuditAction.UPDATE_USER,
  resource: AuditResource.USER,
  getResourceId: (req) => req.params.id || req.params.userId || '',
  getDetails: (req) => ({
    updates: req.body,
    targetUserId: req.params.id || req.params.userId
  })
});

export const auditUserDelete = auditMiddleware({
  action: AuditAction.DELETE_USER,
  resource: AuditResource.USER,
  getResourceId: (req) => req.params.id || req.params.userId || '',
  getDetails: (req) => ({
    targetUserId: req.params.id || req.params.userId
  })
});

// Task management
export const auditTaskCreate = auditMiddleware({
  action: AuditAction.CREATE_TASK,
  resource: AuditResource.TASK,
  getResourceId: (req) => req.body.id || '',
  getDetails: (req) => ({
    title: req.body.title,
    bounty: req.body.bounty,
    projectGroupId: req.body.projectGroupId
  })
});

export const auditTaskUpdate = auditMiddleware({
  action: AuditAction.UPDATE_TASK,
  resource: AuditResource.TASK,
  getResourceId: (req) => req.params.id || req.params.taskId || '',
  getDetails: (req) => ({
    updates: req.body,
    taskId: req.params.id || req.params.taskId
  })
});

export const auditTaskDelete = auditMiddleware({
  action: AuditAction.DELETE_TASK,
  resource: AuditResource.TASK,
  getResourceId: (req) => req.params.id || req.params.taskId || '',
  getDetails: (req) => ({
    taskId: req.params.id || req.params.taskId
  })
});

// System configuration
export const auditSystemConfigUpdate = auditMiddleware({
  action: AuditAction.UPDATE_SYSTEM_CONFIG,
  resource: AuditResource.SYSTEM,
  getDetails: (req) => ({
    updates: req.body
  })
});

// File operations
export const auditFileUpload = auditMiddleware({
  action: AuditAction.UPLOAD_FILE,
  resource: AuditResource.FILE,
  getResourceId: (req) => (req as any).file?.filename || '',
  getDetails: (req) => ({
    originalName: (req as any).file?.originalname,
    filename: (req as any).file?.filename,
    size: (req as any).file?.size,
    mimetype: (req as any).file?.mimetype
  })
});

export const auditFileDelete = auditMiddleware({
  action: AuditAction.DELETE_FILE,
  resource: AuditResource.FILE,
  getResourceId: (req) => req.params.filename || '',
  getDetails: (req) => ({
    filename: req.params.filename
  })
});

// Bounty operations
export const auditBonusReward = auditMiddleware({
  action: AuditAction.ADD_BONUS_REWARD,
  resource: AuditResource.BOUNTY,
  getResourceId: (req) => req.params.id || req.params.taskId || '',
  getDetails: (req) => ({
    taskId: req.params.id || req.params.taskId,
    amount: req.body.amount,
    reason: req.body.reason
  })
});

/**
 * Login audit middleware (special case for authentication)
 */
export const auditLogin = async (
  username: string,
  success: boolean,
  ipAddress: string,
  userAgent: string,
  userId?: string,
  details?: any
) => {
  try {
    await auditLogService.logUserAction(
      userId || 'anonymous',
      username,
      success ? AuditAction.LOGIN : AuditAction.LOGIN_FAILED,
      AuditResource.AUTH,
      '',
      details || {},
      ipAddress,
      userAgent,
      success
    );
  } catch (error) {
    logger.error('Login audit logging failed:', error);
  }
};

/**
 * Logout audit middleware
 */
export const auditLogout = async (
  userId: string,
  username: string,
  ipAddress: string,
  userAgent: string
) => {
  try {
    await auditLogService.logUserAction(
      userId,
      username,
      AuditAction.LOGOUT,
      AuditResource.AUTH,
      '',
      {},
      ipAddress,
      userAgent,
      true
    );
  } catch (error) {
    logger.error('Logout audit logging failed:', error);
  }
};