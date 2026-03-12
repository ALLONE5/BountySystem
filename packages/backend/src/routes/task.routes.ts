import type { Request, Response } from 'express';
import { Router } from 'express';
import { pool } from '../config/database.js';
import { TaskService } from '../services/TaskService.js';
import { CommentService } from '../services/CommentService.js';
import { AttachmentService } from '../services/AttachmentService.js';
import { TaskAssistantService } from '../services/TaskAssistantService.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { ValidationError } from '../utils/errors.js';
import { AllocationType } from '../models/TaskAssistant.js';
import { UserRole } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { resolve } from '../config/container.js';
import { Validator } from '../utils/Validator.js';
import { parsePagination } from '../utils/pagination.js';
import { queryTransformers } from '../utils/queryValidation.js';
import { sendValidationError, sendNotFound, sendForbidden, sendSuccess, sendCreated } from '../utils/responseHelpers.js';

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

  sendSuccess(res, tasks);
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

  // Parse pagination parameters using utility
  const { page, pageSize } = parsePagination({
    page: queryTransformers.toInt(req.query.page as string, 1),
    pageSize: queryTransformers.toInt(req.query.pageSize as string, 20),
    maxPageSize: 100
  });

  // Parse sorting parameters
  const sortBy = req.query.sortBy as string | undefined;
  const sortOrder = req.query.sortOrder as string | undefined;

  // Parse search parameter
  const search = req.query.search as string | undefined;

  // Validate sorting parameters
  const validSortFields = ['bounty', 'deadline', 'priority', 'createdAt', 'updatedAt'];
  if (sortBy && !validSortFields.includes(sortBy)) {
    return sendValidationError(res, `Invalid sortBy field. Must be one of: ${validSortFields.join(', ')}`);
  }
  if (sortOrder && !['asc', 'desc'].includes(sortOrder)) {
    return sendValidationError(res, 'sortOrder must be either "asc" or "desc"');
  }

  // Build pagination object
  const pagination = { page, pageSize };

  try {
    const result = await taskService.getAvailableTasks(
      userId, 
      userRole, 
      pagination,
      sortBy,
      sortOrder,
      search
    );
    sendSuccess(res, result);
  } catch (error) {
    if (error instanceof ValidationError) {
      return sendValidationError(res, error.message);
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

  sendSuccess(res, tasks);
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

  sendSuccess(res, tasks);
}));

/**
 * Generate task report
 * POST /api/tasks/report
 */
