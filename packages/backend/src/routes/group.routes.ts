import type { Request, Response } from 'express';
import { Router } from 'express';
import { GroupService } from '../services/GroupService.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { resolve } from '../config/container.js';
import { sendValidationError, sendNotFound, sendUnauthorized, sendForbidden } from '../utils/responseHelpers.js';

const router = Router();
// Use DI container to get properly configured GroupService
const groupService = resolve<GroupService>('groupService');

/**
 * Create a new task group
 * POST /api/groups
 */
router.post('/', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { name } = req.body;
  const creatorId = req.user!.userId;

  const group = await groupService.createGroup({ name, creatorId });
  res.status(201).json(group);
}));

router.get('/:groupId', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { groupId } = req.params;
  const group = await groupService.getGroupWithMembers(groupId);

  if (!group) {
    return sendNotFound(res, 'Task group');
  }

  res.json(group);
}));

router.get('/', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const groups = await groupService.getUserGroups(userId);
  res.json(groups);
}));

router.put('/:groupId', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { groupId } = req.params;
  const { name } = req.body;
  const userId = req.user!.userId;

  const group = await groupService.updateGroup(groupId, name, userId);
  res.json(group);
}));

router.delete('/:groupId', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { groupId } = req.params;
  const userId = req.user!.userId;

  await groupService.deleteGroup(groupId, userId);
  res.status(204).send();
}));

router.post('/:groupId/members', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { groupId } = req.params;
  const { userId } = req.body;

  const member = await groupService.addMember(groupId, userId);
  res.status(201).json(member);
}));

router.delete('/:groupId/members/:userId', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { groupId, userId } = req.params;

  await groupService.removeMember(groupId, userId);
  res.status(204).send();
}));

router.get('/:groupId/members', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { groupId } = req.params;
  const members = await groupService.getGroupMembers(groupId);
  res.json(members);
}));

router.post('/:groupId/tasks', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { groupId } = req.params;
  const { taskId } = req.body;

  await groupService.assignTaskToGroup(taskId, groupId);
  res.status(201).json({ message: 'Task assigned to group successfully' });
}));

router.get('/:groupId/tasks', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { groupId } = req.params;
  const tasks = await groupService.getGroupTasks(groupId);
  res.json(tasks);
}));

router.get('/tasks/my-groups', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const tasks = await groupService.getUserGroupTasks(userId);
  res.json(tasks);
}));

router.get('/:groupId/tasks/:taskId/bounty/calculate', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { taskId } = req.params;
  const distribution = await groupService.calculateGroupBountyDistribution(taskId);
  res.json(distribution);
}));

router.post('/:groupId/tasks/:taskId/bounty/distribute', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { taskId } = req.params;
  const distribution = await groupService.distributeGroupBounty(taskId);
  res.json(distribution);
}));

router.post('/:groupId/invite', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { groupId } = req.params;
  const { userId } = req.body; // The user to invite
  const inviterId = req.user!.userId;

  // // await groupService.inviteMember(groupId, inviterId, userId);
  res.status(200).json({ message: 'Invitation sent' });
}));

router.post('/:groupId/join', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { groupId } = req.params;
  const userId = req.user!.userId;

  // // await groupService.acceptInvitation(groupId, userId);
  res.status(200).json({ message: 'Joined group successfully' });
}));

/**
 * Create a task for the group
 * POST /api/groups/:groupId/tasks/create
 */
router.post('/:groupId/tasks/create', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { groupId } = req.params;
  const userId = req.user!.userId;
  const taskData = req.body;

  const task = await groupService.createGroupTask(groupId, userId, taskData);
  res.status(201).json(task);
}));

/**
 * Accept a group task (assign to user)
 * POST /api/groups/:groupId/tasks/:taskId/accept
 */
router.post('/:groupId/tasks/:taskId/accept', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { groupId, taskId } = req.params;
  const userId = req.user!.userId;

  await groupService.acceptGroupTask(groupId, taskId, userId);
  res.status(200).json({ message: 'Task accepted successfully' });
}));

/**
 * Convert an assigned task to a group task
 * POST /api/groups/:groupId/tasks/:taskId/convert
 */
router.post('/:groupId/tasks/:taskId/convert', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { groupId, taskId } = req.params;
  const userId = req.user!.userId;

  await groupService.convertTaskToGroupTask(taskId, groupId, userId);
  res.status(200).json({ message: 'Task converted to group task successfully' });
}));

export default router;
