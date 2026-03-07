import { describe, it, expect, beforeEach, afterEach, afterAll } from 'vitest';
import { pool } from '../config/database.js';
import { DependencyService } from './DependencyService.js';
import { TaskService } from './TaskService.js';
import { UserService } from './UserService.js';
import { TaskStatus } from '../models/Task.js';

describe('DependencyService', () => {
  let dependencyService: DependencyService;
  let taskService: TaskService;
  let userService: UserService;
  let testUserId: string;
  let testTask1Id: string;
  let testTask2Id: string;
  let testTask3Id: string;

  beforeEach(async () => {
    dependencyService = new DependencyService();
    taskService = new TaskService();
    userService = new UserService(userRepository, permissionChecker);

    // Create a test user
    const user = await userService.createUser({
      username: `testuser_${Date.now()}`,
      email: `test_${Date.now()}@example.com`,
      password: 'password123',
    });
    testUserId = user.id;

    // Create test tasks
    const task1 = await taskService.createTask({
      name: 'Task 1',
      description: 'First task',
      publisherId: testUserId,
    });
    testTask1Id = task1.id;

    const task2 = await taskService.createTask({
      name: 'Task 2',
      description: 'Second task',
      publisherId: testUserId,
    });
    testTask2Id = task2.id;

    const task3 = await taskService.createTask({
      name: 'Task 3',
      description: 'Third task',
      publisherId: testUserId,
    });
    testTask3Id = task3.id;
  });

  afterEach(async () => {
    // Clean up test data
    await pool.query('DELETE FROM task_dependencies WHERE task_id = $1 OR depends_on_task_id = $1', [testTask1Id]);
    await pool.query('DELETE FROM task_dependencies WHERE task_id = $1 OR depends_on_task_id = $1', [testTask2Id]);
    await pool.query('DELETE FROM task_dependencies WHERE task_id = $1 OR depends_on_task_id = $1', [testTask3Id]);
    await pool.query('DELETE FROM tasks WHERE id = $1', [testTask1Id]);
    await pool.query('DELETE FROM tasks WHERE id = $1', [testTask2Id]);
    await pool.query('DELETE FROM tasks WHERE id = $1', [testTask3Id]);
    await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
  });



  describe('addDependency', () => {
    it('should add a dependency between two tasks', async () => {
      const dependency = await dependencyService.addDependency({
        taskId: testTask2Id,
        dependsOnTaskId: testTask1Id,
      });

      expect(dependency).toBeDefined();
      expect(dependency.taskId).toBe(testTask2Id);
      expect(dependency.dependsOnTaskId).toBe(testTask1Id);
    });

    it('should prevent task from depending on itself', async () => {
      await expect(
        dependencyService.addDependency({
          taskId: testTask1Id,
          dependsOnTaskId: testTask1Id,
        })
      ).rejects.toThrow('Task cannot depend on itself');
    });

    it('should prevent circular dependencies (A->B->A)', async () => {
      // Create A -> B
      await dependencyService.addDependency({
        taskId: testTask2Id,
        dependsOnTaskId: testTask1Id,
      });

      // Try to create B -> A (circular)
      await expect(
        dependencyService.addDependency({
          taskId: testTask1Id,
          dependsOnTaskId: testTask2Id,
        })
      ).rejects.toThrow('circular dependency');
    });

    it('should prevent circular dependencies (A->B->C->A)', async () => {
      // Create A -> B
      await dependencyService.addDependency({
        taskId: testTask2Id,
        dependsOnTaskId: testTask1Id,
      });

      // Create B -> C
      await dependencyService.addDependency({
        taskId: testTask3Id,
        dependsOnTaskId: testTask2Id,
      });

      // Try to create C -> A (circular)
      await expect(
        dependencyService.addDependency({
          taskId: testTask1Id,
          dependsOnTaskId: testTask3Id,
        })
      ).rejects.toThrow('circular dependency');
    });

    it('should throw error if task does not exist', async () => {
      await expect(
        dependencyService.addDependency({
          taskId: '00000000-0000-0000-0000-000000000000',
          dependsOnTaskId: testTask1Id,
        })
      ).rejects.toThrow('Task not found');
    });

    it('should throw error if dependency task does not exist', async () => {
      await expect(
        dependencyService.addDependency({
          taskId: testTask1Id,
          dependsOnTaskId: '00000000-0000-0000-0000-000000000000',
        })
      ).rejects.toThrow('Dependency task not found');
    });

    it('should prevent duplicate dependencies', async () => {
      await dependencyService.addDependency({
        taskId: testTask2Id,
        dependsOnTaskId: testTask1Id,
      });

      await expect(
        dependencyService.addDependency({
          taskId: testTask2Id,
          dependsOnTaskId: testTask1Id,
        })
      ).rejects.toThrow('Dependency already exists');
    });
  });

  describe('removeDependency', () => {
    it('should remove a dependency', async () => {
      await dependencyService.addDependency({
        taskId: testTask2Id,
        dependsOnTaskId: testTask1Id,
      });

      await dependencyService.removeDependency(testTask2Id, testTask1Id);

      const dependencies = await dependencyService.getTaskDependencies(testTask2Id);
      expect(dependencies).toHaveLength(0);
    });

    it('should throw error if dependency does not exist', async () => {
      await expect(
        dependencyService.removeDependency(testTask2Id, testTask1Id)
      ).rejects.toThrow('Dependency not found');
    });
  });

  describe('getTaskDependencies', () => {
    it('should return all dependencies for a task', async () => {
      await dependencyService.addDependency({
        taskId: testTask3Id,
        dependsOnTaskId: testTask1Id,
      });

      await dependencyService.addDependency({
        taskId: testTask3Id,
        dependsOnTaskId: testTask2Id,
      });

      const dependencies = await dependencyService.getTaskDependencies(testTask3Id);
      expect(dependencies).toHaveLength(2);
      expect(dependencies.map((d) => d.dependsOnTaskId)).toContain(testTask1Id);
      expect(dependencies.map((d) => d.dependsOnTaskId)).toContain(testTask2Id);
    });

    it('should return empty array if task has no dependencies', async () => {
      const dependencies = await dependencyService.getTaskDependencies(testTask1Id);
      expect(dependencies).toHaveLength(0);
    });
  });

  describe('getDependentTasks', () => {
    it('should return all tasks that depend on a given task', async () => {
      await dependencyService.addDependency({
        taskId: testTask2Id,
        dependsOnTaskId: testTask1Id,
      });

      await dependencyService.addDependency({
        taskId: testTask3Id,
        dependsOnTaskId: testTask1Id,
      });

      const dependentTasks = await dependencyService.getDependentTasks(testTask1Id);
      expect(dependentTasks).toHaveLength(2);
      expect(dependentTasks.map((d) => d.taskId)).toContain(testTask2Id);
      expect(dependentTasks.map((d) => d.taskId)).toContain(testTask3Id);
    });
  });

  describe('areDependenciesResolved', () => {
    it('should return true if task has no dependencies', async () => {
      const resolved = await dependencyService.areDependenciesResolved(testTask1Id);
      expect(resolved).toBe(true);
    });

    it('should return false if task has unresolved dependencies', async () => {
      await dependencyService.addDependency({
        taskId: testTask2Id,
        dependsOnTaskId: testTask1Id,
      });

      const resolved = await dependencyService.areDependenciesResolved(testTask2Id);
      expect(resolved).toBe(false);
    });

    it('should return true if all dependencies are completed', async () => {
      await dependencyService.addDependency({
        taskId: testTask2Id,
        dependsOnTaskId: testTask1Id,
      });

      // Complete the dependency task
      await taskService.updateTask(testTask1Id, { status: TaskStatus.COMPLETED });

      const resolved = await dependencyService.areDependenciesResolved(testTask2Id);
      expect(resolved).toBe(true);
    });

    it('should return false if some dependencies are not completed', async () => {
      await dependencyService.addDependency({
        taskId: testTask3Id,
        dependsOnTaskId: testTask1Id,
      });

      await dependencyService.addDependency({
        taskId: testTask3Id,
        dependsOnTaskId: testTask2Id,
      });

      // Complete only one dependency
      await taskService.updateTask(testTask1Id, { status: TaskStatus.COMPLETED });

      const resolved = await dependencyService.areDependenciesResolved(testTask3Id);
      expect(resolved).toBe(false);
    });
  });

  describe('getUnresolvedDependencies', () => {
    it('should return list of unresolved dependency task IDs', async () => {
      await dependencyService.addDependency({
        taskId: testTask3Id,
        dependsOnTaskId: testTask1Id,
      });

      await dependencyService.addDependency({
        taskId: testTask3Id,
        dependsOnTaskId: testTask2Id,
      });

      const unresolved = await dependencyService.getUnresolvedDependencies(testTask3Id);
      expect(unresolved).toHaveLength(2);
      expect(unresolved).toContain(testTask1Id);
      expect(unresolved).toContain(testTask2Id);
    });

    it('should return empty array if all dependencies are resolved', async () => {
      await dependencyService.addDependency({
        taskId: testTask2Id,
        dependsOnTaskId: testTask1Id,
      });

      await taskService.updateTask(testTask1Id, { status: TaskStatus.COMPLETED });

      const unresolved = await dependencyService.getUnresolvedDependencies(testTask2Id);
      expect(unresolved).toHaveLength(0);
    });
  });

  describe('wouldCreateCircularDependency', () => {
    it('should return false for valid dependency', async () => {
      const wouldCreate = await dependencyService.wouldCreateCircularDependency(testTask2Id, testTask1Id);
      expect(wouldCreate).toBe(false);
    });

    it('should return true for direct circular dependency', async () => {
      await dependencyService.addDependency({
        taskId: testTask2Id,
        dependsOnTaskId: testTask1Id,
      });

      const wouldCreate = await dependencyService.wouldCreateCircularDependency(testTask1Id, testTask2Id);
      expect(wouldCreate).toBe(true);
    });

    it('should return true for indirect circular dependency', async () => {
      await dependencyService.addDependency({
        taskId: testTask2Id,
        dependsOnTaskId: testTask1Id,
      });

      await dependencyService.addDependency({
        taskId: testTask3Id,
        dependsOnTaskId: testTask2Id,
      });

      const wouldCreate = await dependencyService.wouldCreateCircularDependency(testTask1Id, testTask3Id);
      expect(wouldCreate).toBe(true);
    });
  });

  describe('updateTaskAvailability', () => {
    it('should update task status to AVAILABLE when dependencies are resolved', async () => {
      await dependencyService.addDependency({
        taskId: testTask2Id,
        dependsOnTaskId: testTask1Id,
      });

      // Complete the dependency
      await taskService.updateTask(testTask1Id, { status: TaskStatus.COMPLETED });

      // Update availability
      await dependencyService.updateTaskAvailability(testTask2Id);

      // Check task status
      const task = await taskService.getTask(testTask2Id);
      expect(task?.status).toBe(TaskStatus.AVAILABLE);
    });

    it('should not update task status if dependencies are not resolved', async () => {
      await dependencyService.addDependency({
        taskId: testTask2Id,
        dependsOnTaskId: testTask1Id,
      });

      // Don't complete the dependency
      await dependencyService.updateTaskAvailability(testTask2Id);

      // Check task status - should still be AVAILABLE (default status)
      const task = await taskService.getTask(testTask2Id);
      expect(task?.status).toBe(TaskStatus.AVAILABLE);
    });

    it('should not update task status if task is already in progress', async () => {
      await dependencyService.addDependency({
        taskId: testTask2Id,
        dependsOnTaskId: testTask1Id,
      });

      // Set task to IN_PROGRESS
      await taskService.updateTask(testTask2Id, { status: TaskStatus.IN_PROGRESS });

      // Complete the dependency
      await taskService.updateTask(testTask1Id, { status: TaskStatus.COMPLETED });

      // Update availability
      await dependencyService.updateTaskAvailability(testTask2Id);

      // Check task status - should still be IN_PROGRESS
      const task = await taskService.getTask(testTask2Id);
      expect(task?.status).toBe(TaskStatus.IN_PROGRESS);
    });
  });

  describe('resolveDownstreamDependencies', () => {
    it('should resolve all downstream dependencies when task is completed', async () => {
      // Create dependency chain: Task1 -> Task2, Task1 -> Task3
      await dependencyService.addDependency({
        taskId: testTask2Id,
        dependsOnTaskId: testTask1Id,
      });

      await dependencyService.addDependency({
        taskId: testTask3Id,
        dependsOnTaskId: testTask1Id,
      });

      // Complete Task1 first
      await taskService.updateTask(testTask1Id, { status: TaskStatus.COMPLETED });

      // Then resolve downstream dependencies
      const resolvedTaskIds = await dependencyService.resolveDownstreamDependencies(testTask1Id);

      // Both Task2 and Task3 should be resolved
      expect(resolvedTaskIds).toHaveLength(2);
      expect(resolvedTaskIds).toContain(testTask2Id);
      expect(resolvedTaskIds).toContain(testTask3Id);

      // Check that both tasks are now AVAILABLE
      const task2 = await taskService.getTask(testTask2Id);
      const task3 = await taskService.getTask(testTask3Id);
      expect(task2?.status).toBe(TaskStatus.AVAILABLE);
      expect(task3?.status).toBe(TaskStatus.AVAILABLE);
    });

    it('should not resolve tasks that have other unresolved dependencies', async () => {
      // Create: Task1 -> Task3, Task2 -> Task3
      await dependencyService.addDependency({
        taskId: testTask3Id,
        dependsOnTaskId: testTask1Id,
      });

      await dependencyService.addDependency({
        taskId: testTask3Id,
        dependsOnTaskId: testTask2Id,
      });

      // Complete only Task1
      const resolvedTaskIds = await dependencyService.resolveDownstreamDependencies(testTask1Id);

      // Task3 should not be resolved yet
      expect(resolvedTaskIds).toHaveLength(0);

      // Task3 should still be AVAILABLE (default status)
      const task3 = await taskService.getTask(testTask3Id);
      expect(task3?.status).toBe(TaskStatus.AVAILABLE);
    });
  });
});
