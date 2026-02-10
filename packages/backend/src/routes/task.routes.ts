import type { Request, Response } from 'express';
import { Router } from 'express';
import { pool } from '../config/database.js';
import { TaskService } from '../services/TaskService.js';
import { CommentService } from '../services/CommentService.js';
import { AttachmentService } from '../services/AttachmentService.js';
import { TaskAssistantService } from '../services/TaskAssistantService.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { ValidationError, NotFoundError, AppError } from '../utils/errors.js';
import { taskCreationRateLimiter, apiRateLimiter } from '../middleware/rateLimit.middleware.js';
import { AllocationType } from '../models/TaskAssistant.js';
import { UserRole } from '../models/User.js';
import {
  validate,
  idParamSchema,
  safeTextSchema,
  safeLongTextSchema,
  positiveIntegerSchema,
  dateSchema,
  uuidSchema,
} from '../middleware/validation.middleware.js';
import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler.js';
import { resolve } from '../config/container.js';
import { Validator } from '../utils/Validator.js';

const router = Router();
// Use DI container to get properly configured TaskService
const taskService = resolve<TaskService>('taskService');
const commentService = new CommentService(pool);
const attachmentService = new AttachmentService(pool);
const taskAssistantService = new TaskAssistantService(pool);

/**
 * Get visible tasks for the authenticated user
 * GET /api/tasks/visible
 * Requirement 5.1: Filter tasks based on user and task visibility
 */
router.get('/visible', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const userRole = req.user!.role;

  const tasks = await taskService.getVisibleTasks(userId, userRole);

  res.json(tasks);
}));

/**
 * Get available tasks for the authenticated user to accept
 * GET /api/tasks/available
 * Returns unassigned, executable tasks that are visible to the user
 * Supports pagination via query parameters: ?page=1&pageSize=50
 * Supports sorting via query parameters: ?sortBy=bounty&sortOrder=desc
 * Supports search via query parameter: ?search=keyword
 */
router.get('/available', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const userRole = req.user!.role;

  // Parse pagination parameters from query string
  const page = req.query.page ? parseInt(req.query.page as string) : undefined;
  const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string) : undefined;

  // Parse sorting parameters
  const sortBy = req.query.sortBy as string | undefined;
  const sortOrder = req.query.sortOrder as string | undefined;

  // Parse search parameter
  const search = req.query.search as string | undefined;

  // Validate pagination parameters
  if (page !== undefined && (isNaN(page) || page < 1)) {
    return res.status(400).json({ error: 'Page must be a positive integer >= 1' });
  }
  if (pageSize !== undefined && (isNaN(pageSize) || pageSize < 1 || pageSize > 100)) {
    return res.status(400).json({ error: 'Page size must be between 1 and 100' });
  }

  // Validate sorting parameters
  const validSortFields = ['bounty', 'deadline', 'priority', 'createdAt', 'updatedAt'];
  if (sortBy && !validSortFields.includes(sortBy)) {
    return res.status(400).json({ 
      error: `Invalid sortBy field. Must be one of: ${validSortFields.join(', ')}` 
    });
  }
  if (sortOrder && !['asc', 'desc'].includes(sortOrder)) {
    return res.status(400).json({ error: 'sortOrder must be either "asc" or "desc"' });
  }

  // Build pagination object if parameters provided
  const pagination = (page || pageSize) ? { page, pageSize } : undefined;

  try {
    const result = await taskService.getAvailableTasks(
      userId, 
      userRole, 
      pagination,
      sortBy,
      sortOrder,
      search
    );
    res.json(result);
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(400).json({ error: error.message });
    }
    // Let asyncHandler handle other errors
    throw error;
  }
}));

/**
 * Get tasks published by user
 * GET /api/tasks/user/published
 * IMPORTANT: Must be before /:taskId route
 */
router.get('/user/published', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  // 获取所有任务（包括子任务），以便前端可以计算子任务数量
  const tasks = await taskService.getTasksByUser(userId, 'publisher', false);

  res.json(tasks);
}));

