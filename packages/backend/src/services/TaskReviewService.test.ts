import { describe, it, expect, beforeEach, afterEach, afterAll } from 'vitest';
import { pool } from '../config/database.js';
import { TaskReviewService } from './TaskReviewService.js';
import { UserService } from './UserService.js';
import { TaskService } from './TaskService.js';
import { UserRole } from '../models/User.js';
import { TaskStatus } from '../models/Task.js';
import { cleanupAllTestData } from '../test-utils/cleanup.js';

describe('TaskReviewService', () => {
  let service: TaskReviewService;
  let userService: UserService;
  let taskService: TaskService;
  let testUserId: string;
  let testAdminId: string;
  let testTaskId: string;

  beforeEach(async () => {
    service = new TaskReviewService();
    userService = new UserService(userRepository, permissionChecker);
    taskService = new TaskService();

    // Create test user
    const user = await userService.createUser({
      username: 'testuser_' + Date.now(),
      email: `testuser_${Date.now()}@example.com`,
      password: 'password123',
      role: UserRole.USER,
    });
    testUserId = user.id;

    // Create test admin
    const admin = await userService.createUser({
      username: 'admin_' + Date.now(),
      email: `admin_${Date.now()}@example.com`,
      password: 'password123',
      role: UserRole.SUPER_ADMIN,
    });
    testAdminId = admin.id;

    // Create and complete test task
    const task = await taskService.createTask({
      name: 'Test Task',
      description: 'Test task for review',
      publisherId: testUserId,
      estimatedHours: 10,
      priority: 3,
    });
    testTaskId = task.id;

    // Assign and complete task
    await taskService.updateTask(testTaskId, {
      assigneeId: testUserId,
      status: TaskStatus.IN_PROGRESS,
    });
    await taskService.updateTask(testTaskId, {
      status: TaskStatus.COMPLETED,
    });

    // Create admin budget
    const now = new Date();
    await service.createOrUpdateAdminBudget({
      adminId: testAdminId,
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      totalBudget: 1000,
    });
  });

  afterEach(async () => {
    // Clean up all test data in correct order to avoid foreign key violations
    await cleanupAllTestData();
  });

  describe('createReview', () => {
    it('should create review by task publisher', async () => {
      const review = await service.createReview({
        taskId: testTaskId,
        reviewerId: testUserId,
        rating: 5,
        comment: 'Great work!',
      });

      expect(review.taskId).toBe(testTaskId);
      expect(review.reviewerId).toBe(testUserId);
      expect(review.rating).toBe(5);
      expect(review.comment).toBe('Great work!');
      expect(review.extraBounty).toBe(0);
    });

    it('should create review by admin with extra bounty', async () => {
      const review = await service.createReview({
        taskId: testTaskId,
        reviewerId: testAdminId,
        rating: 5,
        comment: 'Excellent!',
        extraBounty: 100,
      });

      expect(review.taskId).toBe(testTaskId);
      expect(review.reviewerId).toBe(testAdminId);
      expect(review.extraBounty).toBe(100);

      // Verify budget was deducted
      const budget = await service.getAdminCurrentBudget(testAdminId);
      expect(budget?.usedBudget).toBe(100);
      expect(budget?.remainingBudget).toBe(900);
    });

    it('should reject review with invalid rating', async () => {
      await expect(
        service.createReview({
          taskId: testTaskId,
          reviewerId: testUserId,
          rating: 6,
        })
      ).rejects.toThrow('Rating must be between 1 and 5');

      await expect(
        service.createReview({
          taskId: testTaskId,
          reviewerId: testUserId,
          rating: 0,
        })
      ).rejects.toThrow('Rating must be between 1 and 5');
    });

    it('should reject review with negative extra bounty', async () => {
      await expect(
        service.createReview({
          taskId: testTaskId,
          reviewerId: testAdminId,
          extraBounty: -50,
        })
      ).rejects.toThrow('Extra bounty must be non-negative');
    });

    it('should reject review for non-completed task', async () => {
      // Create new task that's not completed
      const newTask = await taskService.createTask({
        name: 'Incomplete Task',
        publisherId: testUserId,
      });

      await expect(
        service.createReview({
          taskId: newTask.id,
          reviewerId: testUserId,
        })
      ).rejects.toThrow('Can only review completed tasks');
    });

    it('should reject review from unauthorized user', async () => {
      // Create another user
      const otherUser = await userService.createUser({
        username: 'other_' + Date.now(),
        email: `other_${Date.now()}@example.com`,
        password: 'password123',
        role: UserRole.USER,
      });

      await expect(
        service.createReview({
          taskId: testTaskId,
          reviewerId: otherUser.id,
        })
      ).rejects.toThrow('Only task publisher or administrators can review tasks');
    });

    it('should reject duplicate review', async () => {
      await service.createReview({
        taskId: testTaskId,
        reviewerId: testUserId,
        rating: 5,
      });

      await expect(
        service.createReview({
          taskId: testTaskId,
          reviewerId: testUserId,
          rating: 4,
        })
      ).rejects.toThrow('already reviewed');
    });

    it('should reject extra bounty exceeding admin budget', async () => {
      await expect(
        service.createReview({
          taskId: testTaskId,
          reviewerId: testAdminId,
          extraBounty: 1500, // More than budget
        })
      ).rejects.toThrow('Insufficient admin budget');
    });
  });

  describe('getTaskReviews', () => {
    it('should return empty array for task with no reviews', async () => {
      const reviews = await service.getTaskReviews(testTaskId);
      expect(reviews).toEqual([]);
    });

    it('should return all reviews for a task', async () => {
      await service.createReview({
        taskId: testTaskId,
        reviewerId: testUserId,
        rating: 5,
      });

      await service.createReview({
        taskId: testTaskId,
        reviewerId: testAdminId,
        rating: 4,
        extraBounty: 50,
      });

      const reviews = await service.getTaskReviews(testTaskId);
      expect(reviews).toHaveLength(2);
    });
  });

  describe('getReview', () => {
    it('should return specific review', async () => {
      await service.createReview({
        taskId: testTaskId,
        reviewerId: testUserId,
        rating: 5,
        comment: 'Test comment',
      });

      const review = await service.getReview(testTaskId, testUserId);
      expect(review).not.toBeNull();
      expect(review?.rating).toBe(5);
      expect(review?.comment).toBe('Test comment');
    });

    it('should return null for non-existent review', async () => {
      const review = await service.getReview(testTaskId, testAdminId);
      expect(review).toBeNull();
    });
  });

  describe('getReviewsByReviewer', () => {
    it('should return all reviews by a reviewer', async () => {
      await service.createReview({
        taskId: testTaskId,
        reviewerId: testUserId,
        rating: 5,
      });

      const reviews = await service.getReviewsByReviewer(testUserId);
      expect(reviews.length).toBeGreaterThan(0);
      expect(reviews[0].reviewerId).toBe(testUserId);
    });
  });

  describe('Admin Budget Management', () => {
    it('should get admin current budget', async () => {
      const budget = await service.getAdminCurrentBudget(testAdminId);
      expect(budget).not.toBeNull();
      expect(budget?.totalBudget).toBe(1000);
      expect(budget?.usedBudget).toBe(0);
      expect(budget?.remainingBudget).toBe(1000);
    });

    it('should create admin budget', async () => {
      const budget = await service.createOrUpdateAdminBudget({
        adminId: testAdminId,
        year: 2025,
        month: 1,
        totalBudget: 2000,
      });

      expect(budget.totalBudget).toBe(2000);
      expect(budget.year).toBe(2025);
      expect(budget.month).toBe(1);
    });

    it('should update existing admin budget', async () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;

      // Update existing budget
      const budget = await service.createOrUpdateAdminBudget({
        adminId: testAdminId,
        year,
        month,
        totalBudget: 1500,
      });

      expect(budget.totalBudget).toBe(1500);
    });

    it('should reject invalid month', async () => {
      await expect(
        service.createOrUpdateAdminBudget({
          adminId: testAdminId,
          year: 2024,
          month: 13,
          totalBudget: 1000,
        })
      ).rejects.toThrow('Month must be between 1 and 12');
    });

    it('should reject negative budget', async () => {
      await expect(
        service.createOrUpdateAdminBudget({
          adminId: testAdminId,
          year: 2024,
          month: 1,
          totalBudget: -100,
        })
      ).rejects.toThrow('Total budget must be non-negative');
    });

    it('should reject budget for non-admin user', async () => {
      await expect(
        service.createOrUpdateAdminBudget({
          adminId: testUserId, // Regular user
          year: 2024,
          month: 1,
          totalBudget: 1000,
        })
      ).rejects.toThrow('Only administrators can have budgets');
    });

    it('should get all budgets for admin', async () => {
      await service.createOrUpdateAdminBudget({
        adminId: testAdminId,
        year: 2024,
        month: 12,
        totalBudget: 1200,
      });

      const budgets = await service.getAdminBudgets(testAdminId);
      expect(budgets.length).toBeGreaterThan(0);
    });

    it('should get budget report', async () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;

      // Create review with extra bounty
      await service.createReview({
        taskId: testTaskId,
        reviewerId: testAdminId,
        extraBounty: 100,
      });

      const report = await service.getAdminBudgetReport(testAdminId, year, month);

      expect(report.budget).not.toBeNull();
      expect(report.reviews.length).toBeGreaterThan(0);
      expect(report.totalExtraBounty).toBe(100);
    });
  });

  describe('initializeMonthlyBudgets', () => {
    it('should initialize budgets for all admins', async () => {
      const count = await service.initializeMonthlyBudgets(2025, 2, 1500);
      expect(count).toBeGreaterThan(0);

      // Verify budget was created
      const budget = await service.getAdminBudget(testAdminId, 2025, 2);
      expect(budget?.totalBudget).toBe(1500);
    });
  });
});
