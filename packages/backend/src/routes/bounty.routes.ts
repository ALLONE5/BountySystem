import type { Router as RouterType, Request, Response } from 'express';
import { Router } from 'express';
import { BountyDistributionService } from '../services/BountyDistributionService.js';
import { BountyService } from '../services/BountyService.js';
import { TaskReviewService } from '../services/TaskReviewService.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/permission.middleware.js';
import { UserRole } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { queryTransformers } from '../utils/queryValidation.js';
import { sendValidationError, sendNotFound, sendUnauthorized, sendForbidden } from '../utils/responseHelpers.js';

const router = Router();
const bountyDistributionService = new BountyDistributionService();
const bountyAlgorithmService = new BountyService();
const reviewService = new TaskReviewService();

/**
 * Get all bounty algorithms
 * GET /api/bounty/algorithms
 */
router.get('/algorithms', authenticate, requireRole([UserRole.SUPER_ADMIN, UserRole.DEVELOPER]), asyncHandler(async (req: Request, res: Response) => {
  const algorithms = await bountyAlgorithmService.getAllAlgorithms();
  res.json(algorithms);
}));

/**
 * Get current active bounty algorithm
 * GET /api/bounty/algorithms/current
 */
router.get('/algorithms/current', authenticate, requireRole([UserRole.SUPER_ADMIN, UserRole.DEVELOPER]), asyncHandler(async (req: Request, res: Response) => {
  const algorithm = await bountyAlgorithmService.getCurrentAlgorithm();
  
  if (!algorithm) {
    return sendNotFound(res);
  }
  
  res.json(algorithm);
}));

/**
 * Get bounty algorithm by version
 * GET /api/bounty/algorithms/:version
 */
router.get('/algorithms/:version', authenticate, requireRole([UserRole.SUPER_ADMIN, UserRole.DEVELOPER]), asyncHandler(async (req: Request, res: Response) => {
  const { version } = req.params;
  const algorithm = await bountyAlgorithmService.getAlgorithmByVersion(version);
  
  if (!algorithm) {
    return sendNotFound(res, 'Algorithm');
  }
  
  res.json(algorithm);
}));

/**
 * Create new bounty algorithm
 * POST /api/bounty/algorithms
 * Requirements 20.1, 20.2, 20.3: Create and manage bounty algorithms
 */
router.post('/algorithms', authenticate, requireRole([UserRole.SUPER_ADMIN, UserRole.DEVELOPER]), asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { version, baseAmount, urgencyWeight, importanceWeight, durationWeight, remainingDaysWeight, formula, effectiveFrom } = req.body;

  const algorithm = await bountyAlgorithmService.createAlgorithm({
    version,
    baseAmount,
    urgencyWeight,
    importanceWeight,
    durationWeight,
    remainingDaysWeight: remainingDaysWeight ?? 0,
    formula,
    effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : undefined,
    createdBy: userId,
  });

  res.status(201).json(algorithm);
}));

/**
 * Add assistant to task
 * POST /api/bounty/tasks/:taskId/assistants
 * Requirements 11.4, 11.5, 11.6, 11.7, 11.8: Add assistant with allocation
 */
router.post('/tasks/:taskId/assistants', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { taskId } = req.params;
  const { userId, allocationType, allocationValue } = req.body;

  const assistant = await bountyDistributionService.addAssistant({
    taskId,
    userId,
    allocationType,
    allocationValue,
  });

  res.status(201).json(assistant);
}));

/**
 * Get assistants for a task
 * GET /api/bounty/tasks/:taskId/assistants
 */
router.get('/tasks/:taskId/assistants', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { taskId } = req.params;

  const assistants = await bountyDistributionService.getTaskAssistants(taskId);

  res.json(assistants);
}));

/**
 * Remove assistant from task
 * DELETE /api/bounty/tasks/:taskId/assistants/:userId
 */
router.delete('/tasks/:taskId/assistants/:userId', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { taskId, userId } = req.params;

  await bountyDistributionService.removeAssistant(taskId, userId);

  res.status(204).send();
}));

/**
 * Calculate bounty distribution for a task
 * GET /api/bounty/tasks/:taskId/distribution
 * Requirement 11.9: Calculate distribution preview
 */
router.get('/tasks/:taskId/distribution', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { taskId } = req.params;

  const distribution = await bountyDistributionService.calculateDistribution(taskId);

  res.json(distribution);
}));

/**
 * Distribute bounty for a task
 * POST /api/bounty/tasks/:taskId/distribute
 * Requirement 11.9: Execute bounty distribution and record transactions
 */
router.post('/tasks/:taskId/distribute', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { taskId } = req.params;

  const distribution = await bountyDistributionService.distributeBounty(taskId);

  res.json(distribution);
}));

/**
 * Get bounty transactions for a task
 * GET /api/bounty/tasks/:taskId/transactions
 */
router.get('/tasks/:taskId/transactions', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { taskId } = req.params;

  const transactions = await bountyDistributionService.getTaskTransactions(taskId);

  res.json(transactions);
}));

router.get('/transactions', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  const transactions = await bountyDistributionService.getUserTransactions(userId);

  res.json(transactions);
}));

router.post('/tasks/:taskId/reviews', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { taskId } = req.params;
  const reviewerId = req.user!.userId;
  const { rating, comment, extraBounty } = req.body;

  const review = await reviewService.createReview({
    taskId,
    reviewerId,
    rating,
    comment,
    extraBounty,
  });

  res.status(201).json(review);
}));

router.get('/tasks/:taskId/reviews', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { taskId } = req.params;

  const reviews = await reviewService.getTaskReviews(taskId);

  res.json(reviews);
}));

router.get('/admin/budget', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  const budget = await reviewService.getAdminCurrentBudget(userId);

  if (!budget) {
    return sendNotFound(res);
  }

  res.json(budget);
}));

router.get('/admin/budgets', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  const budgets = await reviewService.getAdminBudgets(userId);

  res.json(budgets);
}));

router.get('/admin/budget/report', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { year, month } = req.query;

  if (!year || !month) {
    return sendValidationError(res, 'Year and month are required');
  }

  const report = await reviewService.getAdminBudgetReport(
    userId,
    queryTransformers.toInt(year as string, new Date().getFullYear()),
    queryTransformers.toInt(month as string, new Date().getMonth() + 1)
  );

  res.json(report);
}));

router.post('/admin/budget', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { adminId, year, month, totalBudget } = req.body;

  const budget = await reviewService.createOrUpdateAdminBudget({
    adminId,
    year,
    month,
    totalBudget,
  });

  res.status(201).json(budget);
}));

export default router;