router.post('/report', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { type } = req.body;

  if (!type || !['daily', 'weekly', 'monthly', 'total'].includes(type)) {
    return sendValidationError(res, 'Valid report type is required (daily, weekly, monthly, total)');
  }

  // Get user's tasks for the report
  const [publishedTasks, assignedTasks] = await Promise.all([
    taskService.getTasksByUser(userId, 'publisher', false),
    taskService.getTasksByUser(userId, 'assignee', false)
  ]);

  // Generate report content based on type and date range
  const now = new Date();
  let reportTitle = "任务总报";
  let filteredPublished = publishedTasks;
  let filteredAssigned = assignedTasks;

  // Apply date filtering based on report type
  if (type !== 'total') {
    const filterByDate = (tasks: any[], dateField: string) => {
      return tasks.filter(task => {
        const taskDate = new Date(task[dateField]);
        if (type === 'daily') {
          return taskDate.toDateString() === now.toDateString();
        } else if (type === 'weekly') {
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - now.getDay());
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          return taskDate >= weekStart && taskDate <= weekEnd;
        } else if (type === 'monthly') {
          return taskDate.getMonth() === now.getMonth() && taskDate.getFullYear() === now.getFullYear();
        }
        return true;
      });
    };

    filteredPublished = filterByDate(publishedTasks, 'createdAt');
    filteredAssigned = filterByDate(assignedTasks, 'createdAt');

    if (type === 'daily') reportTitle = `任务日报 (${now.toISOString().split('T')[0]})`;
    else if (type === 'weekly') reportTitle = `任务周报`;
    else if (type === 'monthly') reportTitle = `任务月报 (${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')})`;
  }

  // Calculate statistics
  const earnedBounty = filteredAssigned
    .filter((t: any) => t.status === 'completed')
    .reduce((sum: number, t: any) => sum + (parseFloat(t.bountyAmount) || 0), 0);

  // Generate report text
  let report = `${reportTitle}\n`;
  report += `生成时间: ${now.toISOString().replace('T', ' ').split('.')[0]}\n`;
  report += `----------------------------------------\n\n`;

  report += `【一、统计概览】\n`;
  report += `- 统计周期内承接任务: ${filteredAssigned.length}\n`;
  report += `- 统计周期内发布任务: ${filteredPublished.length}\n`;
  report += `- 周期内获得赏金: ${earnedBounty.toFixed(2)}元\n\n`;

  report += `【二、承接任务详情】\n`;
  if (filteredAssigned.length > 0) {
    filteredAssigned.forEach((task: any, index: number) => {
      const statusMap: Record<string, string> = {
        'not_started': '未开始',
        'in_progress': '进行中',
        'completed': '已完成',
        'abandoned': '已放弃'
      };
      const statusStr = statusMap[task.status] || task.status;
      report += `${index + 1}. ${task.name}\n`;
      report += `   状态: ${statusStr} | 进度: ${task.progress || 0}%\n`;
      report += `   赏金: ${(parseFloat(task.bountyAmount) || 0).toFixed(2)}元\n\n`;
    });
  } else {
    report += `(无相关记录)\n\n`;
  }

  report += `【三、发布任务详情】\n`;
  if (filteredPublished.length > 0) {
    filteredPublished.forEach((task: any, index: number) => {
      const statusMap: Record<string, string> = {
        'not_started': '未开始',
        'in_progress': '进行中',
        'completed': '已完成',
        'abandoned': '已放弃'
      };
      const statusStr = statusMap[task.status] || task.status;
      report += `${index + 1}. ${task.name}\n`;
      report += `   状态: ${statusStr} | 进度: ${task.progress || 0}%\n`;
      report += `   赏金: ${(parseFloat(task.bountyAmount) || 0).toFixed(2)}元\n\n`;
    });
  } else {
    report += `(无相关记录)\n`;
  }

  // Return as plain text
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.send(report);
}));

/**
 * Get task statistics for the authenticated user
 * GET /api/tasks/stats
 * IMPORTANT: Must be before /:taskId route
 */
router.get('/stats', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  const stats = await taskService.getTaskStats(userId);

  sendSuccess(res, stats);
}));

/**
 * Get task invitations for the authenticated user
 * GET /api/tasks/invitations
 * IMPORTANT: Must be before /:taskId route
 */
router.get('/invitations', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  const invitations = await taskService.getTaskInvitations(userId);

  sendSuccess(res, invitations);
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
    return sendValidationError(res, 'acceptBySelf is required');
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

  sendSuccess(res, task);
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

  sendCreated(res, task);
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
    return sendNotFound(res, 'Task');
  }

  sendSuccess(res, task);
}));

/**
 * Update task
 * PUT /api/tasks/:taskId
 */
router.put('/:taskId', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { taskId } = req.params;
  const updates = req.body;

  const task = await taskService.updateTask(taskId, updates);

  sendSuccess(res, task);
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

  sendSuccess(res, subtasks);
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
    return sendNotFound(res, 'Parent task');
  }

  // NEW REQUIREMENT: Parent task must have an assignee before subtasks can be created
  if (!parentTask.assigneeId) {
    return sendValidationError(res, 'Cannot create subtask: parent task must be accepted first');
  }

  // Verify user can create subtask (creator or parent assignee)
  const canCreate = await taskService.canCreateSubtask(taskId, userId);
  if (!canCreate) {
    return sendForbidden(res, 'Only the task creator or parent task assignee can create subtasks');
  }

  const subtask = await taskService.addSubtask(taskId, subtaskData);

  sendCreated(res, subtask);
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
    return sendValidationError(res, 'visibility and bountyAmount are required');
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

  sendSuccess(res, {
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
    return sendForbidden(res, 'Only administrators can add bonus rewards');
  }

  // Validate amount
  if (!amount || typeof amount !== 'number' || amount <= 0) {
    return sendValidationError(res, 'Valid bonus amount is required');
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
  
  sendSuccess(res, {
    bonusRewards,
  });
}));

