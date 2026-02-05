import { describe, it, expect, beforeEach, afterEach, afterAll } from 'vitest';
import { pool } from '../config/database.js';
import { BountyDistributionService } from './BountyDistributionService.js';
import { AllocationType } from '../models/TaskAssistant.js';
import { UserService } from './UserService.js';
import { TaskService } from './TaskService.js';
import { BountyService } from './BountyService.js';
import { UserRole } from '../models/User.js';
import { TaskStatus } from '../models/Task.js';
import { cleanupAllTestData } from '../test-utils/cleanup.js';

describe('BountyDistributionService', () => {
  let service: BountyDistributionService;
  let userService: UserService;
  let taskService: TaskService;
  let bountyService: BountyService;
  let testUserId: string;
  let testAssistantId: string;
  let testTaskId: string;

  beforeEach(async () => {
    service = new BountyDistributionService();
    userService = new UserService();
    taskService = new TaskService();
    bountyService = new BountyService();

    // Create test users
    const user = await userService.createUser({
      username: 'testuser_' + Date.now(),
      email: `testuser_${Date.now()}@example.com`,
      password: 'password123',
      role: UserRole.USER,
    });
    testUserId = user.id;

    const assistant = await userService.createUser({
      username: 'assistant_' + Date.now(),
      email: `assistant_${Date.now()}@example.com`,
      password: 'password123',
      role: UserRole.USER,
    });
    testAssistantId = assistant.id;

    // Create test task
    const task = await taskService.createTask({
      name: 'Test Task',
      description: 'Test task for bounty distribution',
      publisherId: testUserId,
      estimatedHours: 10,
      priority: 3,
    });
    testTaskId = task.id;

    // Assign task to user
    await taskService.updateTask(testTaskId, {
      assigneeId: testUserId,
      status: TaskStatus.IN_PROGRESS,
    });
  });

  afterEach(async () => {
    // Clean up all test data in correct order to avoid foreign key violations
    await cleanupAllTestData();
  });



  describe('addAssistant', () => {
    it('should add assistant with percentage allocation', async () => {
      const assistant = await service.addAssistant({
        taskId: testTaskId,
        userId: testAssistantId,
        allocationType: AllocationType.PERCENTAGE,
        allocationValue: 20,
      });

      expect(assistant.taskId).toBe(testTaskId);
      expect(assistant.userId).toBe(testAssistantId);
      expect(assistant.allocationType).toBe(AllocationType.PERCENTAGE);
      expect(assistant.allocationValue).toBe(20);
    });

    it('should add assistant with fixed allocation', async () => {
      const assistant = await service.addAssistant({
        taskId: testTaskId,
        userId: testAssistantId,
        allocationType: AllocationType.FIXED,
        allocationValue: 50,
      });

      expect(assistant.taskId).toBe(testTaskId);
      expect(assistant.userId).toBe(testAssistantId);
      expect(assistant.allocationType).toBe(AllocationType.FIXED);
      expect(assistant.allocationValue).toBe(50);
    });

    it('should reject percentage allocation over 100%', async () => {
      await expect(
        service.addAssistant({
          taskId: testTaskId,
          userId: testAssistantId,
          allocationType: AllocationType.PERCENTAGE,
          allocationValue: 150,
        })
      ).rejects.toThrow('Percentage allocation cannot exceed 100%');
    });

    it('should reject fixed allocation exceeding task bounty', async () => {
      const task = await taskService.getTask(testTaskId);
      if (!task) throw new Error('Task not found');
      const taskBounty = task.bountyAmount;

      await expect(
        service.addAssistant({
          taskId: testTaskId,
          userId: testAssistantId,
          allocationType: AllocationType.FIXED,
          allocationValue: taskBounty + 100,
        })
      ).rejects.toThrow('cannot exceed task bounty');
    });

    it('should reject negative allocation value', async () => {
      await expect(
        service.addAssistant({
          taskId: testTaskId,
          userId: testAssistantId,
          allocationType: AllocationType.PERCENTAGE,
          allocationValue: -10,
        })
      ).rejects.toThrow('Allocation value must be positive');
    });

    it('should reject duplicate assistant', async () => {
      await service.addAssistant({
        taskId: testTaskId,
        userId: testAssistantId,
        allocationType: AllocationType.PERCENTAGE,
        allocationValue: 20,
      });

      await expect(
        service.addAssistant({
          taskId: testTaskId,
          userId: testAssistantId,
          allocationType: AllocationType.PERCENTAGE,
          allocationValue: 10,
        })
      ).rejects.toThrow('already an assistant');
    });

    it('should reject main assignee as assistant', async () => {
      await expect(
        service.addAssistant({
          taskId: testTaskId,
          userId: testUserId, // Same as assignee
          allocationType: AllocationType.PERCENTAGE,
          allocationValue: 20,
        })
      ).rejects.toThrow('Main assignee cannot be added as assistant');
    });
  });

  describe('getTaskAssistants', () => {
    it('should return empty array for task with no assistants', async () => {
      const assistants = await service.getTaskAssistants(testTaskId);
      expect(assistants).toEqual([]);
    });

    it('should return all assistants for a task', async () => {
      await service.addAssistant({
        taskId: testTaskId,
        userId: testAssistantId,
        allocationType: AllocationType.PERCENTAGE,
        allocationValue: 20,
      });

      const assistants = await service.getTaskAssistants(testTaskId);
      expect(assistants).toHaveLength(1);
      expect(assistants[0].userId).toBe(testAssistantId);
    });
  });

  describe('removeAssistant', () => {
    it('should remove assistant from task', async () => {
      await service.addAssistant({
        taskId: testTaskId,
        userId: testAssistantId,
        allocationType: AllocationType.PERCENTAGE,
        allocationValue: 20,
      });

      await service.removeAssistant(testTaskId, testAssistantId);

      const assistants = await service.getTaskAssistants(testTaskId);
      expect(assistants).toHaveLength(0);
    });

    it('should throw error when removing non-existent assistant', async () => {
      await expect(
        service.removeAssistant(testTaskId, testAssistantId)
      ).rejects.toThrow('Assistant not found');
    });
  });

  describe('calculateDistribution', () => {
    it('should calculate distribution with no assistants', async () => {
      const distribution = await service.calculateDistribution(testTaskId);

      const task = await taskService.getTask(testTaskId);
      if (!task) throw new Error('Task not found');
      expect(distribution.totalBounty).toBe(task.bountyAmount);
      expect(distribution.mainAssignee.userId).toBe(testUserId);
      expect(distribution.mainAssignee.amount).toBe(task.bountyAmount);
      expect(distribution.assistants).toHaveLength(0);
    });

    it('should calculate distribution with percentage assistant', async () => {
      await service.addAssistant({
        taskId: testTaskId,
        userId: testAssistantId,
        allocationType: AllocationType.PERCENTAGE,
        allocationValue: 20,
      });

      const distribution = await service.calculateDistribution(testTaskId);
      const task = await taskService.getTask(testTaskId);
      if (!task) throw new Error('Task not found');

      const expectedAssistantAmount = task.bountyAmount * 0.2;
      const expectedMainAmount = task.bountyAmount - expectedAssistantAmount;

      expect(distribution.assistants).toHaveLength(1);
      expect(distribution.assistants[0].amount).toBeCloseTo(expectedAssistantAmount, 2);
      expect(distribution.mainAssignee.amount).toBeCloseTo(expectedMainAmount, 2);
    });

    it('should calculate distribution with fixed assistant', async () => {
      const fixedAmount = 50;
      await service.addAssistant({
        taskId: testTaskId,
        userId: testAssistantId,
        allocationType: AllocationType.FIXED,
        allocationValue: fixedAmount,
      });

      const distribution = await service.calculateDistribution(testTaskId);
      const task = await taskService.getTask(testTaskId);
      if (!task) throw new Error('Task not found');

      const expectedMainAmount = task.bountyAmount - fixedAmount;

      expect(distribution.assistants).toHaveLength(1);
      expect(distribution.assistants[0].amount).toBe(fixedAmount);
      expect(distribution.mainAssignee.amount).toBeCloseTo(expectedMainAmount, 2);
    });

    it('should calculate distribution with mixed allocation types', async () => {
      const fixedAmount = 30;
      const percentageValue = 20;

      // Create second assistant
      const assistant2 = await userService.createUser({
        username: 'assistant2_' + Date.now(),
        email: `assistant2_${Date.now()}@example.com`,
        password: 'password123',
        role: UserRole.USER,
      });

      await service.addAssistant({
        taskId: testTaskId,
        userId: testAssistantId,
        allocationType: AllocationType.FIXED,
        allocationValue: fixedAmount,
      });

      await service.addAssistant({
        taskId: testTaskId,
        userId: assistant2.id,
        allocationType: AllocationType.PERCENTAGE,
        allocationValue: percentageValue,
      });

      const distribution = await service.calculateDistribution(testTaskId);
      const task = await taskService.getTask(testTaskId);
      if (!task) throw new Error('Task not found');

      // Fixed allocation comes first
      const remainingAfterFixed = task.bountyAmount - fixedAmount;
      // Percentage is calculated from remaining
      const percentageAmount = remainingAfterFixed * (percentageValue / 100);
      const expectedMainAmount = task.bountyAmount - fixedAmount - percentageAmount;

      expect(distribution.assistants).toHaveLength(2);
      
      const fixedAssistant = distribution.assistants.find(a => a.allocationType === AllocationType.FIXED);
      const percentageAssistant = distribution.assistants.find(a => a.allocationType === AllocationType.PERCENTAGE);

      expect(fixedAssistant?.amount).toBe(fixedAmount);
      expect(percentageAssistant?.amount).toBeCloseTo(percentageAmount, 2);
      expect(distribution.mainAssignee.amount).toBeCloseTo(expectedMainAmount, 2);

      // Clean up
      await pool.query('DELETE FROM users WHERE id = $1', [assistant2.id]);
    });

    it('should throw error for unassigned task', async () => {
      // Create unassigned task
      const unassignedTask = await taskService.createTask({
        name: 'Unassigned Task',
        publisherId: testUserId,
      });

      await expect(
        service.calculateDistribution(unassignedTask.id)
      ).rejects.toThrow('Cannot distribute bounty for unassigned task');

      // Clean up
      await pool.query('DELETE FROM tasks WHERE id = $1', [unassignedTask.id]);
    });
  });

  describe('distributeBounty', () => {
    it('should distribute bounty and create transactions', async () => {
      await service.addAssistant({
        taskId: testTaskId,
        userId: testAssistantId,
        allocationType: AllocationType.PERCENTAGE,
        allocationValue: 20,
      });

      const distribution = await service.distributeBounty(testTaskId);

      expect(distribution.transactionIds.length).toBeGreaterThan(0);

      // Verify task is marked as settled
      const task = await taskService.getTask(testTaskId);
      if (!task) throw new Error('Task not found');
      expect(task.isBountySettled).toBe(true);

      // Verify transactions were created
      const transactions = await service.getTaskTransactions(testTaskId);
      expect(transactions.length).toBeGreaterThanOrEqual(2); // Main + assistant
    });

    it('should throw error when distributing already settled bounty', async () => {
      await service.distributeBounty(testTaskId);

      await expect(
        service.distributeBounty(testTaskId)
      ).rejects.toThrow('Bounty already settled');
    });
  });

  describe('getTaskTransactions', () => {
    it('should return empty array for task with no transactions', async () => {
      const transactions = await service.getTaskTransactions(testTaskId);
      expect(transactions).toEqual([]);
    });

    it('should return all transactions for a task', async () => {
      await service.distributeBounty(testTaskId);

      const transactions = await service.getTaskTransactions(testTaskId);
      expect(transactions.length).toBeGreaterThan(0);
      expect(transactions[0].taskId).toBe(testTaskId);
    });
  });

  describe('getUserTransactions', () => {
    it('should return all transactions for a user', async () => {
      await service.distributeBounty(testTaskId);

      const transactions = await service.getUserTransactions(testUserId);
      expect(transactions.length).toBeGreaterThan(0);
      expect(transactions[0].userId).toBe(testUserId);
    });
  });
});
