import { describe, it, expect, beforeEach, afterEach, afterAll } from 'vitest';
import { pool } from '../config/database.js';
import { SchedulerService } from './SchedulerService.js';
import { TaskService } from './TaskService.js';
import { UserService } from './UserService.js';
import { DependencyService } from './DependencyService.js';
import { TaskStatus, Visibility } from '../models/Task.js';
import { UserRole } from '../models/User.js';
import { cleanupAllTestData } from '../test-utils/cleanup.js';

describe('SchedulerService', () => {
  let schedulerService: SchedulerService;
  let taskService: TaskService;
  let userService: UserService;
  let dependencyService: DependencyService;

  // Test data IDs
  let testUserId: string;
  let testPublisherId: string;
  let testPositionId: string;

  beforeEach(async () => {
    schedulerService = new SchedulerService();
    taskService = new TaskService();
    userService = new UserService();
    dependencyService = new DependencyService();

    // Create test users with unique identifiers
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    
    const publisher = await userService.createUser({
      username: `publisher_scheduler_${timestamp}_${random}`,
      email: `publisher_scheduler_${timestamp}_${random}@test.com`,
      password: 'password123',
      role: UserRole.USER,
    });
    testPublisherId = publisher.id;

    const user = await userService.createUser({
      username: `user_scheduler_${timestamp}_${random}`,
      email: `user_scheduler_${timestamp}_${random}@test.com`,
      password: 'password123',
      role: UserRole.USER,
    });
    testUserId = user.id;

    // Create test position
    const positionResult = await pool.query(
      `INSERT INTO positions (name, description) VALUES ($1, $2) RETURNING id`,
      [`Test Position Scheduler ${timestamp}`, 'Test position for scheduler']
    );
    testPositionId = positionResult.rows[0].id;

    // Assign position to user
    await pool.query(
      `INSERT INTO user_positions (user_id, position_id) VALUES ($1, $2)`,
      [testUserId, testPositionId]
    );
  });

  afterEach(async () => {
    // Clean up all test data in correct order to avoid foreign key violations
    await cleanupAllTestData();
  });



  describe('checkDependenciesResolved', () => {
    it('should return true when task has no dependencies', async () => {
      const task = await taskService.createTask({
        name: 'Independent Task',
        publisherId: testPublisherId,
      });

      const resolved = await schedulerService.checkDependenciesResolved(task.id);
      expect(resolved).toBe(true);
    });

    it('should return false when task has unresolved dependencies', async () => {
      const task1 = await taskService.createTask({
        name: 'Task 1',
        publisherId: testPublisherId,
      });

      const task2 = await taskService.createTask({
        name: 'Task 2',
        publisherId: testPublisherId,
      });

      await dependencyService.addDependency({
        taskId: task2.id,
        dependsOnTaskId: task1.id,
      });

      const resolved = await schedulerService.checkDependenciesResolved(task2.id);
      expect(resolved).toBe(false);
    });

    it('should return true when all dependencies are completed', async () => {
      const task1 = await taskService.createTask({
        name: 'Task 1',
        publisherId: testPublisherId,
      });

      const task2 = await taskService.createTask({
        name: 'Task 2',
        publisherId: testPublisherId,
      });

      await dependencyService.addDependency({
        taskId: task2.id,
        dependsOnTaskId: task1.id,
      });

      // Complete task1
      await taskService.updateTask(task1.id, {
        status: TaskStatus.COMPLETED,
      });

      const resolved = await schedulerService.checkDependenciesResolved(task2.id);
      expect(resolved).toBe(true);
    });
  });

  describe('updateTaskAvailability', () => {
    it('should update task status to AVAILABLE when dependencies are resolved', async () => {
      const task1 = await taskService.createTask({
        name: 'Task 1',
        publisherId: testPublisherId,
      });

      const task2 = await taskService.createTask({
        name: 'Task 2',
        publisherId: testPublisherId,
      });

      await dependencyService.addDependency({
        taskId: task2.id,
        dependsOnTaskId: task1.id,
      });

      // Complete task1
      await taskService.updateTask(task1.id, {
        status: TaskStatus.COMPLETED,
      });

      // Update availability
      await schedulerService.updateTaskAvailability(task2.id);

      // Check task2 status
      const updatedTask2 = await taskService.getTask(task2.id);
      expect(updatedTask2?.status).toBe(TaskStatus.AVAILABLE);
    });

    it('should not update task status if dependencies are not resolved', async () => {
      const task1 = await taskService.createTask({
        name: 'Task 1',
        publisherId: testPublisherId,
      });

      const task2 = await taskService.createTask({
        name: 'Task 2',
        publisherId: testPublisherId,
      });

      await dependencyService.addDependency({
        taskId: task2.id,
        dependsOnTaskId: task1.id,
      });

      // Update availability without completing task1
      await schedulerService.updateTaskAvailability(task2.id);

      // Check task2 status - should still be NOT_STARTED
      const updatedTask2 = await taskService.getTask(task2.id);
      expect(updatedTask2?.status).toBe(TaskStatus.NOT_STARTED);
    });
  });

  describe('processCompletedTask', () => {
    it('should return IDs of tasks that became available', async () => {
      const task1 = await taskService.createTask({
        name: 'Task 1',
        publisherId: testPublisherId,
      });

      const task2 = await taskService.createTask({
        name: 'Task 2',
        publisherId: testPublisherId,
      });

      const task3 = await taskService.createTask({
        name: 'Task 3',
        publisherId: testPublisherId,
      });

      await dependencyService.addDependency({
        taskId: task2.id,
        dependsOnTaskId: task1.id,
      });

      await dependencyService.addDependency({
        taskId: task3.id,
        dependsOnTaskId: task1.id,
      });

      // Complete task1
      await taskService.updateTask(task1.id, {
        status: TaskStatus.COMPLETED,
      });

      // Process completed task
      const resolvedIds = await schedulerService.processCompletedTask(task1.id);

      expect(resolvedIds).toHaveLength(2);
      expect(resolvedIds).toContain(task2.id);
      expect(resolvedIds).toContain(task3.id);
    });
  });

  describe('evaluateWorkload', () => {
    it('should return zero workload for user with no tasks', async () => {
      const workload = await schedulerService.evaluateWorkload(testUserId);

      expect(workload.userId).toBe(testUserId);
      expect(workload.activeTaskCount).toBe(0);
      expect(workload.totalEstimatedHours).toBe(0);
      expect(workload.isOverloaded).toBe(false);
    });

    it('should calculate workload for user with active tasks', async () => {
      // Create and assign tasks to user
      const task1 = await taskService.createTask({
        name: 'Task 1',
        publisherId: testPublisherId,
        estimatedHours: 10,
        complexity: 3,
      });

      const task2 = await taskService.createTask({
        name: 'Task 2',
        publisherId: testPublisherId,
        estimatedHours: 15,
        complexity: 4,
      });

      await taskService.updateTask(task1.id, {
        assigneeId: testUserId,
        status: TaskStatus.IN_PROGRESS,
      });

      await taskService.updateTask(task2.id, {
        assigneeId: testUserId,
        status: TaskStatus.IN_PROGRESS,
      });

      const workload = await schedulerService.evaluateWorkload(testUserId);

      expect(workload.activeTaskCount).toBe(2);
      expect(workload.totalEstimatedHours).toBe(25);
      expect(workload.averageComplexity).toBeCloseTo(3.5, 1);
    });

    it('should mark user as overloaded with 5+ tasks', async () => {
      // Create and assign 5 tasks
      for (let i = 0; i < 5; i++) {
        const task = await taskService.createTask({
          name: `Task ${i + 1}`,
          publisherId: testPublisherId,
          estimatedHours: 5,
          complexity: 2,
        });

        await taskService.updateTask(task.id, {
          assigneeId: testUserId,
          status: TaskStatus.IN_PROGRESS,
        });
      }

      const workload = await schedulerService.evaluateWorkload(testUserId);

      expect(workload.activeTaskCount).toBe(5);
      expect(workload.isOverloaded).toBe(true);
      expect(workload.recommendation).toContain('5 active tasks');
    });

    it('should mark user as overloaded with 40+ hours', async () => {
      const task = await taskService.createTask({
        name: 'Large Task',
        publisherId: testPublisherId,
        estimatedHours: 45,
        complexity: 3,
      });

      await taskService.updateTask(task.id, {
        assigneeId: testUserId,
        status: TaskStatus.IN_PROGRESS,
      });

      const workload = await schedulerService.evaluateWorkload(testUserId);

      expect(workload.totalEstimatedHours).toBe(45);
      expect(workload.isOverloaded).toBe(true);
      expect(workload.recommendation).toContain('hours of estimated work');
    });
  });

  describe('recommendTasks', () => {
    it('should return empty array for overloaded user', async () => {
      // Overload the user with 5 tasks
      for (let i = 0; i < 5; i++) {
        const task = await taskService.createTask({
          name: `Task ${i + 1}`,
          publisherId: testPublisherId,
        });

        await taskService.updateTask(task.id, {
          assigneeId: testUserId,
          status: TaskStatus.IN_PROGRESS,
        });
      }

      const recommendations = await schedulerService.recommendTasks(testUserId);
      expect(recommendations).toHaveLength(0);
    });

    it('should recommend available tasks matching user positions', async () => {
      // Create available task with position requirement
      const task = await taskService.createTask({
        name: 'Position Task',
        publisherId: testPublisherId,
        positionId: testPositionId,
      });

      await taskService.updateTask(task.id, {
        status: TaskStatus.AVAILABLE,
      });

      const recommendations = await schedulerService.recommendTasks(testUserId);

      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0].id).toBe(task.id);
    });

    it('should recommend tasks without position requirement', async () => {
      const task = await taskService.createTask({
        name: 'Public Task',
        publisherId: testPublisherId,
        visibility: Visibility.PUBLIC,
      });

      await taskService.updateTask(task.id, {
        status: TaskStatus.AVAILABLE,
      });

      const recommendations = await schedulerService.recommendTasks(testUserId);

      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0].id).toBe(task.id);
    });

    it('should prioritize older tasks', async () => {
      // Create two tasks with delay
      const task1 = await taskService.createTask({
        name: 'Older Task',
        publisherId: testPublisherId,
      });

      await taskService.updateTask(task1.id, {
        status: TaskStatus.AVAILABLE,
      });

      // Small delay to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 100));

      const task2 = await taskService.createTask({
        name: 'Newer Task',
        publisherId: testPublisherId,
      });

      await taskService.updateTask(task2.id, {
        status: TaskStatus.AVAILABLE,
      });

      const recommendations = await schedulerService.recommendTasks(testUserId);

      expect(recommendations.length).toBeGreaterThan(0);
      // Older task should be recommended first
      expect(recommendations[0].id).toBe(task1.id);
    });
  });

  describe('reprioritizeTasks', () => {
    it('should boost priority for tasks with deadline within 24 hours', async () => {
      const tomorrow = new Date();
      tomorrow.setHours(tomorrow.getHours() + 12);

      const task = await taskService.createTask({
        name: 'Urgent Task',
        publisherId: testPublisherId,
        priority: 2,
        plannedEndDate: tomorrow,
      });

      await taskService.updateTask(task.id, {
        status: TaskStatus.AVAILABLE,
      });

      await schedulerService.reprioritizeTasks();

      const updatedTask = await taskService.getTask(task.id);
      expect(updatedTask?.priority).toBe(4); // 2 + 2 boost
    });

    it('should boost priority for tasks with deadline within 3 days', async () => {
      const twoDaysLater = new Date();
      twoDaysLater.setDate(twoDaysLater.getDate() + 2);

      const task = await taskService.createTask({
        name: 'Soon Task',
        publisherId: testPublisherId,
        priority: 2,
        plannedEndDate: twoDaysLater,
      });

      await taskService.updateTask(task.id, {
        status: TaskStatus.AVAILABLE,
      });

      await schedulerService.reprioritizeTasks();

      const updatedTask = await taskService.getTask(task.id);
      expect(updatedTask?.priority).toBe(3); // 2 + 1 boost
    });

    it('should not exceed maximum priority of 5', async () => {
      const tomorrow = new Date();
      tomorrow.setHours(tomorrow.getHours() + 12);

      const task = await taskService.createTask({
        name: 'Max Priority Task',
        publisherId: testPublisherId,
        priority: 5,
        plannedEndDate: tomorrow,
      });

      await taskService.updateTask(task.id, {
        status: TaskStatus.AVAILABLE,
      });

      await schedulerService.reprioritizeTasks();

      const updatedTask = await taskService.getTask(task.id);
      expect(updatedTask?.priority).toBe(5); // Should not exceed 5
    });
  });
});
