import type { Request, Response, NextFunction } from 'express';
import { UserRole } from '../models/User.js';
import type { PageAccess } from '../services/PermissionService.js';
import { PermissionService } from '../services/PermissionService.js';
import { AuthenticationError, AuthorizationError } from '../utils/errors.js';

const permissionService = new PermissionService();

/**
 * Middleware to check if user has required role
 */
export const requireRole = (roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Not authenticated');
      }

      if (!roles.includes(req.user.role)) {
        throw new AuthorizationError('Insufficient permissions');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to check if user can access a specific page
 */
export const requirePageAccess = (page: PageAccess) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Not authenticated');
      }

      const hasAccess = permissionService.canAccessPage(req.user.role, page);

      if (!hasAccess) {
        throw new AuthorizationError(`Access denied to ${page}`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to check if user is admin (position admin, super admin, or developer)
 */
export const requireAdmin = requireRole([UserRole.POSITION_ADMIN, UserRole.SUPER_ADMIN, UserRole.DEVELOPER]);

/**
 * Middleware to check if user is super admin or developer
 */
export const requireSuperAdmin = requireRole([UserRole.SUPER_ADMIN, UserRole.DEVELOPER]);

/**
 * Middleware to check if user is developer only
 */
export const requireDeveloper = requireRole([UserRole.DEVELOPER]);

/**
 * Middleware to check if user can access another user's data
 */
export const requireUserDataAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AuthenticationError('Not authenticated');
    }

    const targetUserId = req.params.userId || req.params.id;

    if (!targetUserId) {
      throw new Error('User ID not provided in request');
    }

    const hasAccess = await permissionService.canAccessUserData(
      req.user.userId,
      targetUserId
    );

    if (!hasAccess) {
      throw new AuthorizationError('Cannot access this user data');
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check if user can access a task
 */
export const requireTaskAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AuthenticationError('Not authenticated');
    }

    const taskId = req.params.taskId || req.params.id;

    if (!taskId) {
      throw new Error('Task ID not provided in request');
    }

    const hasAccess = await permissionService.canAccessTask(req.user.userId, taskId);

    if (!hasAccess) {
      throw new AuthorizationError('Cannot access this task');
    }

    next();
  } catch (error) {
    next(error);
  }
};
