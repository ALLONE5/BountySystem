import type { Request, Response, NextFunction } from 'express';
import { Router } from 'express';
import { z } from 'zod';
import { UserService } from '../services/UserService.js';
import { PermissionService, PageAccess } from '../services/PermissionService.js';
import { TaskService } from '../services/TaskService.js';
import { PositionService } from '../services/PositionService.js';
import { GroupService } from '../services/GroupService.js';
import { NotificationService } from '../services/NotificationService.js';
import { ValidationError, AuthenticationError, AuthorizationError } from '../utils/errors.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { UserRole } from '../models/User.js';
import { Visibility } from '../models/Task.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { resolve } from '../config/container.js';
import { Validator } from '../utils/Validator.js';

const router = Router();
// Use DI container to get properly configured services
const userService = resolve<UserService>('userService');
const permissionService = new PermissionService();
const taskService = resolve<TaskService>('taskService');
const positionService = resolve<PositionService>('positionService');
const groupService = resolve<GroupService>('groupService');
const notificationService = new NotificationService();

// Apply authentication middleware to all routes
router.use(authenticate);

// Validation schemas
const updateUserSchema = z.object({
  username: z.string().min(1).optional(),
  email: z.string().email().optional(),
  avatarId: z.string().uuid().optional(),
  role: z.nativeEnum(UserRole).optional(),
  positionIds: z.array(z.string().uuid()).optional(),
  managedPositionIds: z.array(z.string().uuid()).optional(),
});

const updateTaskSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  plannedStartDate: z.coerce.date().optional(),
  plannedEndDate: z.coerce.date().optional(),
  estimatedHours: z.number().positive().optional(),
  complexity: z.number().int().min(1).max(5).optional(),
  priority: z.number().int().min(1).max(5).optional(),
  positionId: z.string().uuid().optional(),
  visibility: z.nativeEnum(Visibility).optional(),
});

const approveApplicationSchema = z.object({
  approved: z.boolean(),
  reviewComment: z.string().optional(),
});

/**
 * Middleware to verify admin access
 */
const requireAdmin = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const userId = (req as any).user?.userId;
  const userRole = (req as any).user?.role;

  if (!userId || !userRole) {
    throw new AuthenticationError('Not authenticated');
  }

  // Check if user has admin role (including developer)
  if (userRole !== UserRole.POSITION_ADMIN && userRole !== UserRole.SUPER_ADMIN && userRole !== UserRole.DEVELOPER) {
    throw new AuthorizationError('Admin access required');
  }

  next();
});

// Apply admin middleware to all routes
router.use(requireAdmin);

// ============================================================================
// USER MANAGEMENT ROUTES
// Requirements: 15.1, 15.2, 15.3, 15.4, 15.5
// ============================================================================

/**
 * GET /api/admin/users
 * Get all users (filtered by admin permissions)
 * - Super admin: sees all users
 * - Position admin: sees only users with their managed positions
 */
