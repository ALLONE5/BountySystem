import type { Request, Response } from 'express';
import { Router } from 'express';
import type { Pool } from 'pg';
import { BountyHistoryService } from '../services/BountyHistoryService.js';
import { TransactionType } from '../models/BountyTransaction.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/errors.js';
import { parsePagination } from '../utils/pagination.js';
import { queryTransformers, validateUuid } from '../utils/queryValidation.js';

/**
 * Create bounty history router
 * Follows the pattern established by ranking.routes.ts
 */
export function createBountyHistoryRouter(pool: Pool): Router {
  const router = Router();
  const bountyHistoryService = new BountyHistoryService(pool);

  /**
   * GET /api/bounty-history/:userId
   * Get paginated transaction history for a user
   * Query params: page (default: 1), limit (default: 20), type (optional filter)
   */
  router.get(
    '/:userId',
    authenticate,
    asyncHandler(async (req: Request, res: Response) => {
      const { userId } = req.params;
      const { page, limit, type } = req.query;
      const user = (req as any).user;

      // Validate userId format (UUID)
      validateUuid(userId, 'User ID');

      // Authorization: Users can only view their own history, super admins can view any
      if (user.userId !== userId && user.role !== 'super_admin' && user.role !== 'developer') {
        throw new AppError(
          'FORBIDDEN',
          'You do not have permission to view this user\'s transaction history',
          403
        );
      }

      // Parse and validate pagination parameters
      const { page: pageNum, pageSize: limitNum } = parsePagination({
        page: page as string,
        pageSize: limit as string,
        maxPageSize: 100
      });

      // Validate transaction type if provided
      let transactionType: TransactionType | undefined;
      if (type) {
        if (!Object.values(TransactionType).includes(type as TransactionType)) {
          throw new AppError(
            'VALIDATION_ERROR',
            'Invalid transaction type. Must be one of: task_completion, extra_reward, assistant_share, refund',
            400
          );
        }
        transactionType = type as TransactionType;
      }

      // Fetch transaction history
      const result = await bountyHistoryService.getUserTransactionHistory(userId, {
        page: pageNum,
        limit: limitNum,
        type: transactionType,
      });

      res.json(result);
    })
  );

  /**
   * GET /api/bounty-history/:userId/summary
   * Get summary statistics for a user's bounty transactions
   * Query params: type (optional filter)
   */
  router.get(
    '/:userId/summary',
    authenticate,
    asyncHandler(async (req: Request, res: Response) => {
      const { userId } = req.params;
      const { type } = req.query;
      const user = (req as any).user;

      // Validate userId format (UUID)
      validateUuid(userId, 'User ID');

      // Authorization: Users can only view their own summary, super admins can view any
      if (user.userId !== userId && user.role !== 'super_admin' && user.role !== 'developer') {
        throw new AppError(
          'FORBIDDEN',
          'You do not have permission to view this user\'s bounty summary',
          403
        );
      }

      // Validate transaction type if provided
      let transactionType: TransactionType | undefined;
      if (type) {
        if (!Object.values(TransactionType).includes(type as TransactionType)) {
          throw new AppError(
            'VALIDATION_ERROR',
            'Invalid transaction type. Must be one of: task_completion, extra_reward, assistant_share, refund',
            400
          );
        }
        transactionType = type as TransactionType;
      }

      // Fetch summary
      const summary = await bountyHistoryService.getUserBountySummary(
        userId,
        transactionType
      );

      res.json(summary);
    })
  );

  return router;
}