/**
 * Get tasks assigned to user
 * GET /api/tasks/user/assigned
 * IMPORTANT: Must be before /:taskId route
 */
router.get('/user/assigned', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  // 获取所有任务（包括子任务），以便前端可以计算子任务数量
  const tasks = await taskService.getTasksByUser(userId, 'assignee', false);

  res.json(tasks);
}));

/**
 * Get task invitations for the authenticated user
 * GET /api/tasks/invitations
 * IMPORTANT: Must be before /:taskId route
 */
router.get('/invitations', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  const invitations = await taskService.getTaskInvitations(userId);

  res.json(invitations);
}));

/**
 * Publish a task
 * POST /api/tasks/:taskId/publish
 * Publisher can choose to accept the task themselves or publish it for others
 */
router.post('/:taskId/publish', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { taskId } = req.params;
  const publisherId = req.user!.userId;
  const { acceptBySelf } = req.body;

  if (acceptBySelf === undefined) {
    return res.status(400).json({ error: 'acceptBySelf is required' });
  }

  const task = await taskService.publishTask(taskId, publisherId, acceptBySelf);

  res.json({
    message: acceptBySelf 
      ? 'Task published and accepted by yourself' 
      : 'Task published successfully',
    task,
  });
}));

/**
 * Accept a task
 * POST /api/tasks/:taskId/accept
 * Requirements 5.2, 5.3, 5.4, 5.5:
 * - Validates position matching if task has position requirement
 * - Allows any user to accept tasks without position requirement
 * - Updates task status and assigns to user
 */
router.post('/:taskId/accept', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { taskId } = req.params;
  const userId = req.user!.userId;

  const task = await taskService.acceptTask(taskId, userId);

  res.json(task);
}));

/**
 * Create a new task
 * POST /api/tasks
 */
router.post('/', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const taskData = {
    ...req.body,
    publisherId: userId,
  };

  const task = await taskService.createTask(taskData);

  res.status(201).json(task);
}));

/**
 * Get task by ID
 * GET /api/tasks/:taskId
 * IMPORTANT: Must be after all specific routes like /user/published
 */
router.get('/:taskId', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { taskId } = req.params;

  const task = await taskService.getTask(taskId);

  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  res.json(task);
}));

/**
 * Update task
 * PUT /api/tasks/:taskId
 */
router.put('/:taskId', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { taskId } = req.params;
  const updates = req.body;

  const task = await taskService.updateTask(taskId, updates);

  res.json(task);
}));

/**
 * Delete task
 * DELETE /api/tasks/:taskId
 */
router.delete('/:taskId', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { taskId } = req.params;
  const userId = req.user!.userId;

  await taskService.deleteTask(taskId, userId);

  res.status(204).send();
}));

/**
 * Get subtasks of a parent task
 * GET /api/tasks/:taskId/subtasks
 */
router.get('/:taskId/subtasks', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { taskId } = req.params;

  const subtasks = await taskService.getSubtasks(taskId);

  res.json(subtasks);
}));

/**
 * Add a subtask to a parent task
 * POST /api/tasks/:taskId/subtasks
 */
router.post('/:taskId/subtasks', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { taskId } = req.params;
  const userId = req.user!.userId;
  const subtaskData = {
    ...req.body,
    publisherId: userId,
  };

  // Get parent task to check if it has an assignee
  const parentTask = await taskService.getTask(taskId);
  if (!parentTask) {
    return res.status(404).json({ error: 'Parent task not found' });
  }

  // NEW REQUIREMENT: Parent task must have an assignee before subtasks can be created
  if (!parentTask.assigneeId) {
    return res.status(400).json({ 
      error: 'Cannot create subtask: parent task must be accepted first' 
    });
  }

  // Verify user can create subtask (creator or parent assignee)
  const canCreate = await taskService.canCreateSubtask(taskId, userId);
  if (!canCreate) {
    return res.status(403).json({ 
      error: 'Only the task creator or parent task assignee can create subtasks' 
    });
  }

  const subtask = await taskService.addSubtask(taskId, subtaskData);

  res.status(201).json(subtask);
}));

