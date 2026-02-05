import { describe, it, expect, beforeEach, afterEach, afterAll } from 'vitest';
import { TaskService } from './TaskService.js';
import { UserService } from './UserService.js';
import { pool } from '../config/database.js';
import { TaskStatus, Visibility } from '../models/Task.js';
import { UserRole } from '../models/User.js';

describe('TaskService', () => {
  let taskService: TaskService;
  let userService: UserService;
  let testUserId: string;

  beforeEach(async () => {
    taskService = new TaskService();
    userService = new UserService();

    // Create a test user
    const user = await userService.createUser({
      username: `testuser_${Date.now()}`,
      email: `test_${Date.now()}@example.com`,
      password: 'password123',
      role: UserRole.USER,
    });
    testUserId = user.id;
  });

  afterEach(async () => {
    // Clean up test data
    await pool.query('DELETE FROM tasks WHERE publisher_id = $1', [testUserId]);
    await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
  });

  describe('createTask', () => {
    it('should create an independent task at depth 0', async () => {
      const task = await taskService.createTask({
        name: 'Test Task',
        description: 'Test Description',
        publisherId: testUserId,
      });

      expect(task).toBeDefined();
      expect(task.name).toBe('Test Task');
      expect(task.description).toBe('Test Description');
      expect(task.depth).toBe(0);
      expect(task.isExecutable).toBe(true);
      expect(task.parentId).toBeNull();
      expect(task.publisherId).toBe(testUserId);
      expect(task.status).toBe(TaskStatus.AVAILABLE);
    });

    it('should create a task with all optional attributes', async () => {
      const plannedStart = new Date('2024-01-01');
      const plannedEnd = new Date('2024-01-31');

      const task = await taskService.createTask({
        name: 'Complex Task',
        description: 'Detailed task',
        publisherId: testUserId,
        tags: ['urgent', 'backend'],
        plannedStartDate: plannedStart,
        plannedEndDate: plannedEnd,
        estimatedHours: 40,
        complexity: 4,
        priority: 5,
        visibility: Visibility.PRIVATE,
      });

      expect(task.tags).toEqual(['urgent', 'backend']);
      expect(parseFloat(task.estimatedHours as any)).toBe(40);
      expect(task.complexity).toBe(4);
      expect(task.priority).toBe(5);
      expect(task.visibility).toBe(Visibility.PRIVATE);
    });

    it('should create a subtask at depth 1', async () => {
      const parentTask = await taskService.createTask({
        name: 'Parent Task',
        publisherId: testUserId,
      });

      const subtask = await taskService.createTask({
        name: 'Subtask',
        publisherId: testUserId,
        parentId: parentTask.id,
      });

      expect(subtask.depth).toBe(1);
      expect(subtask.parentId).toBe(parentTask.id);
      expect(subtask.isExecutable).toBe(true);

      // Verify parent is no longer executable
      const updatedParent = await taskService.getTask(parentTask.id);
      expect(updatedParent?.isExecutable).toBe(false);
    });

    it('should reject creating a subtask at depth 2', async () => {
      const parentTask = await taskService.createTask({
        name: 'Parent Task',
        publisherId: testUserId,
      });

      const childTask = await taskService.createTask({
        name: 'Child Task',
        publisherId: testUserId,
        parentId: parentTask.id,
      });

      // Attempt to create grandchild (depth 2) should fail
      await expect(
        taskService.createTask({
          name: 'Grandchild Task',
          publisherId: testUserId,
          parentId: childTask.id,
        })
      ).rejects.toThrow('Task hierarchy cannot exceed 2 levels');
    });

    it('should reject creating a task at depth 2 or deeper', async () => {
      const parentTask = await taskService.createTask({
        name: 'Parent Task',
        publisherId: testUserId,
      });

      const childTask = await taskService.createTask({
        name: 'Child Task',
        publisherId: testUserId,
        parentId: parentTask.id,
      });

      // Attempt to create grandchild (depth 2) should fail
      await expect(
        taskService.createTask({
          name: 'Grandchild Task',
          publisherId: testUserId,
          parentId: childTask.id,
        })
      ).rejects.toThrow('Task hierarchy cannot exceed 2 levels');
    });

    it('should reject creating subtask with non-existent parent', async () => {
      await expect(
        taskService.createTask({
          name: 'Orphan Task',
          publisherId: testUserId,
          parentId: '00000000-0000-0000-0000-000000000000',
        })
      ).rejects.toThrow('Parent task not found');
    });
  });

  describe('updateTask', () => {
    it('should update task attributes', async () => {
      const task = await taskService.createTask({
        name: 'Original Name',
        publisherId: testUserId,
      });

      const updated = await taskService.updateTask(task.id, {
        name: 'Updated Name',
        description: 'New Description',
        complexity: 3,
      });

      expect(updated.name).toBe('Updated Name');
      expect(updated.description).toBe('New Description');
      expect(updated.complexity).toBe(3);
    });

    it('should record actual start time when status changes to IN_PROGRESS', async () => {
      const task = await taskService.createTask({
        name: 'Test Task',
        publisherId: testUserId,
      });

      expect(task.actualStartDate).toBeNull();

      const updated = await taskService.updateTask(task.id, {
        status: TaskStatus.IN_PROGRESS,
      });

      expect(updated.actualStartDate).not.toBeNull();
      expect(updated.actualStartDate).toBeInstanceOf(Date);
    });

    it('should record actual end time when status changes to COMPLETED', async () => {
      const task = await taskService.createTask({
        name: 'Test Task',
        publisherId: testUserId,
      });

      // First set to in progress
      await taskService.updateTask(task.id, {
        status: TaskStatus.IN_PROGRESS,
      });

      // Then complete
      const completed = await taskService.updateTask(task.id, {
        status: TaskStatus.COMPLETED,
      });

      expect(completed.actualEndDate).not.toBeNull();
      expect(completed.actualEndDate).toBeInstanceOf(Date);
    });

    it('should update parent stats when subtask attributes change', async () => {
      const parentTask = await taskService.createTask({
        name: 'Parent Task',
        publisherId: testUserId,
      });

      const subtask1 = await taskService.createTask({
        name: 'Subtask 1',
        publisherId: testUserId,
        parentId: parentTask.id,
        estimatedHours: 10,
        complexity: 3,
      });

      const subtask2 = await taskService.createTask({
        name: 'Subtask 2',
        publisherId: testUserId,
        parentId: parentTask.id,
        estimatedHours: 20,
        complexity: 5,
      });

      // Check parent stats
      let parent = await taskService.getTask(parentTask.id);
      expect(parseFloat(parent?.aggregatedEstimatedHours as any)).toBe(30);
      expect(parseFloat(parent?.aggregatedComplexity as any)).toBe(4); // Average of 3 and 5

      // Update subtask
      await taskService.updateTask(subtask1.id, {
        estimatedHours: 15,
      });

      // Check updated parent stats
      parent = await taskService.getTask(parentTask.id);
      expect(parseFloat(parent?.aggregatedEstimatedHours as any)).toBe(35); // 15 + 20
    });
  });

  describe('aggregateParentTaskStats', () => {
    it('should calculate correct statistics for parent task', async () => {
      const parentTask = await taskService.createTask({
        name: 'Parent Task',
        publisherId: testUserId,
      });

      await taskService.createTask({
        name: 'Subtask 1',
        publisherId: testUserId,
        parentId: parentTask.id,
        estimatedHours: 10,
        complexity: 2,
      });

      await taskService.createTask({
        name: 'Subtask 2',
        publisherId: testUserId,
        parentId: parentTask.id,
        estimatedHours: 20,
        complexity: 4,
      });

      const subtask3 = await taskService.createTask({
        name: 'Subtask 3',
        publisherId: testUserId,
        parentId: parentTask.id,
        estimatedHours: 30,
        complexity: 3,
      });

      // Complete one subtask
      await taskService.updateTask(subtask3.id, {
        status: TaskStatus.COMPLETED,
      });

      const stats = await taskService.aggregateParentTaskStats(parentTask.id);

      expect(stats.totalEstimatedHours).toBe(60);
      expect(stats.averageComplexity).toBe(3); // (2 + 4 + 3) / 3
      expect(stats.totalSubtasks).toBe(3);
      expect(stats.completedSubtasks).toBe(1);
    });

    it('should handle parent with no subtasks', async () => {
      const parentTask = await taskService.createTask({
        name: 'Parent Task',
        publisherId: testUserId,
      });

      const stats = await taskService.aggregateParentTaskStats(parentTask.id);

      expect(stats.totalEstimatedHours).toBe(0);
      expect(stats.averageComplexity).toBe(0);
      expect(stats.totalSubtasks).toBe(0);
      expect(stats.completedSubtasks).toBe(0);
    });
  });

  describe('getTask', () => {
    it('should retrieve task by ID', async () => {
      const created = await taskService.createTask({
        name: 'Test Task',
        publisherId: testUserId,
      });

      const retrieved = await taskService.getTask(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.name).toBe('Test Task');
    });

    it('should return null for non-existent task', async () => {
      const task = await taskService.getTask('00000000-0000-0000-0000-000000000000');
      expect(task).toBeNull();
    });
  });

  describe('getTasksByUser', () => {
    it('should retrieve tasks published by user', async () => {
      await taskService.createTask({
        name: 'Task 1',
        publisherId: testUserId,
      });

      await taskService.createTask({
        name: 'Task 2',
        publisherId: testUserId,
      });

      const tasks = await taskService.getTasksByUser(testUserId, 'publisher');

      expect(tasks).toHaveLength(2);
      expect(tasks.every((t) => t.publisherId === testUserId)).toBe(true);
    });

    it('should retrieve tasks assigned to user', async () => {
      const task = await taskService.createTask({
        name: 'Task 1',
        publisherId: testUserId,
      });

      await taskService.updateTask(task.id, {
        assigneeId: testUserId,
      });

      const tasks = await taskService.getTasksByUser(testUserId, 'assignee');

      expect(tasks).toHaveLength(1);
      expect(tasks[0].assigneeId).toBe(testUserId);
    });
  });

  describe('getSubtasks', () => {
    it('should retrieve all subtasks of a parent', async () => {
      const parentTask = await taskService.createTask({
        name: 'Parent Task',
        publisherId: testUserId,
      });

      await taskService.createTask({
        name: 'Subtask 1',
        publisherId: testUserId,
        parentId: parentTask.id,
      });

      await taskService.createTask({
        name: 'Subtask 2',
        publisherId: testUserId,
        parentId: parentTask.id,
      });

      const subtasks = await taskService.getSubtasks(parentTask.id);

      expect(subtasks).toHaveLength(2);
      expect(subtasks.every((t) => t.parentId === parentTask.id)).toBe(true);
    });
  });

  describe('validateTaskHierarchy', () => {
    it('should return true for task at depth 0', async () => {
      const task = await taskService.createTask({
        name: 'Task',
        publisherId: testUserId,
      });

      const isValid = await taskService.validateTaskHierarchy(task.id);
      expect(isValid).toBe(true);
    });

    it('should return true for task at depth 1', async () => {
      const parentTask = await taskService.createTask({
        name: 'Parent',
        publisherId: testUserId,
      });

      const childTask = await taskService.createTask({
        name: 'Child',
        publisherId: testUserId,
        parentId: parentTask.id,
      });

      const isValid = await taskService.validateTaskHierarchy(childTask.id);
      expect(isValid).toBe(true);
    });

    it('should reject creating task at depth 2', async () => {
      const parentTask = await taskService.createTask({
        name: 'Parent',
        publisherId: testUserId,
      });

      const childTask = await taskService.createTask({
        name: 'Child',
        publisherId: testUserId,
        parentId: parentTask.id,
      });

      // Attempt to create grandchild (depth 2) should fail
      await expect(
        taskService.createTask({
          name: 'Grandchild',
          publisherId: testUserId,
          parentId: childTask.id,
        })
      ).rejects.toThrow('Task hierarchy cannot exceed 2 levels');
    });

    it('should return false for non-existent task', async () => {
      const isValid = await taskService.validateTaskHierarchy('00000000-0000-0000-0000-000000000000');
      expect(isValid).toBe(false);
    });
  });

  describe('addSubtask', () => {
    it('should add subtask using convenience method', async () => {
      const parentTask = await taskService.createTask({
        name: 'Parent',
        publisherId: testUserId,
      });

      const subtask = await taskService.addSubtask(parentTask.id, {
        name: 'Subtask',
        publisherId: testUserId,
      });

      expect(subtask.parentId).toBe(parentTask.id);
      expect(subtask.depth).toBe(1);
    });

    it('should reject adding subtask to depth 1 task', async () => {
      const parentTask = await taskService.createTask({
        name: 'Parent',
        publisherId: testUserId,
      });

      const childTask = await taskService.createTask({
        name: 'Child',
        publisherId: testUserId,
        parentId: parentTask.id,
      });

      // Attempt to add subtask to depth 1 task should fail (would create depth 2)
      await expect(
        taskService.addSubtask(childTask.id, {
          name: 'Grandchild',
          publisherId: testUserId,
        })
      ).rejects.toThrow('Task hierarchy cannot exceed 2 levels');
    });
  });

  describe('deleteTask', () => {
    it('should delete task', async () => {
      const task = await taskService.createTask({
        name: 'Task to Delete',
        publisherId: testUserId,
      });

      await taskService.deleteTask(task.id);

      const deleted = await taskService.getTask(task.id);
      expect(deleted).toBeNull();
    });

    it('should update parent stats when subtask is deleted', async () => {
      const parentTask = await taskService.createTask({
        name: 'Parent',
        publisherId: testUserId,
      });

      const subtask1 = await taskService.createTask({
        name: 'Subtask 1',
        publisherId: testUserId,
        parentId: parentTask.id,
        estimatedHours: 10,
      });

      const subtask2 = await taskService.createTask({
        name: 'Subtask 2',
        publisherId: testUserId,
        parentId: parentTask.id,
        estimatedHours: 20,
      });

      let parent = await taskService.getTask(parentTask.id);
      expect(parseFloat(parent?.aggregatedEstimatedHours as any)).toBe(30);

      await taskService.deleteTask(subtask1.id);

      parent = await taskService.getTask(parentTask.id);
      expect(parseFloat(parent?.aggregatedEstimatedHours as any)).toBe(20);
    });
  });

  describe('getVisibleTasks', () => {
    let otherUserId: string;
    let positionId: string;

    beforeEach(async () => {
      // Create another user
      const otherUser = await userService.createUser({
        username: `otheruser_${Date.now()}`,
        email: `other_${Date.now()}@example.com`,
        password: 'password123',
        role: UserRole.USER,
      });
      otherUserId = otherUser.id;

      // Create a position
      const positionResult = await pool.query(
        `INSERT INTO positions (name, description) VALUES ($1, $2) RETURNING id`,
        ['Developer', 'Software Developer']
      );
      positionId = positionResult.rows[0].id;

      // Assign position to testUser
      await pool.query(
        `INSERT INTO user_positions (user_id, position_id) VALUES ($1, $2)`,
        [testUserId, positionId]
      );
    });

    afterEach(async () => {
      await pool.query('DELETE FROM user_positions WHERE user_id = $1', [testUserId]);
      await pool.query('DELETE FROM user_positions WHERE user_id = $1', [otherUserId]);
      await pool.query('DELETE FROM positions WHERE id = $1', [positionId]);
      await pool.query('DELETE FROM users WHERE id = $1', [otherUserId]);
    });

    it('should return PUBLIC tasks to all users', async () => {
      const publicTask = await taskService.createTask({
        name: 'Public Task',
        publisherId: otherUserId,
        visibility: Visibility.PUBLIC,
      });

      const visibleTasks = await taskService.getVisibleTasks(testUserId);

      expect(visibleTasks.some((t) => t.id === publicTask.id)).toBe(true);
    });

    it('should return POSITION_ONLY tasks to users with matching position', async () => {
      const positionTask = await taskService.createTask({
        name: 'Position Task',
        publisherId: otherUserId,
        positionId: positionId,
        visibility: Visibility.POSITION_ONLY,
      });

      const visibleTasks = await taskService.getVisibleTasks(testUserId);

      expect(visibleTasks.some((t) => t.id === positionTask.id)).toBe(true);
    });

    it('should NOT return POSITION_ONLY tasks to users without matching position', async () => {
      const positionTask = await taskService.createTask({
        name: 'Position Task',
        publisherId: otherUserId,
        positionId: positionId,
        visibility: Visibility.POSITION_ONLY,
      });

      const visibleTasks = await taskService.getVisibleTasks(otherUserId);

      expect(visibleTasks.some((t) => t.id === positionTask.id)).toBe(false);
    });

    it('should return PRIVATE tasks to publisher', async () => {
      const privateTask = await taskService.createTask({
        name: 'Private Task',
        publisherId: testUserId,
        visibility: Visibility.PRIVATE,
      });

      const visibleTasks = await taskService.getVisibleTasks(testUserId);

      expect(visibleTasks.some((t) => t.id === privateTask.id)).toBe(true);
    });

    it('should return PRIVATE tasks to assignee', async () => {
      const privateTask = await taskService.createTask({
        name: 'Private Task',
        publisherId: otherUserId,
        visibility: Visibility.PRIVATE,
      });

      await taskService.updateTask(privateTask.id, {
        assigneeId: testUserId,
      });

      const visibleTasks = await taskService.getVisibleTasks(testUserId);

      expect(visibleTasks.some((t) => t.id === privateTask.id)).toBe(true);
    });

    it('should NOT return PRIVATE tasks to other users', async () => {
      const privateTask = await taskService.createTask({
        name: 'Private Task',
        publisherId: otherUserId,
        visibility: Visibility.PRIVATE,
      });

      const visibleTasks = await taskService.getVisibleTasks(testUserId);

      expect(visibleTasks.some((t) => t.id === privateTask.id)).toBe(false);
    });
  });

  describe('getAvailableTasks', () => {
    let otherUserId: string;
    let positionId: string;

    beforeEach(async () => {
      // Create another user
      const otherUser = await userService.createUser({
        username: `otheruser_${Date.now()}`,
        email: `other_${Date.now()}@example.com`,
        password: 'password123',
        role: UserRole.USER,
      });
      otherUserId = otherUser.id;

      // Create a position
      const positionResult = await pool.query(
        `INSERT INTO positions (name, description) VALUES ($1, $2) RETURNING id`,
        ['Developer', 'Software Developer']
      );
      positionId = positionResult.rows[0].id;

      // Assign position to testUser
      await pool.query(
        `INSERT INTO user_positions (user_id, position_id) VALUES ($1, $2)`,
        [testUserId, positionId]
      );
    });

    afterEach(async () => {
      await pool.query('DELETE FROM user_positions WHERE user_id = $1', [testUserId]);
      await pool.query('DELETE FROM user_positions WHERE user_id = $1', [otherUserId]);
      await pool.query('DELETE FROM positions WHERE id = $1', [positionId]);
      await pool.query('DELETE FROM users WHERE id = $1', [otherUserId]);
    });

    it('should only return unassigned executable tasks', async () => {
      const availableTask = await taskService.createTask({
        name: 'Available Task',
        publisherId: otherUserId,
        visibility: Visibility.PUBLIC,
      });

      const assignedTask = await taskService.createTask({
        name: 'Assigned Task',
        publisherId: otherUserId,
        visibility: Visibility.PUBLIC,
      });

      await taskService.updateTask(assignedTask.id, {
        assigneeId: otherUserId,
      });

      const availableTasks = await taskService.getAvailableTasks(testUserId);

      expect(availableTasks.some((t) => t.id === availableTask.id)).toBe(true);
      expect(availableTasks.some((t) => t.id === assignedTask.id)).toBe(false);
    });

    it('should not return parent tasks (non-executable)', async () => {
      const parentTask = await taskService.createTask({
        name: 'Parent Task',
        publisherId: otherUserId,
        visibility: Visibility.PUBLIC,
      });

      await taskService.createTask({
        name: 'Child Task',
        publisherId: otherUserId,
        parentId: parentTask.id,
        visibility: Visibility.PUBLIC,
      });

      const availableTasks = await taskService.getAvailableTasks(testUserId);

      expect(availableTasks.some((t) => t.id === parentTask.id)).toBe(false);
    });

    it('should apply visibility rules to available tasks', async () => {
      const publicTask = await taskService.createTask({
        name: 'Public Task',
        publisherId: otherUserId,
        visibility: Visibility.PUBLIC,
      });

      const privateTask = await taskService.createTask({
        name: 'Private Task',
        publisherId: otherUserId,
        visibility: Visibility.PRIVATE,
      });

      const availableTasks = await taskService.getAvailableTasks(testUserId);

      expect(availableTasks.some((t) => t.id === publicTask.id)).toBe(true);
      expect(availableTasks.some((t) => t.id === privateTask.id)).toBe(false);
    });
  });

  describe('acceptTask', () => {
    let otherUserId: string;
    let positionId: string;

    beforeEach(async () => {
      // Create another user
      const otherUser = await userService.createUser({
        username: `otheruser_${Date.now()}`,
        email: `other_${Date.now()}@example.com`,
        password: 'password123',
        role: UserRole.USER,
      });
      otherUserId = otherUser.id;

      // Create a position
      const positionResult = await pool.query(
        `INSERT INTO positions (name, description) VALUES ($1, $2) RETURNING id`,
        ['Developer', 'Software Developer']
      );
      positionId = positionResult.rows[0].id;

      // Assign position to testUser
      await pool.query(
        `INSERT INTO user_positions (user_id, position_id) VALUES ($1, $2)`,
        [testUserId, positionId]
      );
    });

    afterEach(async () => {
      await pool.query('DELETE FROM user_positions WHERE user_id = $1', [testUserId]);
      await pool.query('DELETE FROM user_positions WHERE user_id = $1', [otherUserId]);
      await pool.query('DELETE FROM positions WHERE id = $1', [positionId]);
      await pool.query('DELETE FROM users WHERE id = $1', [otherUserId]);
    });

    it('should allow user to accept task without position requirement', async () => {
      const task = await taskService.createTask({
        name: 'Public Task',
        publisherId: otherUserId,
        visibility: Visibility.PUBLIC,
      });

      const acceptedTask = await taskService.acceptTask(task.id, testUserId);

      expect(acceptedTask.assigneeId).toBe(testUserId);
      expect(acceptedTask.status).toBe(TaskStatus.IN_PROGRESS);
    });

    it('should allow user with matching position to accept task', async () => {
      const task = await taskService.createTask({
        name: 'Position Task',
        publisherId: otherUserId,
        positionId: positionId,
        visibility: Visibility.PUBLIC,
      });

      const acceptedTask = await taskService.acceptTask(task.id, testUserId);

      expect(acceptedTask.assigneeId).toBe(testUserId);
      expect(acceptedTask.status).toBe(TaskStatus.IN_PROGRESS);
    });

    it('should reject user without matching position', async () => {
      const task = await taskService.createTask({
        name: 'Position Task',
        publisherId: testUserId,
        positionId: positionId,
        visibility: Visibility.PUBLIC,
      });

      await expect(taskService.acceptTask(task.id, otherUserId)).rejects.toThrow(
        'User does not have the required position for this task'
      );
    });

    it('should reject accepting already assigned task', async () => {
      const task = await taskService.createTask({
        name: 'Task',
        publisherId: otherUserId,
        visibility: Visibility.PUBLIC,
      });

      await taskService.acceptTask(task.id, testUserId);

      await expect(taskService.acceptTask(task.id, otherUserId)).rejects.toThrow(
        'Task is already assigned'
      );
    });

    it('should reject accepting non-executable task', async () => {
      const parentTask = await taskService.createTask({
        name: 'Parent Task',
        publisherId: otherUserId,
        visibility: Visibility.PUBLIC,
      });

      await taskService.createTask({
        name: 'Child Task',
        publisherId: otherUserId,
        parentId: parentTask.id,
        visibility: Visibility.PUBLIC,
      });

      await expect(taskService.acceptTask(parentTask.id, testUserId)).rejects.toThrow(
        'Only executable tasks (leaf nodes) can be accepted'
      );
    });

    it('should reject accepting task with unresolved dependencies', async () => {
      const task1 = await taskService.createTask({
        name: 'Task 1',
        publisherId: otherUserId,
        visibility: Visibility.PUBLIC,
      });

      const task2 = await taskService.createTask({
        name: 'Task 2',
        publisherId: otherUserId,
        visibility: Visibility.PUBLIC,
      });

      await taskService.addDependency(task2.id, task1.id);

      await expect(taskService.acceptTask(task2.id, testUserId)).rejects.toThrow(
        'Cannot accept task: unresolved dependencies exist'
      );
    });

    it('should allow accepting task after dependencies are resolved', async () => {
      const task1 = await taskService.createTask({
        name: 'Task 1',
        publisherId: otherUserId,
        visibility: Visibility.PUBLIC,
      });

      const task2 = await taskService.createTask({
        name: 'Task 2',
        publisherId: otherUserId,
        visibility: Visibility.PUBLIC,
      });

      await taskService.addDependency(task2.id, task1.id);

      // Complete task1
      await taskService.updateTask(task1.id, {
        status: TaskStatus.COMPLETED,
      });

      // Now task2 should be acceptable
      const acceptedTask = await taskService.acceptTask(task2.id, testUserId);

      expect(acceptedTask.assigneeId).toBe(testUserId);
      expect(acceptedTask.status).toBe(TaskStatus.IN_PROGRESS);
    });
  });

  describe('abandonTask', () => {
    let otherUserId: string;

    beforeEach(async () => {
      // Create another user
      const otherUser = await userService.createUser({
        username: `otheruser_${Date.now()}`,
        email: `other_${Date.now()}@example.com`,
        password: 'password123',
        role: UserRole.USER,
      });
      otherUserId = otherUser.id;
    });

    afterEach(async () => {
      await pool.query('DELETE FROM users WHERE id = $1', [otherUserId]);
    });

    it('should allow assignee to abandon task', async () => {
      const task = await taskService.createTask({
        name: 'Task to Abandon',
        publisherId: otherUserId,
        visibility: Visibility.PUBLIC,
      });

      // Accept the task
      await taskService.acceptTask(task.id, testUserId);

      // Abandon the task
      const result = await taskService.abandonTask(task.id, testUserId);

      expect(result.task.assigneeId).toBeNull();
      expect(result.task.status).toBe(TaskStatus.NOT_STARTED);
      expect(result.task.progress).toBe(0);
      expect(result.publisherId).toBe(otherUserId);
    });

    it('should reject abandoning task by non-assignee', async () => {
      const task = await taskService.createTask({
        name: 'Task',
        publisherId: otherUserId,
        visibility: Visibility.PUBLIC,
      });

      await taskService.acceptTask(task.id, testUserId);

      await expect(taskService.abandonTask(task.id, otherUserId)).rejects.toThrow(
        'Only the assigned user can abandon this task'
      );
    });

    it('should reject abandoning completed task', async () => {
      const task = await taskService.createTask({
        name: 'Task',
        publisherId: otherUserId,
        visibility: Visibility.PUBLIC,
      });

      await taskService.acceptTask(task.id, testUserId);
      await taskService.updateTask(task.id, { status: TaskStatus.COMPLETED });

      await expect(taskService.abandonTask(task.id, testUserId)).rejects.toThrow(
        'Cannot abandon a completed task'
      );
    });

    it('should reject abandoning non-existent task', async () => {
      await expect(
        taskService.abandonTask('00000000-0000-0000-0000-000000000000', testUserId)
      ).rejects.toThrow('Task not found');
    });
  });

  describe('transferTask', () => {
    let otherUserId: string;
    let thirdUserId: string;
    let positionId: string;

    beforeEach(async () => {
      // Create other users
      const otherUser = await userService.createUser({
        username: `otheruser_${Date.now()}`,
        email: `other_${Date.now()}@example.com`,
        password: 'password123',
        role: UserRole.USER,
      });
      otherUserId = otherUser.id;

      const thirdUser = await userService.createUser({
        username: `thirduser_${Date.now()}`,
        email: `third_${Date.now()}@example.com`,
        password: 'password123',
        role: UserRole.USER,
      });
      thirdUserId = thirdUser.id;

      // Create a position
      const positionResult = await pool.query(
        `INSERT INTO positions (name, description) VALUES ($1, $2) RETURNING id`,
        ['Developer', 'Software Developer']
      );
      positionId = positionResult.rows[0].id;

      // Assign position to testUser and thirdUser
      await pool.query(
        `INSERT INTO user_positions (user_id, position_id) VALUES ($1, $2)`,
        [testUserId, positionId]
      );
      await pool.query(
        `INSERT INTO user_positions (user_id, position_id) VALUES ($1, $2)`,
        [thirdUserId, positionId]
      );
    });

    afterEach(async () => {
      await pool.query('DELETE FROM user_positions WHERE user_id = $1', [testUserId]);
      await pool.query('DELETE FROM user_positions WHERE user_id = $1', [thirdUserId]);
      await pool.query('DELETE FROM positions WHERE id = $1', [positionId]);
      await pool.query('DELETE FROM users WHERE id = $1', [otherUserId]);
      await pool.query('DELETE FROM users WHERE id = $1', [thirdUserId]);
    });

    it('should allow assignee to transfer task to another user', async () => {
      const task = await taskService.createTask({
        name: 'Task to Transfer',
        publisherId: otherUserId,
        visibility: Visibility.PUBLIC,
      });

      // Accept the task
      await taskService.acceptTask(task.id, testUserId);

      // Transfer to third user
      const result = await taskService.transferTask(task.id, testUserId, thirdUserId);

      expect(result.task.assigneeId).toBe(thirdUserId);
      expect(result.currentUserId).toBe(testUserId);
      expect(result.newUserId).toBe(thirdUserId);
      expect(result.publisherId).toBe(otherUserId);
    });

    it('should validate receiver has required position', async () => {
      const task = await taskService.createTask({
        name: 'Position Task',
        publisherId: otherUserId,
        positionId: positionId,
        visibility: Visibility.PUBLIC,
      });

      await taskService.acceptTask(task.id, testUserId);

      // Try to transfer to user without position
      await expect(taskService.transferTask(task.id, testUserId, otherUserId)).rejects.toThrow(
        'Receiver does not have the required position for this task'
      );
    });

    it('should allow transfer when receiver has required position', async () => {
      const task = await taskService.createTask({
        name: 'Position Task',
        publisherId: otherUserId,
        positionId: positionId,
        visibility: Visibility.PUBLIC,
      });

      await taskService.acceptTask(task.id, testUserId);

      // Transfer to user with position
      const result = await taskService.transferTask(task.id, testUserId, thirdUserId);

      expect(result.task.assigneeId).toBe(thirdUserId);
    });

    it('should reject transfer by non-assignee', async () => {
      const task = await taskService.createTask({
        name: 'Task',
        publisherId: otherUserId,
        visibility: Visibility.PUBLIC,
      });

      await taskService.acceptTask(task.id, testUserId);

      await expect(taskService.transferTask(task.id, otherUserId, thirdUserId)).rejects.toThrow(
        'Only the assigned user can transfer this task'
      );
    });

    it('should reject transferring completed task', async () => {
      const task = await taskService.createTask({
        name: 'Task',
        publisherId: otherUserId,
        visibility: Visibility.PUBLIC,
      });

      await taskService.acceptTask(task.id, testUserId);
      await taskService.updateTask(task.id, { status: TaskStatus.COMPLETED });

      await expect(taskService.transferTask(task.id, testUserId, thirdUserId)).rejects.toThrow(
        'Cannot transfer a completed task'
      );
    });

    it('should reject transferring non-existent task', async () => {
      await expect(
        taskService.transferTask('00000000-0000-0000-0000-000000000000', testUserId, thirdUserId)
      ).rejects.toThrow('Task not found');
    });
  });

  describe('Progress Tracking', () => {
    describe('updateProgress', () => {
      it('should update task progress within valid range (0-100)', async () => {
        const task = await taskService.createTask({
          name: 'Test Task',
          publisherId: testUserId,
        });

        const result = await taskService.updateProgress(task.id, 50);

        expect(result.task.progress).toBe(50);
        expect(result.completionPrompt).toBe(false);
      });

      it('should reject progress less than 0', async () => {
        const task = await taskService.createTask({
          name: 'Test Task',
          publisherId: testUserId,
        });

        await expect(taskService.updateProgress(task.id, -1)).rejects.toThrow(
          'Progress must be between 0 and 100'
        );
      });

      it('should reject progress greater than 100', async () => {
        const task = await taskService.createTask({
          name: 'Test Task',
          publisherId: testUserId,
        });

        await expect(taskService.updateProgress(task.id, 101)).rejects.toThrow(
          'Progress must be between 0 and 100'
        );
      });

      it('should generate completion prompt when progress reaches 100%', async () => {
        const task = await taskService.createTask({
          name: 'Test Task',
          publisherId: testUserId,
        });

        const result = await taskService.updateProgress(task.id, 100);

        expect(result.task.progress).toBe(100);
        expect(result.completionPrompt).toBe(true);
      });

      it('should reject updating progress on locked task', async () => {
        const task = await taskService.createTask({
          name: 'Test Task',
          publisherId: testUserId,
        });

        // Complete and lock the task
        await taskService.completeTask(task.id);

        await expect(taskService.updateProgress(task.id, 50)).rejects.toThrow(
          'Progress is locked for completed tasks'
        );
      });

      it('should reject updating progress on non-existent task', async () => {
        await expect(
          taskService.updateProgress('00000000-0000-0000-0000-000000000000', 50)
        ).rejects.toThrow('Task not found');
      });
    });

    describe('aggregateParentProgress', () => {
      it('should calculate parent progress as average of subtask progress', async () => {
        const parentTask = await taskService.createTask({
          name: 'Parent Task',
          publisherId: testUserId,
        });

        const subtask1 = await taskService.createTask({
          name: 'Subtask 1',
          publisherId: testUserId,
          parentId: parentTask.id,
        });

        const subtask2 = await taskService.createTask({
          name: 'Subtask 2',
          publisherId: testUserId,
          parentId: parentTask.id,
        });

        // Update subtask progress
        await taskService.updateProgress(subtask1.id, 60);
        await taskService.updateProgress(subtask2.id, 40);

        // Check parent progress (should be average: (60 + 40) / 2 = 50)
        const updatedParent = await taskService.getTask(parentTask.id);
        expect(updatedParent?.progress).toBe(50);
      });

      it('should round parent progress to nearest integer', async () => {
        const parentTask = await taskService.createTask({
          name: 'Parent Task',
          publisherId: testUserId,
        });

        const subtask1 = await taskService.createTask({
          name: 'Subtask 1',
          publisherId: testUserId,
          parentId: parentTask.id,
        });

        const subtask2 = await taskService.createTask({
          name: 'Subtask 2',
          publisherId: testUserId,
          parentId: parentTask.id,
        });

        const subtask3 = await taskService.createTask({
          name: 'Subtask 3',
          publisherId: testUserId,
          parentId: parentTask.id,
        });

        // Update subtask progress: (50 + 60 + 70) / 3 = 60
        await taskService.updateProgress(subtask1.id, 50);
        await taskService.updateProgress(subtask2.id, 60);
        await taskService.updateProgress(subtask3.id, 70);

        const updatedParent = await taskService.getTask(parentTask.id);
        expect(updatedParent?.progress).toBe(60);
      });

      it('should update parent progress when subtask progress changes', async () => {
        const parentTask = await taskService.createTask({
          name: 'Parent Task',
          publisherId: testUserId,
        });

        const subtask1 = await taskService.createTask({
          name: 'Subtask 1',
          publisherId: testUserId,
          parentId: parentTask.id,
        });

        const subtask2 = await taskService.createTask({
          name: 'Subtask 2',
          publisherId: testUserId,
          parentId: parentTask.id,
        });

        // Update subtask progress
        await taskService.updateProgress(subtask1.id, 80);
        await taskService.updateProgress(subtask2.id, 60);

        // Check parent progress (should be average: (80 + 60) / 2 = 70)
        const updatedParent = await taskService.getTask(parentTask.id);

        expect(updatedParent?.progress).toBe(70);
      });
    });

    describe('lockProgress', () => {
      it('should lock progress when task is completed', async () => {
        const task = await taskService.createTask({
          name: 'Test Task',
          publisherId: testUserId,
        });

        // Complete the task
        await taskService.completeTask(task.id);

        // Verify progress is locked
        const updatedTask = await taskService.getTask(task.id);
        expect(updatedTask?.progressLocked).toBe(true);
        expect(updatedTask?.progress).toBe(100);
      });

      it('should reject locking progress on non-completed task', async () => {
        const task = await taskService.createTask({
          name: 'Test Task',
          publisherId: testUserId,
        });

        await expect(taskService.lockProgress(task.id)).rejects.toThrow(
          'Can only lock progress for completed tasks'
        );
      });

      it('should reject locking progress on non-existent task', async () => {
        await expect(
          taskService.lockProgress('00000000-0000-0000-0000-000000000000')
        ).rejects.toThrow('Task not found');
      });
    });

    describe('completeTask', () => {
      it('should set progress to 100% and lock it when completing task', async () => {
        const task = await taskService.createTask({
          name: 'Test Task',
          publisherId: testUserId,
        });

        await taskService.updateProgress(task.id, 50);
        await taskService.completeTask(task.id);

        const completedTask = await taskService.getTask(task.id);
        expect(completedTask?.status).toBe(TaskStatus.COMPLETED);
        expect(completedTask?.progress).toBe(100);
        expect(completedTask?.progressLocked).toBe(true);
      });
    });
  });
});