router.get('/users', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const userRole = (req as any).user?.role;

    // Verify page access
    permissionService.verifyPageAccess(userRole, PageAccess.USER_MANAGEMENT);

    let users;

    if (Validator.isSuperAdmin(userRole)) {
      // Super admin sees all users
      users = await userService.getAllUsers();
    } else if (userRole === UserRole.POSITION_ADMIN) {
      // Position admin sees only users with their managed positions
      const managedPositions = await permissionService.getManagedPositions(userId);
      users = await userService.getUsersByPositions(managedPositions);
    } else {
      throw new AuthorizationError('Insufficient permissions');
    }

    // Convert to response format (remove sensitive data)
    const userResponses = users.map((user) => userService.toUserResponse(user));

    res.status(200).json({
      users: userResponses,
      count: userResponses.length,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/users/:userId
 * Get user details with positions
 */
router.get('/users/:userId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requestingUserId = (req as any).user?.userId;
    const userRole = (req as any).user?.role;
    const { userId } = req.params;

    // Verify page access
    permissionService.verifyPageAccess(userRole, PageAccess.USER_MANAGEMENT);

    // Check if admin can access this user's data
    const canAccess = await permissionService.canAccessUserData(requestingUserId, userId);
    if (!canAccess) {
      throw new AuthorizationError('Cannot access this user data');
    }

    const user = await userService.getUserWithPositions(userId);

    res.status(200).json({
      user: {
        ...userService.toUserResponse(user),
        positions: user.positions,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/admin/users/:userId
 * Update user information (admin only)
 */
router.put('/users/:userId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requestingUserId = (req as any).user?.userId;
    const userRole = (req as any).user?.role;
    const { userId } = req.params;

    // Verify page access
    permissionService.verifyPageAccess(userRole, PageAccess.USER_MANAGEMENT);

    // Check if admin can access this user's data
    const canAccess = await permissionService.canAccessUserData(requestingUserId, userId);
    if (!canAccess) {
      throw new AuthorizationError('Cannot modify this user');
    }

    // Validate input
    const validatedData = updateUserSchema.parse(req.body);

    // Only super admin can change roles
    if (validatedData.role && userRole !== UserRole.SUPER_ADMIN) {
      throw new AuthorizationError('Only super admin can change user roles');
    }

    // Track changes for notification
    const changes: string[] = [];
    const currentUser = await userService.findById(userId);
    
    if (currentUser) {
      if (validatedData.role && validatedData.role !== currentUser.role) {
        changes.push(`角色变更 (${currentUser.role} -> ${validatedData.role})`);
      }
    }

    // Update user
    const updatedUser = await userService.updateUserByAdmin(userId, validatedData);

    // Update positions if provided
    if (validatedData.positionIds) {
      // Check if positions actually changed
      const currentPositions = await positionService.getUserPositions(userId);
      const currentPositionIds = currentPositions.map(p => p.id).sort();
      const newPositionIds = [...validatedData.positionIds].sort();
      
      const positionsChanged = JSON.stringify(currentPositionIds) !== JSON.stringify(newPositionIds);
      
      await userService.updateUserPositions(userId, validatedData.positionIds);
      
      if (positionsChanged) {
        changes.push('岗位分配变更');
      }
    }

    // Update managed positions if provided
    if (validatedData.managedPositionIds) {
      // Only super admin or position admin can update managed positions?
      // Actually, usually only super admin assigns position admins.
      if (userRole !== UserRole.SUPER_ADMIN) {
         // Maybe allow position admin to assign sub-admins? 
         // For now, let's restrict to Super Admin or if the user is updating themselves (unlikely here)
         // But wait, the requirement says "Each position admin needs to explicitly define positions they manage".
         // Let's assume Super Admin does this configuration.
         throw new AuthorizationError('Only super admin can update managed positions');
      }
      
      await userService.updateUserManagedPositions(userId, validatedData.managedPositionIds);
      changes.push('管理岗位变更');
    }

    // Send notification if there are changes
    if (changes.length > 0) {
      await notificationService.notifyAccountUpdated(userId, changes);
    }

    res.status(200).json({
      message: 'User updated successfully',
      user: userService.toUserResponse(await userService.getUserWithPositions(userId)),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new ValidationError('Invalid input data', error.errors));
    } else {
      next(error);
    }
  }
});

/**
 * DELETE /api/admin/users/:userId
 * Delete user (super admin only)
 */
router.delete('/users/:userId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userRole = (req as any).user?.role;
    const { userId } = req.params;

    // Only super admin can delete users
    if (userRole !== UserRole.SUPER_ADMIN) {
      throw new AuthorizationError('Only super admin can delete users');
    }

    // Delete user
    await userService.deleteUser(userId);

    res.status(200).json({
      message: 'User deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/users/:userId/tasks
 * Get tasks assigned to a specific user
 */
router.get('/users/:userId/tasks', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const userRole = (req as any).user?.role;
    const targetUserId = req.params.userId;

    // Verify page access
    permissionService.verifyPageAccess(userRole, PageAccess.USER_MANAGEMENT);

    // Get tasks assigned to the user
    const tasks = await taskService.getTasksByUser(targetUserId, 'assignee');

    res.status(200).json({ tasks });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// TASK MANAGEMENT ROUTES
// Requirements: 16.1, 16.2, 16.3, 16.4, 16.5
// ============================================================================

/**
 * GET /api/admin/tasks
 * Get all tasks (filtered by admin permissions)
 * - Super admin: sees all tasks
 * - Position admin: sees only tasks related to their managed positions
 */
router.get('/tasks', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const userRole = (req as any).user?.role;

    // Verify page access
    permissionService.verifyPageAccess(userRole, PageAccess.TASK_MANAGEMENT);

    let tasks;

    if (Validator.isSuperAdmin(userRole)) {
      // Super admin sees all tasks
      tasks = await taskService.getAllTasks();
    } else if (userRole === UserRole.POSITION_ADMIN) {
      // Position admin sees only tasks related to their managed positions
      const managedPositions = await permissionService.getManagedPositions(userId);
      tasks = await taskService.getTasksByPositions(managedPositions);
    } else {
      throw new AuthorizationError('Insufficient permissions');
    }

    res.status(200).json({
      tasks,
      count: tasks.length,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/tasks/:taskId
 * Get task details
 */
router.get('/tasks/:taskId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const userRole = (req as any).user?.role;
    const { taskId } = req.params;

    // Verify page access
    permissionService.verifyPageAccess(userRole, PageAccess.TASK_MANAGEMENT);

    // Check if admin can access this task
    const canAccess = await permissionService.canAccessTask(userId, taskId);
    if (!canAccess) {
      throw new AuthorizationError('Cannot access this task');
    }

    const task = await taskService.getTask(taskId);

    res.status(200).json({ task });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/admin/tasks/:taskId
 * Update task (admin only)
 */
router.put('/tasks/:taskId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const userRole = (req as any).user?.role;
    const { taskId } = req.params;

    // Verify page access
    permissionService.verifyPageAccess(userRole, PageAccess.TASK_MANAGEMENT);

    // Check if admin can access this task
    const canAccess = await permissionService.canAccessTask(userId, taskId);
    if (!canAccess) {
      throw new AuthorizationError('Cannot modify this task');
    }

    // Validate input
    const validatedData = updateTaskSchema.parse(req.body);

    // Update task
    const updatedTask = await taskService.updateTask(taskId, validatedData);

    res.status(200).json({
      message: 'Task updated successfully',
      task: updatedTask,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new ValidationError('Invalid input data', error.errors));
    } else {
      next(error);
    }
  }
});

/**
 * DELETE /api/admin/tasks/:taskId
 * Delete task (admin only)
 */
router.delete('/tasks/:taskId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const userRole = (req as any).user?.role;
    const { taskId } = req.params;

    // Verify page access
    permissionService.verifyPageAccess(userRole, PageAccess.TASK_MANAGEMENT);

    // Check if admin can access this task
    const canAccess = await permissionService.canAccessTask(userId, taskId);
    if (!canAccess) {
      throw new AuthorizationError('Cannot delete this task');
    }

    // Delete task
    await taskService.deleteTask(taskId);

    res.status(200).json({
      message: 'Task deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// POSITION APPLICATION AUDIT ROUTES
// Requirements: 17.1, 17.2, 17.3, 17.4, 17.5
// ============================================================================

/**
 * GET /api/admin/applications
 * Get position applications (all statuses)
 */
router.get('/applications', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const userRole = (req as any).user?.role;

    // Verify page access
    permissionService.verifyPageAccess(userRole, PageAccess.AUDIT_OPERATIONS);

    let applications;

    if (Validator.isSuperAdmin(userRole)) {
      // Super admin sees all applications (all statuses)
      applications = await positionService.getAllApplications();
    } else if (userRole === UserRole.POSITION_ADMIN) {
      // Position admin sees only applications for their managed positions (all statuses)
      const managedPositions = await permissionService.getManagedPositions(userId);
      applications = await positionService.getApplicationsByPositions(managedPositions);
    } else {
      throw new AuthorizationError('Insufficient permissions');
    }

    res.status(200).json({
      applications,
      count: applications.length,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/applications/:applicationId
 * Get application details
 */
router.get('/applications/:applicationId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const userRole = (req as any).user?.role;
    const { applicationId } = req.params;

    // Verify page access
    permissionService.verifyPageAccess(userRole, PageAccess.AUDIT_OPERATIONS);

    const application = await positionService.getApplicationById(applicationId);

    if (!application) {
      throw new ValidationError('Application not found');
    }

    // Check if admin can manage this position
    const canManage = await permissionService.canManagePosition(userId, application.positionId);
    if (!canManage) {
      throw new AuthorizationError('Cannot access this application');
    }

    res.status(200).json({ application });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/applications/:applicationId/review
 * Approve or reject position application
 */
router.post('/applications/:applicationId/review', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.userId;
    const { applicationId } = req.params;

    // Validate input
    const validatedData = approveApplicationSchema.parse(req.body);

    // Get application to check position
    const application = await positionService.getApplicationById(applicationId);

    if (!application) {
      throw new ValidationError('Application not found');
    }

    // Check if admin can manage this position
    const canManage = await permissionService.canManagePosition(userId, application.positionId);
    if (!canManage) {
      throw new AuthorizationError('Cannot review this application');
    }

    // Approve or reject application
    await positionService.reviewApplicationSimple(
      applicationId,
      userId,
      validatedData.approved,
      validatedData.reviewComment
    );

    res.status(200).json({
      message: validatedData.approved
        ? 'Application approved successfully'
        : 'Application rejected successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new ValidationError('Invalid input data', error.errors));
    } else {
      next(error);
    }
  }
});

// ============================================================================
// GROUP MANAGEMENT ROUTES
// ============================================================================

/**
 * GET /api/admin/groups
 * Get all groups
 */
router.get('/groups', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userRole = (req as any).user?.role;

    // Only super admin can manage groups (for now)
    if (userRole !== UserRole.SUPER_ADMIN) {
      throw new AuthorizationError('Only super admin can manage groups');
    }

    const groups = await groupService.getAllGroups();
    res.status(200).json({ groups });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/admin/groups/:groupId
 * Delete a group
 */
router.delete('/groups/:groupId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userRole = (req as any).user?.role;
    const { groupId } = req.params;

    // Only super admin can delete groups
    if (userRole !== UserRole.SUPER_ADMIN) {
      throw new AuthorizationError('Only super admin can delete groups');
    }

    await groupService.deleteGroupAsAdmin(groupId);
    res.status(200).json({ message: 'Group deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
