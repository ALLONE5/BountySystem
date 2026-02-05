import { describe, it, expect, beforeEach, afterEach, afterAll } from 'vitest';
import { pool } from '../config/database.js';
import { BountyService } from './BountyService.js';
import { TaskService } from './TaskService.js';
import { UserService } from './UserService.js';
import { BountyCalculationInput } from '../models/BountyAlgorithm.js';
import { TaskStatus } from '../models/Task.js';

describe('BountyService', () => {
  let bountyService: BountyService;
  let taskService: TaskService;
  let userService: UserService;
  let testUserId: string;
  let testAlgorithmVersion: string;

  beforeEach(async () => {
    bountyService = new BountyService();
    taskService = new TaskService();
    userService = new UserService();

    // Create a test user
    const user = await userService.createUser({
      username: `bountytest_${Date.now()}`,
      email: `bountytest_${Date.now()}@example.com`,
      password: 'password123',
    });
    testUserId = user.id;

    // Create a test bounty algorithm
    const algorithm = await bountyService.createAlgorithm({
      version: `test_v${Date.now()}`,
      baseAmount: 100,
      urgencyWeight: 10,
      importanceWeight: 20,
      durationWeight: 5,
      formula: 'baseAmount + (urgency * urgencyWeight) + (importance * importanceWeight) + (duration * durationWeight)',
      createdBy: testUserId,
    });
    testAlgorithmVersion = algorithm.version;
  });

  afterEach(async () => {
    // Clean up test data
    await pool.query('DELETE FROM tasks WHERE publisher_id = $1', [testUserId]);
    await pool.query('DELETE FROM bounty_algorithms WHERE created_by = $1', [testUserId]);
    await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
  });



  describe('calculateBounty', () => {
    it('should calculate bounty with all parameters', async () => {
      const input: BountyCalculationInput = {
        estimatedHours: 10,
        complexity: 3,
        priority: 4,
        plannedStartDate: new Date(),
        plannedEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      };

      const result = await bountyService.calculateBounty(input);

      expect(result.amount).toBeGreaterThan(0);
      expect(result.algorithmVersion).toBe(testAlgorithmVersion);
    });

    it('should calculate bounty with minimal parameters', async () => {
      const input: BountyCalculationInput = {
        estimatedHours: null,
        complexity: null,
        priority: null,
        plannedStartDate: null,
        plannedEndDate: null,
      };

      const result = await bountyService.calculateBounty(input);

      // Should still return base amount
      expect(result.amount).toBeGreaterThanOrEqual(100);
      expect(result.algorithmVersion).toBe(testAlgorithmVersion);
    });

    it('should calculate higher bounty for urgent tasks', async () => {
      const urgentInput: BountyCalculationInput = {
        estimatedHours: 10,
        complexity: 3,
        priority: 4,
        plannedStartDate: new Date(),
        plannedEndDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now (urgent)
      };

      const normalInput: BountyCalculationInput = {
        estimatedHours: 10,
        complexity: 3,
        priority: 4,
        plannedStartDate: new Date(),
        plannedEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      };

      const urgentResult = await bountyService.calculateBounty(urgentInput);
      const normalResult = await bountyService.calculateBounty(normalInput);

      expect(urgentResult.amount).toBeGreaterThan(normalResult.amount);
    });

    it('should calculate higher bounty for higher priority tasks', async () => {
      const highPriorityInput: BountyCalculationInput = {
        estimatedHours: 10,
        complexity: 3,
        priority: 5,
        plannedStartDate: new Date(),
        plannedEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };

      const lowPriorityInput: BountyCalculationInput = {
        estimatedHours: 10,
        complexity: 3,
        priority: 1,
        plannedStartDate: new Date(),
        plannedEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };

      const highResult = await bountyService.calculateBounty(highPriorityInput);
      const lowResult = await bountyService.calculateBounty(lowPriorityInput);

      expect(highResult.amount).toBeGreaterThan(lowResult.amount);
    });

    it('should calculate higher bounty for longer duration tasks', async () => {
      const longInput: BountyCalculationInput = {
        estimatedHours: 100,
        complexity: 3,
        priority: 3,
        plannedStartDate: new Date(),
        plannedEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };

      const shortInput: BountyCalculationInput = {
        estimatedHours: 1,
        complexity: 3,
        priority: 3,
        plannedStartDate: new Date(),
        plannedEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };

      const longResult = await bountyService.calculateBounty(longInput);
      const shortResult = await bountyService.calculateBounty(shortInput);

      expect(longResult.amount).toBeGreaterThan(shortResult.amount);
    });
  });

  describe('createAlgorithm', () => {
    it('should create a new bounty algorithm', async () => {
      const algorithm = await bountyService.createAlgorithm({
        version: `test_create_${Date.now()}`,
        baseAmount: 200,
        urgencyWeight: 15,
        importanceWeight: 25,
        durationWeight: 10,
        formula: 'test formula',
        createdBy: testUserId,
      });

      expect(algorithm.id).toBeDefined();
      expect(algorithm.version).toContain('test_create_');
      expect(parseFloat(algorithm.baseAmount as any)).toBe(200);
      expect(parseFloat(algorithm.urgencyWeight as any)).toBe(15);
      expect(parseFloat(algorithm.importanceWeight as any)).toBe(25);
      expect(parseFloat(algorithm.durationWeight as any)).toBe(10);
    });

    it('should reject duplicate algorithm versions', async () => {
      const version = `test_duplicate_${Date.now()}`;
      
      await bountyService.createAlgorithm({
        version,
        baseAmount: 100,
        urgencyWeight: 10,
        importanceWeight: 20,
        durationWeight: 5,
        formula: 'test',
        createdBy: testUserId,
      });

      await expect(
        bountyService.createAlgorithm({
          version,
          baseAmount: 200,
          urgencyWeight: 10,
          importanceWeight: 20,
          durationWeight: 5,
          formula: 'test',
          createdBy: testUserId,
        })
      ).rejects.toThrow('Algorithm version already exists');
    });

    it('should reject negative weights', async () => {
      await expect(
        bountyService.createAlgorithm({
          version: `test_negative_${Date.now()}`,
          baseAmount: 100,
          urgencyWeight: -10,
          importanceWeight: 20,
          durationWeight: 5,
          formula: 'test',
          createdBy: testUserId,
        })
      ).rejects.toThrow('Algorithm weights must be non-negative');
    });

    it('should reject negative base amount', async () => {
      await expect(
        bountyService.createAlgorithm({
          version: `test_negative_base_${Date.now()}`,
          baseAmount: -100,
          urgencyWeight: 10,
          importanceWeight: 20,
          durationWeight: 5,
          formula: 'test',
          createdBy: testUserId,
        })
      ).rejects.toThrow('Base amount must be non-negative');
    });
  });

  describe('getCurrentAlgorithm', () => {
    it('should return the most recent algorithm', async () => {
      const algorithm = await bountyService.getCurrentAlgorithm();
      
      expect(algorithm).toBeDefined();
      expect(algorithm?.version).toBe(testAlgorithmVersion);
    });
  });

  describe('getAlgorithmByVersion', () => {
    it('should retrieve algorithm by version', async () => {
      const algorithm = await bountyService.getAlgorithmByVersion(testAlgorithmVersion);
      
      expect(algorithm).toBeDefined();
      expect(algorithm?.version).toBe(testAlgorithmVersion);
      expect(parseFloat(algorithm?.baseAmount as any)).toBe(100);
    });

    it('should return null for non-existent version', async () => {
      const algorithm = await bountyService.getAlgorithmByVersion('non_existent_version');
      
      expect(algorithm).toBeNull();
    });
  });

  describe('recalculateBounty', () => {
    it('should recalculate bounty for unsettled task', async () => {
      // Create a task
      const task = await taskService.createTask({
        name: 'Test Task',
        publisherId: testUserId,
        estimatedHours: 5,
        priority: 2,
        plannedStartDate: new Date(),
        plannedEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      const originalBounty = task.bountyAmount;

      // Update task to change bounty-affecting attributes
      const updatedTask = await taskService.updateTask(task.id, {
        estimatedHours: 20,
        priority: 5,
      });

      // Bounty should have been recalculated
      expect(parseFloat(updatedTask.bountyAmount as any)).not.toBe(parseFloat(originalBounty as any));
      expect(parseFloat(updatedTask.bountyAmount as any)).toBeGreaterThan(parseFloat(originalBounty as any));
    });

    it('should not recalculate bounty for settled task', async () => {
      // Create a task
      const task = await taskService.createTask({
        name: 'Test Task',
        publisherId: testUserId,
        estimatedHours: 5,
        priority: 2,
      });

      // Settle the bounty
      await bountyService.settleBounty(task.id);

      // Get the settled task
      const settledTask = await taskService.getTask(task.id);
      const settledBounty = settledTask!.bountyAmount;

      // Try to update task attributes
      const updatedTask = await taskService.updateTask(task.id, {
        estimatedHours: 20,
        priority: 5,
      });

      // Bounty should remain the same
      expect(parseFloat(updatedTask.bountyAmount as any)).toBe(parseFloat(settledBounty as any));
    });
  });

  describe('algorithm version isolation', () => {
    it('should use different algorithm versions for tasks created at different times', async () => {
      // Create first task with current algorithm
      const task1 = await taskService.createTask({
        name: 'Task 1',
        publisherId: testUserId,
        estimatedHours: 10,
        priority: 3,
      });

      expect(task1.bountyAlgorithmVersion).toBe(testAlgorithmVersion);

      // Create a new algorithm
      const newAlgorithm = await bountyService.createAlgorithm({
        version: `test_v_new_${Date.now()}`,
        baseAmount: 500,
        urgencyWeight: 50,
        importanceWeight: 100,
        durationWeight: 25,
        formula: 'new formula',
        effectiveFrom: new Date(),
        createdBy: testUserId,
      });

      // Create second task with new algorithm
      const task2 = await taskService.createTask({
        name: 'Task 2',
        publisherId: testUserId,
        estimatedHours: 10,
        priority: 3,
      });

      expect(task2.bountyAlgorithmVersion).toBe(newAlgorithm.version);
      expect(task2.bountyAlgorithmVersion).not.toBe(task1.bountyAlgorithmVersion);
      
      // Task 2 should have higher bounty due to new algorithm
      expect(parseFloat(task2.bountyAmount as any)).toBeGreaterThan(parseFloat(task1.bountyAmount as any));
    });
  });

  describe('integration with TaskService', () => {
    it('should automatically calculate bounty when creating task', async () => {
      const task = await taskService.createTask({
        name: 'Auto Bounty Task',
        publisherId: testUserId,
        estimatedHours: 10,
        complexity: 3,
        priority: 4,
        plannedStartDate: new Date(),
        plannedEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      expect(parseFloat(task.bountyAmount as any)).toBeGreaterThan(0);
      expect(task.bountyAlgorithmVersion).toBe(testAlgorithmVersion);
    });

    it('should recalculate bounty when task attributes change', async () => {
      const task = await taskService.createTask({
        name: 'Recalc Task',
        publisherId: testUserId,
        estimatedHours: 5,
        priority: 2,
      });

      const originalBounty = task.bountyAmount;

      const updatedTask = await taskService.updateTask(task.id, {
        estimatedHours: 50,
        priority: 5,
      });

      expect(parseFloat(updatedTask.bountyAmount as any)).toBeGreaterThan(parseFloat(originalBounty as any));
    });

    it('should not recalculate bounty when non-bounty attributes change', async () => {
      const task = await taskService.createTask({
        name: 'No Recalc Task',
        publisherId: testUserId,
        estimatedHours: 10,
        priority: 3,
      });

      const originalBounty = task.bountyAmount;

      const updatedTask = await taskService.updateTask(task.id, {
        name: 'Updated Name',
        description: 'Updated description',
      });

      expect(parseFloat(updatedTask.bountyAmount as any)).toBe(parseFloat(originalBounty as any));
    });
  });
});