/**
 * Publish a subtask
 * POST /api/tasks/:subtaskId/publish
 * Only parent task assignee can publish subtasks
 */
router.post('/:subtaskId/publish', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { subtaskId } = req.params;
  const userId = req.user!.userId;
  const { visibility, bountyAmount, positionId } = req.body;

  if (!visibility || bountyAmount === undefined) {
    return res.status(400).json({ 
      error: 'visibility and bountyAmount are required' 
    });
  }

  const publishedTask = await taskService.publishSubtask(subtaskId, userId, {
    visibility,
    bountyAmount,
    positionId,
  });

  res.json({
    message: 'Subtask published successfully',
    task: publishedTask,
  });
}));

router.post('/:taskId/complete', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { taskId } = req.params;
  const userId = req.user!.userId;

  const resolvedTaskIds = await taskService.completeTask(taskId, userId);

  res.json({
    message: 'Task completed successfully',
    resolvedTaskIds,
  });
}));

// Add bonus reward to completed task (admin only)
router.post('/:taskId/bonus', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { taskId } = req.params;
  const { amount, reason } = req.body;
  const userId = req.user!.userId;
  const userRole = req.user!.role;

  // Verify admin permissions
  if (!Validator.isSuperAdmin(userRole) && userRole !== UserRole.POSITION_ADMIN) {
    return res.status(403).json({ error: 'Only administrators can add bonus rewards' });
  }

  // Validate amount
  if (!amount || typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: 'Valid bonus amount is required' });
  }

  const result = await taskService.addBonusReward(taskId, amount, userId, reason);

  res.json({
    message: 'Bonus reward added successfully',
    task: result.task,
    transaction: result.transaction,
  });
}));

// Get bonus reward records for a task
router.get('/:taskId/bonus-rewards', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { taskId } = req.params;
  
  const bonusRewards = await taskService.getBonusRewards(taskId);
  
  res.json({
    bonusRewards,
  });
}));

router.post('/:taskId/transfer', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { taskId } = req.params;
  const userId = req.user!.userId;
  const { newUserId } = req.body;

  if (!newUserId) {
    return res.status(400).json({ error: 'newUserId is required' });
  }

  const result = await taskService.transferTask(taskId, userId, newUserId);

  res.json({
    message: 'Task transferred successfully',
    task: result.task,
  });
}));

router.put('/:taskId/progress', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { taskId } = req.params;
  const { progress } = req.body;

  if (progress === undefined || progress === null) {
    return res.status(400).json({ error: 'progress is required' });
  }

  const result = await taskService.updateProgress(taskId, progress);

  res.json({
    task: result.task,
    completionPrompt: result.completionPrompt,
    message: result.completionPrompt 
      ? 'Progress updated to 100%. Please mark the task as complete.' 
      : 'Progress updated successfully',
  });
}));

router.get('/:id/comments', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const comments = await commentService.getCommentsByTask(id);
  res.json(comments);
}));

router.post('/:id/comments', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { content } = req.body;
  const userId = req.user!.userId;
  const userRole = req.user!.role;

  if (!content) {
    return res.status(400).json({ error: 'Content is required' });
  }

  // Permission check: Publisher, Assignee, or Admin
  const task = await taskService.getTask(id);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const isPublisher = task.publisherId === userId;
  const isAssignee = task.assigneeId === userId;
  const isAdmin = Validator.isSuperAdmin(userRole);

  if (!isPublisher && !isAssignee && !isAdmin) {
    return res.status(403).json({ error: 'Permission denied' });
  }

  const comment = await commentService.createComment({
    taskId: id,
    userId: userId,
    content,
  });

  res.status(201).json(comment);
}));

