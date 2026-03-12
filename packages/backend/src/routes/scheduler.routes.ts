import type { Request, Response } from 'express';
import { Router } from 'express';
import { SchedulerService } from '../services/SchedulerService.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/permission.middleware.js';
import { UserRole } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { queryTransformers } from '../utils/queryValidation.js';
import { sendValidationError, sendNotFound, sendUnauthorized, sendForbidden, sendSuccess } from '../utils/responseHelpers.js';

const router = Router();
const schedulerService = new SchedulerService();

/**
 * GET /api/scheduler/workload/:userId
 * Evaluate user's workload
 * Requirement 28.3: Check user's work load and provide suggestions
 */
router.get('/workload/:userId', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;

  // Users can only check their own workload unless they're admin
  if (req.user?.userId !== userId && req.user?.role !== UserRole.SUPER_ADMIN) {
    return sendForbidden(res, 'Forbidden: Can only check your own workload');
  }

  const workload = await schedulerService.evaluateWorkload(userId);
  sendSuccess(res, workload);
}));

/**
 * GET /api/scheduler/recommendations
 * Get task recommendations for the current user
 * Requirements 28.3, 28.4: Recommend suitable tasks
 */
router.get('/recommendations', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const limit = queryTransformers.toInt(req.query.limit as string, 10);

  const recommendations = await schedulerService.recommendTasks(userId, limit);
  sendSuccess(res, recommendations);
}));

/**
 * POST /api/scheduler/push-unaccepted
 * Push notifications for long-unaccepted tasks
 * Requirements 28.4, 28.5: Push tasks that haven't been accepted for a long time
 * Admin only
 */
router.post(
  '/push-unaccepted',
  authenticate,
  requireRole([UserRole.SUPER_ADMIN]),
  asyncHandler(async (req: Request, res: Response) => {
    const hoursThreshold = req.body.hoursThreshold || 48;

    const notificationCount = await schedulerService.pushLongUnacceptedTasks(hoursThreshold);
    res.json({
      message: 'Notifications sent successfully',
      count: notificationCount,
    });
  })
);

/**
 * POST /api/scheduler/reprioritize
 * Reprioritize tasks based on deadline proximity
 * Requirement 28.2: Increase priority weight for tasks approaching deadline
 * Admin only
 */
router.post(
  '/reprioritize',
  authenticate,
  requireRole([UserRole.SUPER_ADMIN]),
  asyncHandler(async (req: Request, res: Response) => {
    const updatedCount = await schedulerService.reprioritizeTasks();
    res.json({
      message: 'Tasks reprioritized successfully',
      count: updatedCount,
    });
  })
);

/**
 * POST /api/scheduler/process-completed/:taskId
 * Process a completed task and update downstream dependencies
 * Requirement 28.1: Automatically mark tasks as available when dependencies resolve
 * Internal use - typically called by task completion workflow
 */
router.post(
  '/process-completed/:taskId',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { taskId } = req.params;

    const resolvedTaskIds = await schedulerService.processCompletedTask(taskId);
    sendSuccess(res, {
      message: 'Completed task processed successfully',
      resolvedTaskIds,
    });
  })
);

export default router;
