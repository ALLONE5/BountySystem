import { pool } from '../config/database.js';
import { TaskReview, TaskReviewCreateDTO } from '../models/TaskReview.js';
import { AdminBudget, AdminBudgetCreateDTO } from '../models/AdminBudget.js';
import { ValidationError, NotFoundError, ForbiddenError } from '../utils/errors.js';
import { UserRole } from '../models/User.js';
import { TaskStatus } from '../models/Task.js';
import { logger } from '../config/logger.js';
import { Validator } from '../utils/Validator.js';

/**
 * Helper function to convert numeric fields from PostgreSQL to numbers
 */
function convertReviewNumericFields(review: any): TaskReview {
  return {
    ...review,
    extraBounty: parseFloat(review.extraBounty as any) || 0,
  };
}

export class TaskReviewService {
  /**
   * Create a task review with optional extra bounty
   * Requirements 18.1, 18.2, 18.3, 18.4, 18.5: Task review and extra bounty management
   */
  async createReview(reviewData: TaskReviewCreateDTO): Promise<TaskReview> {
    const { taskId, reviewerId, rating, comment, extraBounty = 0 } = reviewData;

    // Validate rating if provided
    if (rating !== undefined) {
      Validator.taskRating(rating, 'Rating');
    }

    // Validate extra bounty is non-negative
    Validator.bountyAmount(extraBounty, 'Extra bounty');

    // Get task information
    const taskQuery = `
      SELECT status, publisher_id, assignee_id
      FROM tasks
      WHERE id = $1
    `;
    const taskResult = await pool.query(taskQuery, [taskId]);

    if (taskResult.rows.length === 0) {
      throw new NotFoundError('Task not found');
    }

    const task = taskResult.rows[0];

    // Verify task is completed
    if (task.status !== TaskStatus.COMPLETED) {
      throw new ValidationError('Can only review completed tasks');
    }

    // Get reviewer information
    const reviewerQuery = 'SELECT role FROM users WHERE id = $1';
    const reviewerResult = await pool.query(reviewerQuery, [reviewerId]);

    if (reviewerResult.rows.length === 0) {
      throw new NotFoundError('Reviewer not found');
    }

    const reviewerRole = reviewerResult.rows[0].role;

    // Verify reviewer is task publisher or admin
    const isPublisher = task.publisher_id === reviewerId;
    const isAdmin = Validator.isAdmin(reviewerRole);

    if (!isPublisher && !isAdmin) {
      throw new ForbiddenError('Only task publisher or administrators can review tasks');
    }

    // If extra bounty is provided, verify admin has sufficient budget
    if (extraBounty > 0 && isAdmin) {
      const budget = await this.getAdminCurrentBudget(reviewerId);
      if (!budget) {
        throw new ValidationError('Admin budget not found for current month');
      }
      if (budget.remainingBudget < extraBounty) {
        throw new ValidationError(
          `Insufficient admin budget. Available: ${budget.remainingBudget}, Required: ${extraBounty}`
        );
      }
    }

    // Create review (budget deduction is handled by database trigger)
    const insertQuery = `
      INSERT INTO task_reviews (task_id, reviewer_id, rating, comment, extra_bounty)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING 
        id,
        task_id as "taskId",
        reviewer_id as "reviewerId",
        rating,
        comment,
        extra_bounty as "extraBounty",
        created_at as "createdAt"
    `;

    try {
      const result = await pool.query(insertQuery, [
        taskId,
        reviewerId,
        rating || null,
        comment || null,
        extraBounty,
      ]);

      return convertReviewNumericFields(result.rows[0]);
    } catch (error: any) {
      if (error.code === '23505') { // Unique violation
        throw new ValidationError('You have already reviewed this task');
      }
      // Database trigger errors
      if (error.message.includes('Insufficient admin budget')) {
        throw new ValidationError('Insufficient admin budget');
      }
      if (error.message.includes('Admin budget not found')) {
        throw new ValidationError('Admin budget not found for current month');
      }
      throw error;
    }
  }

  /**
   * Get all reviews for a task
   */
  async getTaskReviews(taskId: string): Promise<TaskReview[]> {
    const query = `
      SELECT 
        id,
        task_id as "taskId",
        reviewer_id as "reviewerId",
        rating,
        comment,
        extra_bounty as "extraBounty",
        created_at as "createdAt"
      FROM task_reviews
      WHERE task_id = $1
      ORDER BY created_at DESC
    `;

    const result = await pool.query(query, [taskId]);
    return result.rows.map(convertReviewNumericFields);
  }

  /**
   * Get a specific review
   */
  async getReview(taskId: string, reviewerId: string): Promise<TaskReview | null> {
    const query = `
      SELECT 
        id,
        task_id as "taskId",
        reviewer_id as "reviewerId",
        rating,
        comment,
        extra_bounty as "extraBounty",
        created_at as "createdAt"
      FROM task_reviews
      WHERE task_id = $1 AND reviewer_id = $2
    `;

    const result = await pool.query(query, [taskId, reviewerId]);
    return result.rows[0] ? convertReviewNumericFields(result.rows[0]) : null;
  }