router.get('/:id/attachments', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const attachments = await attachmentService.getAttachmentsByTask(id);
  res.json(attachments);
}));

router.post('/:id/attachments', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { fileName, fileUrl, fileType, fileSize } = req.body;
  const userId = req.user!.userId;

  if (!fileName || !fileUrl) {
    return res.status(400).json({ error: 'File name and URL are required' });
  }

  // Permission check: Publisher or Assignee
  const task = await taskService.getTask(id);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const isPublisher = task.publisherId === userId;
  const isAssignee = task.assigneeId === userId;

  if (!isPublisher && !isAssignee) {
    return res.status(403).json({ error: 'Permission denied. Only Publisher or Assignee can add attachments.' });
  }

  const attachment = await attachmentService.createAttachment({
    taskId: id,
    uploaderId: userId,
    fileName: fileName,
    fileUrl: fileUrl,
    fileType: fileType,
    fileSize: fileSize,
  });

  res.status(201).json(attachment);
}));

router.get('/:id/assistants', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const assistants = await taskAssistantService.getAssistantsByTask(id);
  res.json(assistants);
}));

router.post('/:id/assistants', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { assistantId, bountyAllocation } = req.body;
  const userId = req.user!.userId;
  const userRole = req.user!.role;

  if (!assistantId || bountyAllocation === undefined) {
    return res.status(400).json({ error: 'Assistant ID and bounty allocation are required' });
  }

  // Permission check: Assignee or Admin
  const task = await taskService.getTask(id);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const isAssignee = task.assigneeId === userId;
  const isAdmin = Validator.isSuperAdmin(userRole);

  if (!isAssignee && !isAdmin) {
    return res.status(403).json({ error: 'Permission denied. Only Assignee or Admin can add assistants.' });
  }

  const assistant = await taskAssistantService.addAssistant({
    taskId: id,
    userId: assistantId,
    allocationType: AllocationType.PERCENTAGE,
    allocationValue: bountyAllocation,
  });

  res.status(201).json(assistant);
}));

router.delete('/:id/assistants/:assistantId', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { id, assistantId } = req.params;
  const userId = req.user!.userId;
  const userRole = req.user!.role;

  // Permission check: Assignee or Admin
  const task = await taskService.getTask(id);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const isAssignee = task.assigneeId === userId;
  const isAdmin = Validator.isSuperAdmin(userRole);

  if (!isAssignee && !isAdmin) {
    return res.status(403).json({ error: 'Permission denied. Only Assignee or Admin can remove assistants.' });
  }

  await taskAssistantService.removeAssistant(id, assistantId);
  res.status(204).send();
}));

/**
 * Assign an existing task to a user
 * POST /api/tasks/:taskId/assign-to-user
 */
router.post('/:taskId/assign-to-user', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { taskId } = req.params;
  const publisherId = req.user!.userId;
  const { invitedUserId } = req.body;

  if (!invitedUserId) {
    return res.status(400).json({ error: 'invitedUserId is required' });
  }

  const task = await taskService.assignTaskToUser(taskId, publisherId, invitedUserId);

  res.json({
    message: 'Task assigned successfully',
    task,
  });
}));

/**
 * Accept task assignment invitation
 * POST /api/tasks/:taskId/accept-assignment
 */
router.post('/:taskId/accept-assignment', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { taskId } = req.params;
  const userId = req.user!.userId;

  const task = await taskService.acceptTaskAssignment(taskId, userId);

  res.json({
    message: 'Task assignment accepted successfully',
    task,
  });
}));

/**
 * Reject task assignment invitation
 * POST /api/tasks/:taskId/reject-assignment
 */
router.post('/:taskId/reject-assignment', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { taskId } = req.params;
  const userId = req.user!.userId;
  const { reason } = req.body;

  const task = await taskService.rejectTaskAssignment(taskId, userId, reason);

  res.json({
    message: 'Task assignment rejected successfully',
    task,
  });
}));

export default router;