router.post('/:taskId/transfer', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { taskId } = req.params;
  const userId = req.user!.userId;
  const { newUserId } = req.body;

  if (!newUserId) {
    return sendValidationError(res, 'newUserId is required');
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
    return sendValidationError(res, 'progress is required');
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
  sendSuccess(res, comments);
}));

router.post('/:id/comments', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { content } = req.body;
  const userId = req.user!.userId;
  const userRole = req.user!.role;

  if (!content) {
    return sendValidationError(res, 'Content is required');
  }

  // Permission check: Publisher, Assignee, or Admin
  const task = await taskService.getTask(id);
  if (!task) {
    return sendNotFound(res, 'Task');
  }

  const isPublisher = task.publisherId === userId;
  const isAssignee = task.assigneeId === userId;
  const isAdmin = Validator.isSuperAdmin(userRole);

  if (!isPublisher && !isAssignee && !isAdmin) {
    return sendForbidden(res, 'Permission denied');
  }

  const comment = await commentService.createComment({
    taskId: id,
    userId: userId,
    content,
  });

  sendCreated(res, comment);
}));

router.get('/:id/attachments', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const attachments = await attachmentService.getAttachmentsByTask(id);
  sendSuccess(res, attachments);
}));

router.post('/:id/attachments', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { fileName, fileUrl, fileType, fileSize } = req.body;
  const userId = req.user!.userId;

  if (!fileName || !fileUrl) {
    return sendValidationError(res, 'File name and URL are required');
  }

  // Permission check: Publisher or Assignee
  const task = await taskService.getTask(id);
  if (!task) {
    return sendNotFound(res, 'Task');
  }

  const isPublisher = task.publisherId === userId;
  const isAssignee = task.assigneeId === userId;

  if (!isPublisher && !isAssignee) {
    return sendForbidden(res, 'Permission denied. Only Publisher or Assignee can add attachments.');
  }

  const attachment = await attachmentService.createAttachment({
    taskId: id,
    uploaderId: userId,
    fileName: fileName,
    fileUrl: fileUrl,
    fileType: fileType,
    fileSize: fileSize,
  });

  sendCreated(res, attachment);
}));

router.get('/:id/assistants', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const assistants = await taskAssistantService.getAssistantsByTask(id);
  sendSuccess(res, assistants);
}));

router.post('/:id/assistants', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { assistantId, bountyAllocation } = req.body;
  const userId = req.user!.userId;
  const userRole = req.user!.role;

  if (!assistantId || bountyAllocation === undefined) {
    return sendValidationError(res, 'Assistant ID and bounty allocation are required');
  }

  // Permission check: Assignee or Admin
  const task = await taskService.getTask(id);
  if (!task) {
    return sendNotFound(res, 'Task');
  }

  const isAssignee = task.assigneeId === userId;
  const isAdmin = Validator.isSuperAdmin(userRole);

  if (!isAssignee && !isAdmin) {
    return sendForbidden(res, 'Permission denied. Only Assignee or Admin can add assistants.');
  }

  const assistant = await taskAssistantService.addAssistant({
    taskId: id,
    userId: assistantId,
    allocationType: AllocationType.PERCENTAGE,
    allocationValue: bountyAllocation,
  });

  sendCreated(res, assistant);
}));

router.delete('/:id/assistants/:assistantId', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { id, assistantId } = req.params;
  const userId = req.user!.userId;
  const userRole = req.user!.role;

  // Permission check: Assignee or Admin
  const task = await taskService.getTask(id);
  if (!task) {
    return sendNotFound(res, 'Task');
  }

  const isAssignee = task.assigneeId === userId;
  const isAdmin = Validator.isSuperAdmin(userRole);

  if (!isAssignee && !isAdmin) {
    return sendForbidden(res, 'Permission denied. Only Assignee or Admin can remove assistants.');
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
    return sendValidationError(res, 'invitedUserId is required');
  }

  const task = await taskService.assignTaskToUser(taskId, publisherId, invitedUserId);

  sendSuccess(res, {
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

  sendSuccess(res, {
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

  sendSuccess(res, {
    message: 'Task assignment rejected successfully',
    task,
  });
}));

export default router;
