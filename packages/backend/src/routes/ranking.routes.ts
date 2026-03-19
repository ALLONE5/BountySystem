import type { Request, Response } from 'express';
import { Router } from 'express';
import type { Pool } from 'pg';
import { RankingService } from '../services/RankingService.js';
import { rankingUpdateQueue } from '../services/RankingUpdateQueue.js';
import { RankingPeriod } from '../models/Ranking.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/errors.js';
import { queryTransformers } from '../utils/queryValidation.js';
import { sendSuccess } from '../utils/responseHelpers.js';
import { logger } from '../config/logger.js';

export function createRankingRouter(pool: Pool): Router {
  const router = Router();
  const rankingService = new RankingService(pool);

  /**
   * GET /api/rankings
   * Get rankings for a specific period
   * If no period specified, returns current month rankings
   * Returns both rankings list and current user's ranking
   */
  router.get('/', authenticate, asyncHandler(async (req: Request, res: Response) => {
    const { period, year, month, quarter, limit } = req.query;
    const user = (req as any).user;

    // If no period specified, return current month rankings
    if (!period) {
      const rankings = await rankingService.getCurrentMonthRankings(
        limit ? queryTransformers.toInt(limit as string, 50) : undefined
      );
      
      // Find current user's ranking in the list
      const myRanking = rankings.find(r => r.userId === user.userId) || null;
      
      sendSuccess(res, {
        rankings,
        myRanking
      });
      return;
    }

    if (!Object.values(RankingPeriod).includes(period as RankingPeriod)) {
      throw new AppError('VALIDATION_ERROR', 'Valid period is required (monthly, quarterly, all_time)', 400);
    }

    const rankings = await rankingService.getRankings({
      period: period as RankingPeriod,
      year: year ? queryTransformers.toInt(year as string, new Date().getFullYear()) : undefined,
      month: month ? queryTransformers.toInt(month as string, 1) : undefined,
      quarter: quarter ? queryTransformers.toInt(quarter as string, 1) : undefined,
      limit: limit ? queryTransformers.toInt(limit as string, 50) : undefined,
    });

    // Find current user's ranking in the list
    const myRanking = rankings.find(r => r.userId === user.userId) || null;

    sendSuccess(res, {
      rankings,
      myRanking
    });
  }));

  /**
   * GET /api/rankings/current/monthly
   * Get current month rankings
   */
  router.get('/current/monthly', authenticate, asyncHandler(async (req: Request, res: Response) => {
    const { limit } = req.query;
    const rankings = await rankingService.getCurrentMonthRankings(
      limit ? queryTransformers.toInt(limit as string, 50) : undefined
    );
    sendSuccess(res, rankings);
  }));

  /**
   * GET /api/rankings/current/quarterly
   * Get current quarter rankings
   */
  router.get('/current/quarterly', authenticate, asyncHandler(async (req: Request, res: Response) => {
    const { limit } = req.query;
    const rankings = await rankingService.getCurrentQuarterRankings(
      limit ? queryTransformers.toInt(limit as string, 50) : undefined
    );
    sendSuccess(res, rankings);
  }));

  /**
   * GET /api/rankings/all-time
   * Get all-time rankings
   */
  router.get('/all-time', authenticate, asyncHandler(async (req: Request, res: Response) => {
    const { limit } = req.query;
    const rankings = await rankingService.getAllTimeRankings(
      limit ? queryTransformers.toInt(limit as string, 50) : undefined
    );
    sendSuccess(res, rankings);
  }));

  /**
   * GET /api/rankings/user/:userId
   * Get user's ranking for a specific period
   */
  router.get('/user/:userId', authenticate, asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { period, year, month, quarter } = req.query;

    if (!period || !Object.values(RankingPeriod).includes(period as RankingPeriod)) {
      throw new AppError('VALIDATION_ERROR', 'Valid period is required (monthly, quarterly, all_time)', 400);
    }

    const ranking = await rankingService.getUserRanking(
      userId,
      period as RankingPeriod,
      year ? queryTransformers.toInt(year as string, new Date().getFullYear()) : undefined,
      month ? queryTransformers.toInt(month as string, 1) : undefined,
      quarter ? queryTransformers.toInt(quarter as string, 1) : undefined
    );

    if (!ranking) {
      // Return default ranking data for users without rankings
      const defaultRanking = {
        userId,
        username: null,
        avatarUrl: null,
        totalBounty: 0,
        completedTasksCount: 0,
        rank: null,
        period: period as RankingPeriod,
        year: year ? queryTransformers.toInt(year as string, new Date().getFullYear()) : new Date().getFullYear(),
        month: month ? queryTransformers.toInt(month as string, 1) : null,
        quarter: quarter ? queryTransformers.toInt(quarter as string, 1) : null,
        user: null
      };
      sendSuccess(res, defaultRanking);
      return;
    }

    sendSuccess(res, ranking);
  }));

  /**
   * POST /api/rankings/calculate
   * Calculate rankings for a specific period (admin only)
   */
  router.post('/calculate', authenticate, asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    
    // Only super admins can trigger ranking calculations
    if (user.role !== 'super_admin' && user.role !== 'developer') {
      throw new AppError('FORBIDDEN', 'Only super admins can calculate rankings', 403);
    }

    const { period, year, month, quarter } = req.body;

    if (!period || !Object.values(RankingPeriod).includes(period)) {
      throw new AppError('VALIDATION_ERROR', 'Valid period is required (monthly, quarterly, all_time)', 400);
    }

    if (!year) {
      throw new AppError('VALIDATION_ERROR', 'Year is required', 400);
    }

    const rankings = await rankingService.calculateRankings(
      period,
      year,
      month,
      quarter
    );

    res.json({
      message: 'Rankings calculated successfully',
      count: rankings.length,
      rankings,
    });
  }));

  /**
   * POST /api/rankings/update-all
   * Update all rankings (monthly, quarterly, all-time) (admin only)
   * This endpoint forces an immediate update, bypassing the debounce queue
   */
  router.post('/update-all', authenticate, asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    
    // Only super admins can trigger ranking updates
    if (user.role !== 'super_admin' && user.role !== 'developer') {
      throw new AppError('FORBIDDEN', 'Only super admins can update rankings', 403);
    }

    // Force immediate update (bypass debouncing)
    await rankingUpdateQueue.forceUpdate();

    sendSuccess(res, {
      message: 'All rankings updated successfully',
    });
  }));

  /**
   * GET /api/rankings/status
   * Get ranking update queue status
   */
  router.get('/status', authenticate, asyncHandler(async (req: Request, res: Response) => {
    const status = {
      isUpdating: rankingUpdateQueue.isUpdateInProgress(),
      hasPendingUpdate: rankingUpdateQueue.hasPendingUpdate(),
      debounceDelay: rankingUpdateQueue.getDebounceDelay(),
    };

    sendSuccess(res, status);
  }));

  return router;
}