  /**
   * Get all reviews by a reviewer
   */
  async getReviewsByReviewer(reviewerId: string): Promise<TaskReview[]> {
    const query = `
      SELECT 
        id,
        task_id as "taskId",
        reviewer_id as "reviewerId",
        rating,
        comment,
        extra_bounty as "extraBounty",
        created_at as "createdAt"
      FROM task_reviews
      WHERE reviewer_id = $1
      ORDER BY created_at DESC
    `;

    const result = await pool.query(query, [reviewerId]);
    return result.rows.map(convertReviewNumericFields);
  }

  /**
   * Get admin's current month budget
   * Requirement 21.1, 21.2, 21.3, 21.4: Admin budget management
   */
  async getAdminCurrentBudget(adminId: string): Promise<AdminBudget | null> {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    return this.getAdminBudget(adminId, year, month);
  }

  /**
   * Get admin budget for a specific month
   */
  async getAdminBudget(adminId: string, year: number, month: number): Promise<AdminBudget | null> {
    const query = `
      SELECT 
        id,
        admin_id as "adminId",
        year,
        month,
        total_budget as "totalBudget",
        used_budget as "usedBudget",
        remaining_budget as "remainingBudget",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM admin_budgets
      WHERE admin_id = $1 AND year = $2 AND month = $3
    `;

    const result = await pool.query(query, [adminId, year, month]);
    return result.rows[0] || null;
  }

  /**
   * Create or update admin budget for a month
   * Requirement 21.1: Automatic monthly budget update
   */
  async createOrUpdateAdminBudget(budgetData: AdminBudgetCreateDTO): Promise<AdminBudget> {
    const { adminId, year, month, totalBudget } = budgetData;

    // Validate month
    Validator.range(month, 1, 12, 'Month');

    // Validate year
    Validator.min(year, 2000, 'Year');

    // Validate total budget
    Validator.bountyAmount(totalBudget, 'Total budget');

    // Verify user is admin
    const userQuery = 'SELECT role FROM users WHERE id = $1';
    const userResult = await pool.query(userQuery, [adminId]);

    if (userResult.rows.length === 0) {
      throw new NotFoundError('User not found');
    }

    const userRole = userResult.rows[0].role;
    if (!Validator.isAdmin(userRole)) {
      throw new ValidationError('Only administrators can have budgets');
    }

    // Insert or update budget
    const query = `
      INSERT INTO admin_budgets (admin_id, year, month, total_budget)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (admin_id, year, month)
      DO UPDATE SET 
        total_budget = EXCLUDED.total_budget,
        updated_at = NOW()
      RETURNING 
        id,
        admin_id as "adminId",
        year,
        month,
        total_budget as "totalBudget",
        used_budget as "usedBudget",
        remaining_budget as "remainingBudget",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    const result = await pool.query(query, [adminId, year, month, totalBudget]);
    return result.rows[0];
  }

  /**
   * Get all budgets for an admin
   */
  async getAdminBudgets(adminId: string): Promise<AdminBudget[]> {
    const query = `
      SELECT 
        id,
        admin_id as "adminId",
        year,
        month,
        total_budget as "totalBudget",
        used_budget as "usedBudget",
        remaining_budget as "remainingBudget",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM admin_budgets
      WHERE admin_id = $1
      ORDER BY year DESC, month DESC
    `;

    const result = await pool.query(query, [adminId]);
    return result.rows;
  }

  /**
   * Initialize budgets for all admins for a given month
   * Requirement 21.1: Automatic monthly budget initialization
   */
  async initializeMonthlyBudgets(year: number, month: number, defaultBudget: number): Promise<number> {
    // Get all admins
    const adminsQuery = `
      SELECT id FROM users 
      WHERE role IN ('position_admin', 'super_admin')
    `;
    const adminsResult = await pool.query(adminsQuery);

    let count = 0;
    for (const admin of adminsResult.rows) {
      try {
        await this.createOrUpdateAdminBudget({
          adminId: admin.id,
          year,
          month,
          totalBudget: defaultBudget,
        });
        count++;
      } catch (error) {
        logger.error('Failed to initialize budget for admin', error as Error, { adminId: admin.id });
      }
    }

    return count;
  }

  /**
   * Get budget usage report for an admin
   * Requirement 21.5: Monthly expenditure report
   */
  async getAdminBudgetReport(adminId: string, year: number, month: number): Promise<{
    budget: AdminBudget | null;
    reviews: TaskReview[];
    totalExtraBounty: number;
  }> {
    const budget = await this.getAdminBudget(adminId, year, month);

    // Get all reviews with extra bounty for this month
    const reviewsQuery = `
      SELECT 
        id,
        task_id as "taskId",
        reviewer_id as "reviewerId",
        rating,
        comment,
        extra_bounty as "extraBounty",
        created_at as "createdAt"
      FROM task_reviews
      WHERE reviewer_id = $1
        AND EXTRACT(YEAR FROM created_at) = $2
        AND EXTRACT(MONTH FROM created_at) = $3
        AND extra_bounty > 0
      ORDER BY created_at DESC
    `;

    const reviewsResult = await pool.query(reviewsQuery, [adminId, year, month]);
    const reviews = reviewsResult.rows.map(convertReviewNumericFields);

    const totalExtraBounty = reviews.reduce(
      (sum, review) => sum + review.extraBounty,
      0
    );

    return {
      budget,
      reviews,
      totalExtraBounty: parseFloat(totalExtraBounty.toFixed(2)),
    };
  }
}
