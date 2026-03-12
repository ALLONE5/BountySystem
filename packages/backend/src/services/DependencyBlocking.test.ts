import { describe, it, expect, beforeEach, afterEach, afterAll } from 'vitest';
import { pool } from '../config/database.js';
import { DependencyService } from './DependencyService.js';
import { TaskService } from './TaskService.js';
import { UserService } from './UserService.js';
import { TaskStatus } from '../models/Task.js';
import { cleanupAllTestData } from '../test-utils/cleanup.js';
import { createTestDependencies } from '../test-utils/test-setup.js';

describe('Dependency Blocking and Resolution Logic', () => {
  let dependencyService: DependencyService;
  let taskService: TaskService;
  let userService: UserService;
  let testUserId: string;

  beforeEach(async () => {
    const { taskRepository, userRepository, groupRepository, positionRepository, permissionChecker } = createTestDependencies();
    dependencyService = new DependencyService();
    taskService = new TaskService(taskRepository, positionRepository, permissionChecker);
    userService = new UserService(userRepository, permissionChecker);

    // Create a test user
    const user = await userService.createUser({
      username: `testuser_${Date.now()}`,
      email: `test_${Date.now()}@example.com`,
      password: 'password123',
    });
    testUserId = user.id;
  });

  afterEach(async () => {
    // Clean up all test data in correct order to avoid foreign key violations
    await cleanupAllTestData();
  });



  describe('Blocking task assignment with unresolved dependencies', () => {
    it('should prevent assigning task with unresolved dependencies', async () => {
      // Create two tasks
      const task1 = await taskService.createTask({
        name: 'Task 1',
        publisherId: testUserId,
      });

      const task2 = await taskService.createTask({
        name: 'Task 2',
        publisherId: testUserId,
      });

      // Create dependency: Task2 depends on Task1
      await dependencyService.addDependency({
        taskId: task2.id,
        dependsOnTaskId: task1.id,
      });

      // Try to assign Task2 - should fail because Task1 is not completed
      await expect(taskService.assignTask(task2.id, testUserId)).rejects.toThrow(
        'Cannot assign task: unresolved dependencies exist'
      );
    });

    it('should allow assigning task when all dependencies are completed', async () => {
      // Create two tasks
      const task1 = await taskService.createTask({
        name: 'Task 1',
        publisherId: testUserId,
      });

      const task2 = await taskService.createTask({
        name: 'Task 2',
        publisherId: testUserId,
      });

      // Create dependency: Task2 depends on Task1
      await dependencyService.addDependency({
        taskId: task2.id,
        dependsOnTaskId: task1.id,
      });

      // Complete Task1
      await taskService.updateTask(task1.id, {
        status: TaskStatus.COMPLETED,
      });

      // Now Task2 should be assignable
      const assignedTask = await taskService.assignTask(task2.id, testUserId);
      expect(assignedTask.assigneeId).toBe(testUserId);
      expect(assignedTask.status).toBe(TaskStatus.AVAILABLE);
    });

    it('should prevent assignment when some dependencies are unresolved', async () => {
      // Create three tasks
      const task1 = await taskService.createTask({
        name: 'Task 1',
        publisherId: testUserId,
      });

      const task2 = await taskService.createTask({
        name: 'Task 2',
        publisherId: testUserId,
      });

      const task3 = await taskService.createTask({
        name: 'Task 3',
        publisherId: testUserId,
      });

      // Task3 depends on both Task1 and Task2
      await dependencyService.addDependency({
        taskId: task3.id,
        dependsOnTaskId: task1.id,
      });

      await dependencyService.addDependency({
        taskId: task3.id,
        dependsOnTaskId: task2.id,
      });

      // Complete only Task1
      await taskService.updateTask(task1.id, {
        status: TaskStatus.COMPLETED,
      });

      // Task3 should still not be assignable
      await expect(taskService.assignTask(task3.id, testUserId)).rejects.toThrow(
        'Cannot assign task: unresolved dependencies exist'
      );
    });

    it('should allow assignment when all multiple dependencies are completed', async () => {
      // Create three tasks
      const task1 = await taskService.createTask({
        name: 'Task 1',
        publisherId: testUserId,
      });

      const task2 = await taskService.createTask({
        name: 'Task 2',
        publisherId: testUserId,
      });

      const task3 = await taskService.createTask({
        name: 'Task 3',
        publisherId: testUserId,
      });

      // Task3 depends on both Task1 and Task2
      await dependencyService.addDependency({
        taskId: task3.id,
        dependsOnTaskId: task1.id,
      });

      await dependencyService.addDependency({
        taskId: task3.id,
        dependsOnTaskId: task2.id,
      });

      // Complete both dependencies
      await taskService.updateTask(task1.id, {
        status: TaskStatus.COMPLETED,
      });

      await taskService.updateTask(task2.id, {
        status: TaskStatus.COMPLETED,
      });

      // Now Task3 should be assignable
      const assignedTask = await taskService.assignTask(task3.id, testUserId);
      expect(assignedTask.assigneeId).toBe(testUserId);
    });
  });

  describe('Automatic dependency resolution on task completion', () => {
    it('should automatically update dependent task status when dependency is completed', async () => {
      // Create two tasks
      const task1 = await taskService.createTask({
        name: 'Task 1',
        publisherId: testUserId,
      });

      const task2 = await taskService.createTask({
        name: 'Task 2',
        publisherId: testUserId,
      });

      // Task2 depends on Task1
      await dependencyService.addDependency({
        taskId: task2.id,
        dependsOnTaskId: task1.id,
      });

      // Verify Task2 is NOT_STARTED
      let task2Status = await taskService.getTask(task2.id);
      expect(task2Status?.status).toBe(TaskStatus.NOT_STARTED);

      // Complete Task1 and resolve dependencies
      const resolvedTasks = await taskService.completeTask(task1.id, testUserId);

      // Task2 should be in the resolved list
      expect(resolvedTasks).toContain(task2.id);

      // Verify Task2 is now AVAILABLE
      task2Status = await taskService.getTask(task2.id);
      expect(task2Status?.status).toBe(TaskStatus.AVAILABLE);
    });

    it('should resolve multiple dependent tasks when dependency is completed', async () => {
      // Create three tasks
      const task1 = await taskService.createTask({
        name: 'Task 1',
        publisherId: testUserId,
      });

      const task2 = await taskService.createTask({
        name: 'Task 2',
        publisherId: testUserId,
      });

      const task3 = await taskService.createTask({
        name: 'Task 3',
        publisherId: testUserId,
      });

      // Both Task2 and Task3 depend on Task1
      await dependencyService.addDependency({
        taskId: task2.id,
        dependsOnTaskId: task1.id,
      });

      await dependencyService.addDependency({
        taskId: task3.id,
        dependsOnTaskId: task1.id,
      });

      // Complete Task1
      const resolvedTasks = await taskService.completeTask(task1.id, testUserId);

      // Both Task2 and Task3 should be resolved
      expect(resolvedTasks).toHaveLength(2);
      expect(resolvedTasks).toContain(task2.id);
      expect(resolvedTasks).toContain(task3.id);

      // Verify both are AVAILABLE
      const task2Status = await taskService.getTask(task2.id);
      const task3Status = await taskService.getTask(task3.id);
      expect(task2Status?.status).toBe(TaskStatus.AVAILABLE);
      expect(task3Status?.status).toBe(TaskStatus.AVAILABLE);
    });

    it('should not resolve task with multiple dependencies until all are completed', async () => {
      // Create three tasks
      const task1 = await taskService.createTask({
        name: 'Task 1',
        publisherId: testUserId,
      });

      const task2 = await taskService.createTask({
        name: 'Task 2',
        publisherId: testUserId,
      });

      const task3 = await taskService.createTask({
        name: 'Task 3',
        publisherId: testUserId,
      });

      // Task3 depends on both Task1 and Task2
      await dependencyService.addDependency({
        taskId: task3.id,
        dependsOnTaskId: task1.id,
      });

      await dependencyService.addDependency({
        taskId: task3.id,
        dependsOnTaskId: task2.id,
      });

      // Complete only Task1
      const resolvedTasks1 = await taskService.completeTask(task1.id, testUserId);

      // Task3 should NOT be resolved yet
      expect(resolvedTasks1).not.toContain(task3.id);

      let task3Status = await taskService.getTask(task3.id);
      expect(task3Status?.status).toBe(TaskStatus.NOT_STARTED);

      // Complete Task2
      const resolvedTasks2 = await taskService.completeTask(task2.id, testUserId);

      // Now Task3 should be resolved
      expect(resolvedTasks2).toContain(task3.id);

      task3Status = await taskService.getTask(task3.id);
      expect(task3Status?.status).toBe(TaskStatus.AVAILABLE);
    });

    it('should handle dependency chain resolution (A->B->C)', async () => {
      // Create three tasks in a chain
      const taskA = await taskService.createTask({
        name: 'Task A',
        publisherId: testUserId,
      });

      const taskB = await taskService.createTask({
        name: 'Task B',
        publisherId: testUserId,
      });

      const taskC = await taskService.createTask({
        name: 'Task C',
        publisherId: testUserId,
      });

      // Create chain: A -> B -> C
      await dependencyService.addDependency({
        taskId: taskB.id,
        dependsOnTaskId: taskA.id,
      });

      await dependencyService.addDependency({
        taskId: taskC.id,
        dependsOnTaskId: taskB.id,
      });

      // Complete Task A
      const resolvedAfterA = await taskService.completeTask(taskA.id, testUserId);

      // Only Task B should be resolved
      expect(resolvedAfterA).toContain(taskB.id);
      expect(resolvedAfterA).not.toContain(taskC.id);

      let taskBStatus = await taskService.getTask(taskB.id);
      let taskCStatus = await taskService.getTask(taskC.id);
      expect(taskBStatus?.status).toBe(TaskStatus.AVAILABLE);
      expect(taskCStatus?.status).toBe(TaskStatus.NOT_STARTED);

      // Complete Task B
      const resolvedAfterB = await taskService.completeTask(taskB.id, testUserId);

      // Now Task C should be resolved
      expect(resolvedAfterB).toContain(taskC.id);

      taskCStatus = await taskService.getTask(taskC.id);
      expect(taskCStatus?.status).toBe(TaskStatus.AVAILABLE);
    });

    it('should not change status of tasks already in progress', async () => {
      // Create two tasks
      const task1 = await taskService.createTask({
        name: 'Task 1',
        publisherId: testUserId,
      });

      const task2 = await taskService.createTask({
        name: 'Task 2',
        publisherId: testUserId,
      });

      // Task2 depends on Task1
      await dependencyService.addDependency({
        taskId: task2.id,
        dependsOnTaskId: task1.id,
      });

      // Manually set Task2 to IN_PROGRESS (simulating it was started before dependency was added)
      await taskService.updateTask(task2.id, {
        status: TaskStatus.IN_PROGRESS,
      });

      // Complete Task1
      await taskService.completeTask(task1.id, testUserId);

      // Task2 should still be IN_PROGRESS, not changed to AVAILABLE
      const task2Status = await taskService.getTask(task2.id);
      expect(task2Status?.status).toBe(TaskStatus.IN_PROGRESS);
    });
  });

  describe('Check dependency status', () => {
    it('should correctly identify when dependencies are resolved', async () => {
      const task1 = await taskService.createTask({
        name: 'Task 1',
        publisherId: testUserId,
      });

      const task2 = await taskService.createTask({
        name: 'Task 2',
        publisherId: testUserId,
      });

      await dependencyService.addDependency({
        taskId: task2.id,
        dependsOnTaskId: task1.id,
      });

      // Initially not resolved
      let resolved = await taskService.areDependenciesResolved(task2.id);
      expect(resolved).toBe(false);

      // Complete dependency
      await taskService.updateTask(task1.id, {
        status: TaskStatus.COMPLETED,
      });

      // Now resolved
      resolved = await taskService.areDependenciesResolved(task2.id);
      expect(resolved).toBe(true);
    });

    it('should return true for tasks with no dependencies', async () => {
      const task = await taskService.createTask({
        name: 'Independent Task',
        publisherId: testUserId,
      });

      const resolved = await taskService.areDependenciesResolved(task.id);
      expect(resolved).toBe(true);
    });
  });
});
