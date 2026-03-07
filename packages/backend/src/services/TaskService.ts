import { pool } from '../config/database.js';
import { Task, TaskCreateDTO, TaskUpdateDTO, TaskStatus, Visibility, TaskStats, PaginationParams, PaginatedResponse, InvitationStatus } from '../models/Task.js';
import { ValidationError, NotFoundError, AuthorizationError } from '../utils/errors.js';
import { DependencyService } from './DependencyService.js';
import { BountyService } from './BountyService.js';
import { BountyDistributionService } from './BountyDistributionService.js';
import { RankingService } from './RankingService.js';
import { rankingUpdateQueue } from './RankingUpdateQueue.js';
import { NotificationService } from './NotificationService.js';
import { NotificationType } from '../models/Notification.js';
import { UserResponse } from '../models/User.js';
import { TaskRepository } from '../repositories/TaskRepository.js';
import { PositionRepository } from '../repositories/PositionRepository.js';
import { UserRepository } from '../repositories/UserRepository.js';
import { GroupRepository } from '../repositories/GroupRepository.js';
import { PermissionChecker } from '../utils/PermissionChecker.js';
import { TransactionManager } from '../utils/TransactionManager.js';
import { CacheService } from './CacheService.js';
import { performanceMonitor } from '../utils/PerformanceMonitor.js';
import { Validator } from '../utils/Validator.js';
import { OwnershipValidator } from '../utils/OwnershipValidator.js';
import { HandleError } from '../utils/decorators/handleError.js';
import { Cache, CacheEvict, TaskCache } from '../utils/decorators/cache.js';
import { logger } from '../config/logger.js';

export class TaskService {
  private dependencyService: DependencyService;
  private bountyService: BountyService;
  private bountyDistributionService: BountyDistributionService;
  private rankingService: RankingService;
  private notificationService: NotificationService;
  private taskRepository: TaskRepository;
  private positionRepository: PositionRepository;
  private userRepository: UserRepository;
  private permissionChecker: PermissionChecker;
  private transactionManager: TransactionManager;
  private cacheService: CacheService;

  constructor(
    taskRepository?: TaskRepository,
    positionRepository?: PositionRepository,
    permissionChecker?: PermissionChecker,
    transactionManager?: TransactionManager,
    cacheService?: CacheService
  ) {
    this.dependencyService = new DependencyService();
    this.bountyService = new BountyService();
    this.bountyDistributionService = new BountyDistributionService();
    this.rankingService = new RankingService(pool);
    this.notificationService = new NotificationService();
    
    // Use injected dependencies or create new instances for backward compatibility
    this.taskRepository = taskRepository || new TaskRepository();
    this.positionRepository = positionRepository || new PositionRepository();
    this.userRepository = new UserRepository();
    this.permissionChecker = permissionChecker || new PermissionChecker(
      this.userRepository,
      this.taskRepository,
      new GroupRepository(),
      this.positionRepository
    );
    this.transactionManager = transactionManager || new TransactionManager(pool);
    this.cacheService = cacheService || new CacheService();
  }

  private mapTasksWithUsers(rows: any[]): (Task & { publisher?: UserResponse; assignee?: UserResponse })[] {
    return rows.map((row) => {
      const publisher: UserResponse | undefined = row['publisher.id']
        ? {
            id: row['publisher.id'],
            username: row['publisher.username'],
            email: row['publisher.email'],
            avatarId: row['publisher.avatarId'],
            avatarUrl: row['publisher.avatarUrl'],
            role: row['publisher.role'],
            balance: row['publisher.balance'] || 0,
            notificationPreferences: null, // 在任务查询中不需要通知偏好
            createdAt: row['publisher.createdAt'],
            lastLogin: row['publisher.lastLogin'],
          }
        : undefined;

      const assignee: UserResponse | undefined = row['assignee.id']
        ? {
            id: row['assignee.id'],
            username: row['assignee.username'],
            email: row['assignee.email'],
            avatarId: row['assignee.avatarId'],
            avatarUrl: row['assignee.avatarUrl'],
            role: row['assignee.role'],
            balance: row['assignee.balance'] || 0,
            notificationPreferences: null, // 在任务查询中不需要通知偏好
            createdAt: row['assignee.createdAt'],
            lastLogin: row['assignee.lastLogin'],
          }
        : undefined;

      const {
        ['publisher.id']: _pi,
        ['publisher.username']: _pu,
        ['publisher.email']: _pe,
        ['publisher.avatarId']: _pa,
        ['publisher.role']: _pr,
        ['publisher.createdAt']: _pc,
        ['publisher.lastLogin']: _pl,
        ['assignee.id']: _ai,
        ['assignee.username']: _au,
        ['assignee.email']: _ae,
        ['assignee.avatarId']: _aa,
        ['assignee.role']: _ar,
        ['assignee.createdAt']: _ac,
        ['assignee.lastLogin']: _al,
        ...task
      } = row;

      const result = { ...(task as Task) };
      if (publisher) result.publisher = publisher;
      if (assignee) result.assignee = assignee;
      
      return result;
    });
  }

  /**
   * Create a new task (independent or subtask)
   * Validates hierarchy depth (max 3 levels: 0, 1, 2)
   * Automatically marks leaf nodes as executable
   */
  @CacheEvict({
    patterns: ['available_tasks:*', 'visible_tasks:*', 'task_stats:*']
  })
  @HandleError({ context: 'TaskService.createTask' })
  async createTask(taskData: TaskCreateDTO): Promise<Task> {
    const {
      name,
      description = null,
      parentId = null,
      publisherId,
      tags = [],
      plannedStartDate = null,
      plannedEndDate = null,
      estimatedHours = null,
      complexity = null,
      priority = null,
      positionId = null,
      visibility = Visibility.PUBLIC,
      invitedUserId = null,
    } = taskData;

    // Handle task assignment invitation
    if (invitedUserId && !parentId) {
      // Validate invited user exists
      const invitedUser = await this.userRepository.findById(invitedUserId);
      if (!invitedUser) {
        throw new NotFoundError('Invited user not found');
      }

      // Cannot invite yourself
      if (invitedUserId === publisherId) {
        throw new ValidationError('Cannot invite yourself to a task');
      }

      // Override visibility and status for invited tasks
      taskData.visibility = Visibility.PRIVATE;
      taskData.invitedUserId = invitedUserId;
    }

    // Validate hierarchy depth if this is a subtask
    let depth = 0;
    if (parentId) {
      const parent = await this.getTask(parentId);
      if (!parent) {
        throw new NotFoundError('Parent task not found');
      }

      depth = parent.depth + 1;

      // New requirement: Task hierarchy can have at most two levels (depth 0-1)
      // i.e., a parent (depth 0) and its direct subtasks (depth 1). Disallow deeper nesting.
      if (depth > 1) {
        throw new ValidationError('Task hierarchy cannot exceed 2 levels (depth 0-1)');
      }

      // Requirement: Subtask assignment constraints
      // Inherit Group ID from parent tasks
      if (parent.groupId) {
        taskData.groupId = parent.groupId;

        // If assignee is provided, verify they are a member of the group
        if (taskData.assigneeId) {
           const memberCheck = await pool.query(
             'SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2',
             [parent.groupId, taskData.assigneeId]
           );
           if (memberCheck.rows.length === 0) {
             throw new ValidationError('Assignee must be a member of the parent task group');
           }
        }
      } else if (parent.assigneeId) {
        // If parent is NOT a group task but has an assignee (Personal Task),
        // subtasks must be assigned to the same user.
        taskData.assigneeId = parent.assigneeId;
      }
    }

    // Additional rule for top-level tasks that are associated with a group:
    // Top-level (depth 0) tasks that specify a group must also specify an assignee
    // who is a member of that group. We keep groupId for affiliation but require
    // a concrete assignee (user) instead of leaving the task assigned to the group.
    if (!parentId && taskData.groupId) {
      if (!taskData.assigneeId) {
        throw new ValidationError('Top-level group tasks must assign to a group member (assigneeId required)');
      }
      const memberCheckTop = await pool.query(
        'SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2',
        [taskData.groupId, taskData.assigneeId]
      );
      if (memberCheckTop.rows.length === 0) {
        throw new ValidationError('Assignee must be a member of the specified group');
      }
    }

    // Calculate bounty for the task (Requirement 19.1: automatic bounty calculation)
    let bountyAmount = 0;
    let bountyAlgorithmVersion = null;
    let isPublished = true;  // Default: top-level tasks are published
    let bountyPayerId = null;
    let publishedAt: Date | null = new Date();
    let publishedBy: string | null = publisherId;

    if (parentId) {
      // NEW: Subtask publishing workflow defaults
      // Subtasks are created as PRIVATE with 0 bounty by default
      // They must be explicitly published by the parent task assignee
      const parent = await this.getTask(parentId);
      if (!parent) throw new NotFoundError('Parent task not found');
      
      isPublished = false;  // Subtasks start unpublished
      bountyAmount = 0;     // Subtasks start with 0 bounty
      bountyPayerId = parent.assigneeId;  // Bounty payer is parent assignee
      publishedAt = null;   // Not published yet
      publishedBy = null;   // No publisher yet
      
      // Override visibility to PRIVATE for unpublished subtasks
      taskData.visibility = Visibility.PRIVATE;
      
      // IMPORTANT: Preserve the assigneeId that was set earlier in the method
      // If no assigneeId was explicitly provided, default to parent's assignee
      if (!taskData.assigneeId && parent.assigneeId) {
        taskData.assigneeId = parent.assigneeId;
      }
    } else {
      const bountyCalculation = await this.bountyService.calculateBounty({
        estimatedHours,
        complexity,
        priority,
        plannedStartDate,
        plannedEndDate,
      });
      bountyAmount = bountyCalculation.amount;
      bountyAlgorithmVersion = bountyCalculation.algorithmVersion;
    }

    const query = `
      INSERT INTO tasks (
        name, description, parent_id, depth, publisher_id,
        tags, planned_start_date, planned_end_date, estimated_hours,
        complexity, priority, position_id, visibility,
        bounty_amount, bounty_algorithm_version,
        bounty_payer_id, is_published, published_at, published_by,
        assignee_id, group_id, status, invited_user_id, invitation_status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
      RETURNING 
        id, name, description, parent_id as "parentId", depth, is_executable as "isExecutable",
        tags, created_at as "createdAt", planned_start_date as "plannedStartDate",
        planned_end_date as "plannedEndDate", actual_start_date as "actualStartDate",
        actual_end_date as "actualEndDate", estimated_hours as "estimatedHours",
        complexity, priority, status, position_id as "positionId", visibility,
        bounty_amount as "bountyAmount", bounty_algorithm_version as "bountyAlgorithmVersion",
        is_bounty_settled as "isBountySettled", bounty_payer_id as "bountyPayerId",
        is_published as "isPublished", published_at as "publishedAt", published_by as "publishedBy",
        publisher_id as "publisherId", assignee_id as "assigneeId", group_id as "groupId", 
        progress, progress_locked as "progressLocked",
        aggregated_estimated_hours as "aggregatedEstimatedHours",
        aggregated_complexity as "aggregatedComplexity", updated_at as "updatedAt",
        invited_user_id as "invitedUserId", invitation_status as "invitationStatus"
    `;

    // Determine initial status
    // NEW: Default status is NOT_STARTED (task must be published before becoming available)
    // If invited user specified, status is PENDING_ACCEPTANCE
    // If assigned (to user or group), status should be IN_PROGRESS
    let initialStatus = TaskStatus.NOT_STARTED;
    if (taskData.invitedUserId) {
      initialStatus = TaskStatus.PENDING_ACCEPTANCE;
    } else if (taskData.assigneeId || taskData.groupId) {
      initialStatus = TaskStatus.IN_PROGRESS;
    }

    const values = [
      name,
      description,
      parentId,
      depth,
      publisherId,
      tags,
      plannedStartDate,
      plannedEndDate,
      estimatedHours,
      complexity,
      priority,
      positionId,
      taskData.visibility || visibility,
      bountyAmount,
      bountyAlgorithmVersion,
      bountyPayerId,
      isPublished,
      publishedAt,
      publishedBy,
      taskData.assigneeId || null,
      taskData.groupId || null,
      initialStatus,
      taskData.invitedUserId || null,
      taskData.invitedUserId ? InvitationStatus.PENDING : null,
    ];

    const result = await pool.query(query, values);
    const task = result.rows[0];

    // Send notification to invited user
    if (taskData.invitedUserId) {
      await this.notificationService.createNotification({
        userId: taskData.invitedUserId,
        type: NotificationType.TASK_ASSIGNMENT_INVITATION,
        title: '您收到了一个任务指派',
        message: `${task.publisher?.username || '某用户'} 邀请您承接任务 "${task.name}"`,
        relatedTaskId: task.id,
        senderId: publisherId,
      });
    }

    // Invalidate available tasks cache after successful task creation
    try {
      await this.cacheService.deletePattern('available_tasks:*');
    } catch (error) {
      logger.warn('Failed to invalidate cache after task creation', { error, taskId: task.id });
    }

    // If this is a subtask, update parent task statistics
    if (parentId) {
      await this.aggregateParentTaskStats(parentId);
    }

    return task;
  }

  /**
   * Publish a task
   * Publisher can choose to accept the task themselves or publish it for others
   * 
   * @param taskId - Task ID to publish
   * @param publisherId - User ID of the publisher
   * @param acceptBySelf - Whether the publisher accepts the task themselves
   * @returns Updated task
   */
  async publishTask(
    taskId: string, 
    publisherId: string, 
    acceptBySelf: boolean
  ): Promise<Task> {
    const task = await this.getTask(taskId);
    if (!task) {
      throw new NotFoundError('Task not found');
    }

    // Verify permission: only publisher can publish using OwnershipValidator
    await OwnershipValidator.validateTaskOwnership(taskId, publisherId);

    // Verify task is in NOT_STARTED status
    if (task.status !== TaskStatus.NOT_STARTED) {
      throw new ValidationError('Only tasks in NOT_STARTED status can be published');
    }

    // Determine new status and assignee based on choice
    const updates: TaskUpdateDTO = acceptBySelf
      ? {
          status: TaskStatus.IN_PROGRESS,
          assigneeId: publisherId,
          actualStartDate: new Date(),
        }
      : {
          status: TaskStatus.AVAILABLE,
          assigneeId: null,
        };

    const updatedTask = await this.updateTask(taskId, updates);

    // Invalidate available tasks cache
    try {
      await this.cacheService.deletePattern('available_tasks:*');
    } catch (error) {
      logger.warn('Failed to invalidate cache after task publish', { error, taskId });
    }

    return updatedTask;
  }

  /**
   * Get task by ID
   */
  @TaskCache(300) // 缓存5分钟
  @HandleError({ context: 'TaskService.getTask' })
  async getTask(taskId: string): Promise<Task | null> {
    return this.taskRepository.findByIdWithRelations(taskId);
  }

  /**
   * Get task by ID or throw NotFoundError
   * Helper method to eliminate repeated null checks
   */
  private async getTaskOrThrow(taskId: string, errorMessage?: string): Promise<Task> {
    const task = await this.getTask(taskId);
    if (!task) {
      throw new NotFoundError(errorMessage || `Task ${taskId} not found`);
    }
    return task;
  }

  /**
   * Update task
   * Records actual start/end times based on status changes
   */
  @CacheEvict({
    keyGenerator: (taskId: string) => [`task:${taskId}`, `visible_tasks:*`, `task_stats:*`],
    patterns: ['task:*', 'available_tasks:*']
  })
  @HandleError({ context: 'TaskService.updateTask' })
  async updateTask(taskId: string, updates: TaskUpdateDTO): Promise<Task> {
    const task = await this.getTask(taskId);
    if (!task) {
      throw new NotFoundError('Task not found');
    }

    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    // Handle status changes and automatic timestamp recording
    if (updates.status !== undefined) {
      // Record actual start time when status changes to IN_PROGRESS
      if (updates.status === TaskStatus.IN_PROGRESS && task.status !== TaskStatus.IN_PROGRESS) {
        if (!updates.actualStartDate) {
          updates.actualStartDate = new Date();
        }
      }

      // Record actual end time when status changes to COMPLETED
      if (updates.status === TaskStatus.COMPLETED && task.status !== TaskStatus.COMPLETED) {
        if (!updates.actualEndDate) {
          updates.actualEndDate = new Date();
        }
      }

      fields.push(`status = $${paramCount++}`);
      values.push(updates.status);
    }

    if (updates.name !== undefined) {
      fields.push(`name = $${paramCount++}`);
      values.push(updates.name);
    }

    if (updates.description !== undefined) {
      fields.push(`description = $${paramCount++}`);
      values.push(updates.description);
    }

    if (updates.tags !== undefined) {
      fields.push(`tags = $${paramCount++}`);
      values.push(updates.tags);
    }

    if (updates.plannedStartDate !== undefined) {
      fields.push(`planned_start_date = $${paramCount++}`);
      values.push(updates.plannedStartDate);
    }

    if (updates.plannedEndDate !== undefined) {
      fields.push(`planned_end_date = $${paramCount++}`);
      values.push(updates.plannedEndDate);
    }

    if (updates.actualStartDate !== undefined) {
      fields.push(`actual_start_date = $${paramCount++}`);
      values.push(updates.actualStartDate);
    }

    if (updates.actualEndDate !== undefined) {
      fields.push(`actual_end_date = $${paramCount++}`);
      values.push(updates.actualEndDate);
    }

    if (updates.estimatedHours !== undefined) {
      fields.push(`estimated_hours = $${paramCount++}`);
      values.push(updates.estimatedHours);
    }

    if (updates.complexity !== undefined) {
      fields.push(`complexity = $${paramCount++}`);
      values.push(updates.complexity);
    }

    if (updates.priority !== undefined) {
      fields.push(`priority = $${paramCount++}`);
      values.push(updates.priority);
    }

    if (updates.positionId !== undefined) {
      fields.push(`position_id = $${paramCount++}`);
      values.push(updates.positionId);
    }

    if (updates.projectGroupId !== undefined) {
      fields.push(`project_group_id = $${paramCount++}`);
      values.push(updates.projectGroupId);
    }

    if (updates.visibility !== undefined) {
      fields.push(`visibility = $${paramCount++}`);
      values.push(updates.visibility);
    }

    if (updates.assigneeId !== undefined) {
      fields.push(`assignee_id = $${paramCount++}`);
      values.push(updates.assigneeId);
    }

    if (updates.bountyPayerId !== undefined) {
      fields.push(`bounty_payer_id = $${paramCount++}`);
      values.push(updates.bountyPayerId);
    }

    if (updates.isPublished !== undefined) {
      fields.push(`is_published = $${paramCount++}`);
      values.push(updates.isPublished);
    }

    if (updates.publishedAt !== undefined) {
      fields.push(`published_at = $${paramCount++}`);
      values.push(updates.publishedAt);
    }

    if (updates.publishedBy !== undefined) {
      fields.push(`published_by = $${paramCount++}`);
      values.push(updates.publishedBy);
    }

    if (updates.invitedUserId !== undefined) {
      fields.push(`invited_user_id = $${paramCount++}`);
      values.push(updates.invitedUserId);
    }

    if (updates.invitationStatus !== undefined) {
      fields.push(`invitation_status = $${paramCount++}`);
      values.push(updates.invitationStatus);
    }

    if (updates.progress !== undefined) {
      // Validate progress is not locked
      if (task.progressLocked) {
        throw new ValidationError('Progress is locked for completed tasks');
      }
      fields.push(`progress = $${paramCount++}`);
      values.push(updates.progress);
    }

    if (fields.length === 0) {
      return task;
    }

    // Requirement 19.3: Recalculate bounty if task attributes that affect bounty have changed
    // and the task bounty is not yet settled
    const bountyAffectingFieldsChanged = 
      updates.estimatedHours !== undefined ||
      updates.complexity !== undefined ||
      updates.priority !== undefined ||
      updates.plannedStartDate !== undefined ||
      updates.plannedEndDate !== undefined;

    if (bountyAffectingFieldsChanged && !task.isBountySettled) {
      // Recalculate bounty with updated values
      const updatedCalculationInput = {
        estimatedHours: updates.estimatedHours !== undefined ? updates.estimatedHours : task.estimatedHours,
        complexity: updates.complexity !== undefined ? updates.complexity : task.complexity,
        priority: updates.priority !== undefined ? updates.priority : task.priority,
        plannedStartDate: updates.plannedStartDate !== undefined ? updates.plannedStartDate : task.plannedStartDate,
        plannedEndDate: updates.plannedEndDate !== undefined ? updates.plannedEndDate : task.plannedEndDate,
      };

      const bountyCalculation = await this.bountyService.calculateBounty(updatedCalculationInput);
      
      // Add bounty fields to update
      fields.push(`bounty_amount = $${paramCount++}`);
      values.push(bountyCalculation.amount);
      fields.push(`bounty_algorithm_version = $${paramCount++}`);
      values.push(bountyCalculation.algorithmVersion);
    }

    fields.push(`updated_at = NOW()`);
    values.push(taskId);

    const query = `
      UPDATE tasks
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING 
        id, name, description, parent_id as "parentId", depth, is_executable as "isExecutable",
        tags, created_at as "createdAt", planned_start_date as "plannedStartDate",
        planned_end_date as "plannedEndDate", actual_start_date as "actualStartDate",
        actual_end_date as "actualEndDate", estimated_hours as "estimatedHours",
        complexity, priority, status, position_id as "positionId", project_group_id as "projectGroupId", visibility,
        bounty_amount as "bountyAmount", bounty_algorithm_version as "bountyAlgorithmVersion",
        is_bounty_settled as "isBountySettled", publisher_id as "publisherId",
        assignee_id as "assigneeId", group_id as "groupId", progress, progress_locked as "progressLocked",
        aggregated_estimated_hours as "aggregatedEstimatedHours",
        aggregated_complexity as "aggregatedComplexity", updated_at as "updatedAt"
    `;

    const result = await pool.query(query, values);
    const updatedTask = result.rows[0];

    // Invalidate available tasks cache if update affects available tasks
    // (status, assignee, or visibility changes)
    if (
      updates.status !== undefined ||
      updates.assigneeId !== undefined ||
      updates.visibility !== undefined
    ) {
      try {
        await this.cacheService.deletePattern('available_tasks:*');
      } catch (error) {
        logger.warn('Failed to invalidate cache after task update', { error, taskId });
      }
    }

    // Trigger ranking update if task is completed (async with debouncing)
    // Uses a 2-second debounce to batch multiple completions together
    // This ensures rankings are updated quickly (within 2 seconds) while avoiding excessive calculations
    if (updates.status === TaskStatus.COMPLETED && task.status !== TaskStatus.COMPLETED) {
      rankingUpdateQueue.scheduleUpdate();
      logger.debug('Ranking update scheduled for task completion', { taskId });
    }

    // If task attributes that affect parent stats were updated, recalculate parent stats
    if (
      task.parentId &&
      (updates.estimatedHours !== undefined || updates.complexity !== undefined || updates.status !== undefined)
    ) {
      await this.aggregateParentTaskStats(task.parentId);
    }

    return updatedTask;
  }

  /**
   * Delete task
   */
  async deleteTask(taskId: string, userId: string): Promise<void> {
    const task = await this.getTask(taskId);
    if (!task) {
      throw new NotFoundError('Task not found');
    }

    // Check permission: only publisher can delete tasks in not_started or available status using OwnershipValidator
    await OwnershipValidator.validateTaskOwnership(taskId, userId);
    
    // Additional check: task must be in not_started or available status
    if (task.status !== TaskStatus.NOT_STARTED && task.status !== TaskStatus.AVAILABLE) {
      throw new AuthorizationError('Only tasks in not_started or available status can be deleted');
    }

    const query = 'DELETE FROM tasks WHERE id = $1';
    await pool.query(query, [taskId]);

    // Invalidate available tasks cache after successful task deletion
    try {
      await this.cacheService.deletePattern('available_tasks:*');
    } catch (error) {
      logger.warn('Failed to invalidate cache after task deletion', { error, taskId });
    }

    // If this was a subtask, update parent statistics
    if (task.parentId) {
      await this.aggregateParentTaskStats(task.parentId);
    }
  }

  /**
   * Get tasks by user (as publisher or assignee)
   */
  async getTasksByUser(userId: string, role: 'publisher' | 'assignee', onlyTopLevel: boolean = false): Promise<Task[]> {
    const parentCondition = onlyTopLevel ? 'AND t.parent_id IS NULL' : '';

    let query: string;
    
    if (role === 'publisher') {
      // For publisher: get all tasks where user is publisher
      query = `
        SELECT 
          t.id, t.name, t.description, t.parent_id as "parentId", t.depth, t.is_executable as "isExecutable",
          t.tags, t.created_at as "createdAt", t.planned_start_date as "plannedStartDate",
          t.planned_end_date as "plannedEndDate", t.actual_start_date as "actualStartDate",
          t.actual_end_date as "actualEndDate", t.estimated_hours as "estimatedHours",
          t.complexity, t.priority, t.status, t.progress, t.visibility,
          t.bounty_amount as "bountyAmount", t.bounty_algorithm_version as "bountyAlgorithmVersion",
          t.publisher_id as "publisherId", t.assignee_id as "assigneeId",
          t.project_group_id as "projectGroupId", t.group_id as "groupId",
          t.updated_at as "updatedAt",
          u_publisher.username as publisher_name,
          u_assignee.username as assignee_name,
          a_publisher.image_url as publisher_avatar_url,
          a_assignee.image_url as assignee_avatar_url,
          pg.name as "projectGroupName"
        FROM tasks t
        LEFT JOIN users u_publisher ON t.publisher_id = u_publisher.id
        LEFT JOIN users u_assignee ON t.assignee_id = u_assignee.id
        LEFT JOIN avatars a_publisher ON u_publisher.avatar_id = a_publisher.id
        LEFT JOIN avatars a_assignee ON u_assignee.avatar_id = a_assignee.id
        LEFT JOIN project_groups pg ON t.project_group_id = pg.id
        WHERE t.publisher_id = $1 ${parentCondition}
        ORDER BY t.created_at DESC
      `;
    } else {
      // For assignee: get tasks assigned to user AND their subtasks
      query = `
        WITH RECURSIVE task_tree AS (
          -- Get tasks directly assigned to the user
          SELECT 
            t.id, t.name, t.description, t.parent_id as "parentId", t.depth, t.is_executable as "isExecutable",
            t.tags, t.created_at as "createdAt", t.planned_start_date as "plannedStartDate",
            t.planned_end_date as "plannedEndDate", t.actual_start_date as "actualStartDate",
            t.actual_end_date as "actualEndDate", t.estimated_hours as "estimatedHours",
            t.complexity, t.priority, t.status, t.progress, t.visibility,
            t.bounty_amount as "bountyAmount", t.bounty_algorithm_version as "bountyAlgorithmVersion",
            t.publisher_id as "publisherId", t.assignee_id as "assigneeId",
            t.project_group_id as "projectGroupId", t.group_id as "groupId",
            t.updated_at as "updatedAt"
          FROM tasks t
          WHERE t.assignee_id = $1 ${parentCondition}
          
          UNION ALL
          
          -- Get all subtasks of assigned tasks
          SELECT 
            t.id, t.name, t.description, t.parent_id, t.depth, t.is_executable,
            t.tags, t.created_at, t.planned_start_date,
            t.planned_end_date, t.actual_start_date,
            t.actual_end_date, t.estimated_hours,
            t.complexity, t.priority, t.status, t.progress, t.visibility,
            t.bounty_amount, t.bounty_algorithm_version,
            t.publisher_id, t.assignee_id,
            t.project_group_id, t.group_id,
            t.updated_at
          FROM tasks t
          INNER JOIN task_tree tt ON t.parent_id = tt.id
        )
        SELECT DISTINCT
          tt.*,
          u_publisher.username as publisher_name,
          u_assignee.username as assignee_name,
          a_publisher.image_url as publisher_avatar_url,
          a_assignee.image_url as assignee_avatar_url,
          pg.name as "projectGroupName"
        FROM task_tree tt
        LEFT JOIN users u_publisher ON tt."publisherId" = u_publisher.id
        LEFT JOIN users u_assignee ON tt."assigneeId" = u_assignee.id
        LEFT JOIN avatars a_publisher ON u_publisher.avatar_id = a_publisher.id
        LEFT JOIN avatars a_assignee ON u_assignee.avatar_id = a_assignee.id
        LEFT JOIN project_groups pg ON tt."projectGroupId" = pg.id
        ORDER BY tt."createdAt" DESC
      `;
    }
    
    const result = await pool.query(query, [userId]);
    return this.mapTasksWithUsers(result.rows);
  }

  /**
   * Get subtasks of a task
   */
  @TaskCache(180) // 缓存3分钟
  @HandleError({ context: 'TaskService.getSubtasks' })
  async getSubtasks(parentId: string): Promise<Task[]> {
    return this.taskRepository.findSubtasks(parentId);
  }

  /**
   * Update bounty amount for all subtasks of a parent
   */
  async updateSubtasksBounty(parentId: string, amount: number): Promise<void> {
    const query = `
      UPDATE tasks 
      SET bounty_amount = $1 
      WHERE parent_id = $2
    `;
    await pool.query(query, [amount, parentId]);
  }

  /**
   * Validate task hierarchy depth
   * Returns true if adding a subtask to this parent would be valid
   */
  async validateTaskHierarchy(parentId: string): Promise<boolean> {
    const parent = await this.getTask(parentId);
    if (!parent) {
      return false;
    }

    // Check if parent depth is less than 2 (can add child at depth 2)
    return parent.depth < 2;
  }

  /**
   * Aggregate parent task statistics from all subtasks
   * Calculates total estimated hours, average complexity, and subtask counts
   */
  async aggregateParentTaskStats(parentId: string): Promise<TaskStats> {
    const query = `
      SELECT 
        COUNT(*) as total_subtasks,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_subtasks,
        SUM(estimated_hours) as total_estimated_hours,
        AVG(complexity) as average_complexity
      FROM tasks
      WHERE parent_id = $1
    `;

    const result = await pool.query(query, [parentId]);
    const stats = result.rows[0];

    const taskStats: TaskStats = {
      totalEstimatedHours: parseFloat(stats.total_estimated_hours) || 0,
      averageComplexity: parseFloat(stats.average_complexity) || 0,
      totalSubtasks: parseInt(stats.total_subtasks) || 0,
      completedSubtasks: parseInt(stats.completed_subtasks) || 0,
    };

    // Update parent task with aggregated statistics
    const updateQuery = `
      UPDATE tasks
      SET 
        aggregated_estimated_hours = $1,
        aggregated_complexity = $2,
        updated_at = NOW()
      WHERE id = $3
    `;

    await pool.query(updateQuery, [
      taskStats.totalEstimatedHours,
      taskStats.averageComplexity,
      parentId,
    ]);

    return taskStats;
  }

  /**
   * Add a subtask to a parent task
   * Convenience method that validates hierarchy and creates subtask
   * Validates:
   * - Parent exists and hierarchy is valid
   * - Subtask inherits parent's assignee
   * - Subtask time range is within parent's time range
   * - Subtask estimated hours don't exceed parent's estimated hours
   */
  async addSubtask(parentId: string, subtaskData: TaskCreateDTO): Promise<Task> {
    // Validate parent exists and hierarchy is valid
    const isValid = await this.validateTaskHierarchy(parentId);
    if (!isValid) {
      throw new ValidationError('Cannot add subtask: parent task not found or maximum depth exceeded');
    }

    // Get parent task to inherit properties and validate constraints
    const parent = await this.getTask(parentId);
    if (!parent) {
      throw new NotFoundError('Parent task not found');
    }

    // 1. Inherit assignee from parent (子任务的负责人继承母任务)
    const inheritedAssigneeId = parent.assigneeId || subtaskData.assigneeId;
    
    // 2. Validate time range (时间必须在一级任务的时间范围内)
    if (subtaskData.plannedStartDate && parent.plannedStartDate) {
      const subtaskStart = new Date(subtaskData.plannedStartDate);
      const parentStart = new Date(parent.plannedStartDate);
      
      if (subtaskStart < parentStart) {
        throw new ValidationError(
          `Subtask start date (${subtaskStart.toISOString()}) cannot be before parent start date (${parentStart.toISOString()})`
        );
      }
    }
    
    if (subtaskData.plannedEndDate && parent.plannedEndDate) {
      const subtaskEnd = new Date(subtaskData.plannedEndDate);
      const parentEnd = new Date(parent.plannedEndDate);
      
      if (subtaskEnd > parentEnd) {
        throw new ValidationError(
          `Subtask end date (${subtaskEnd.toISOString()}) cannot be after parent end date (${parentEnd.toISOString()})`
        );
      }
    }
    
    // 3. Validate estimated hours (预估工时也不能超过一级任务的预估工时)
    if (subtaskData.estimatedHours && parent.estimatedHours) {
      if (subtaskData.estimatedHours > parent.estimatedHours) {
        throw new ValidationError(
          `Subtask estimated hours (${subtaskData.estimatedHours}) cannot exceed parent estimated hours (${parent.estimatedHours})`
        );
      }
    }

    // Create subtask with parent reference and inherited properties
    return this.createTask({
      ...subtaskData,
      parentId,
      assigneeId: inheritedAssigneeId, // Inherit assignee from parent
    });
  }

  /**
   * Check if user can create a subtask for a parent task
   * NEW: Subtasks can be created by task creator OR parent task assignee
   * REQUIREMENT: Parent task must have an assignee before subtasks can be created
   */
  async canCreateSubtask(parentTaskId: string, userId: string): Promise<boolean> {
    const parentTask = await this.getTask(parentTaskId);
    if (!parentTask) return false;
    
    // NEW REQUIREMENT: Parent task must have an assignee
    if (!parentTask.assigneeId) return false;
    
    // Creator can create
    if (parentTask.publisherId === userId) return true;
    
    // Assignee can create (new rule)
    if (parentTask.assigneeId === userId) return true;
    
    return false;
  }

  /**
   * Check if user can publish a subtask
   * Only the parent task assignee can publish subtasks
   */
  async canPublishSubtask(subtaskId: string, userId: string): Promise<boolean> {
    const subtask = await this.getTask(subtaskId);
    if (!subtask || !subtask.parentId) return false;
    
    const parentTask = await this.getTask(subtask.parentId);
    if (!parentTask) return false;
    
    // Only parent task assignee can publish subtasks
    if (parentTask.assigneeId !== userId) return false;
    
    // Parent task must be accepted (have an assignee)
    if (!parentTask.assigneeId) return false;
    
    return true;
  }

  /**
   * Publish a subtask
   * Makes the subtask visible and sets bounty amount
   * Only parent task assignee can publish
   */
  async publishSubtask(
    subtaskId: string,
    userId: string,
    publishData: {
      visibility: Visibility;
      bountyAmount: number;
      positionId?: string;
    }
  ): Promise<Task> {
    // Verify permission
    const canPublish = await this.canPublishSubtask(subtaskId, userId);
    if (!canPublish) {
      throw new ValidationError('Only the parent task assignee can publish subtasks after the parent task is accepted');
    }

    // Validate bounty amount using Validator
    Validator.positive(publishData.bountyAmount, 'Bounty amount');

    // Get user to verify balance
    const userQuery = `
      SELECT balance FROM users WHERE id = $1
    `;
    const userResult = await pool.query(userQuery, [userId]);
    if (userResult.rows.length === 0) {
      throw new NotFoundError('User not found');
    }

    const userBalance = parseFloat(userResult.rows[0].balance);
    if (userBalance < publishData.bountyAmount) {
      throw new ValidationError(`Insufficient balance. Current balance: ${userBalance}, Required: ${publishData.bountyAmount}`);
    }

    // NEW REQUIREMENT: Publishing a subtask makes it available for others to accept
    // - Clear assignee (set to null)
    // - Set status to AVAILABLE
    // - Set visibility (usually PUBLIC)
    // - Mark as published
    const updatedTask = await this.updateTask(subtaskId, {
      assigneeId: null,  // Clear assignee so others can accept
      status: TaskStatus.AVAILABLE,  // Make it available for acceptance
      visibility: publishData.visibility,
      bountyAmount: publishData.bountyAmount,
      positionId: publishData.positionId,
      isPublished: true,
      publishedAt: new Date(),
      publishedBy: userId,
      progress: 0,  // Reset progress when publishing
    });

    return updatedTask;
  }

  /**
   * Assign a task to a user
   * Validates that all dependencies are resolved before allowing assignment
   */
  async assignTask(taskId: string, assigneeId: string): Promise<Task> {
    const task = await this.getTask(taskId);
    if (!task) {
      throw new NotFoundError('Task not found');
    }

    // Check if task is executable (leaf node)
    if (!task.isExecutable) {
      throw new ValidationError('Only executable tasks (leaf nodes) can be assigned');
    }

    // Check if task already has an assignee
    if (task.assigneeId) {
      throw new ValidationError('Task is already assigned');
    }

    // Check if all dependencies are resolved
    const dependenciesResolved = await this.dependencyService.areDependenciesResolved(taskId);
    if (!dependenciesResolved) {
      const unresolvedDeps = await this.dependencyService.getUnresolvedDependencies(taskId);
      throw new ValidationError(
        `Cannot assign task: unresolved dependencies exist. Complete these tasks first: ${unresolvedDeps.join(', ')}`
      );
    }

    // Assign the task
    const updatedTask = await this.updateTask(taskId, {
      assigneeId,
      status: TaskStatus.AVAILABLE,
    });

    // Invalidate available tasks cache after successful assignment
    try {
      await this.cacheService.deletePattern('available_tasks:*');
    } catch (error) {
      logger.warn('Failed to invalidate cache after task assignment', { error, taskId });
    }

    return updatedTask;
  }

  /**
   * Accept a task (user initiates assignment)
   * Requirements 5.2, 5.3, 5.4, 5.5:
   * - Validates position matching if task has position requirement
   * - Allows any user to accept tasks without position requirement
   * - Validates dependencies are resolved
   * - For subtasks: handles bounty payment from parent task assignee
   * - For parent tasks: updates all subtask assignees to the new parent assignee
   */
  async acceptTask(taskId: string, userId: string): Promise<Task> {
    const task = await this.getTask(taskId);
    if (!task) {
      throw new NotFoundError('Task not found');
    }

    // Check if task already has an assignee
    if (task.assigneeId) {
      throw new ValidationError('Task is already assigned');
    }

    // NEW: For subtasks, verify they are published
    if (task.parentId) {
      if (!task.isPublished || task.visibility === Visibility.PRIVATE) {
        throw new ValidationError('Subtask is not published and cannot be accepted');
      }
    }

    // Requirement: If task belongs to a group, only group members can accept it
    if (task.groupId) {
      const memberCheck = await pool.query(
        'SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2',
        [task.groupId, userId]
      );
      if (memberCheck.rows.length === 0) {
        throw new ValidationError('Only members of the group can accept this task');
      }
    }

    // Requirement 5.2 & 5.4: Validate position matching if task has position requirement
    if (task.positionId) {
      const hasPosition = await this.checkUserHasPosition(userId, task.positionId);
      if (!hasPosition) {
        throw new ValidationError('User does not have the required position for this task');
      }
    }
    // Requirement 5.3: Tasks without position requirement can be accepted by any user
    // (no additional check needed)

    // Check if all dependencies are resolved
    const dependenciesResolved = await this.dependencyService.areDependenciesResolved(taskId);
    if (!dependenciesResolved) {
      const unresolvedDeps = await this.dependencyService.getUnresolvedDependencies(taskId);
      throw new ValidationError(
        `Cannot accept task: unresolved dependencies exist. Complete these tasks first: ${unresolvedDeps.join(', ')}`
      );
    }

    // NEW: For subtasks, handle bounty payment from parent task assignee
    if (task.parentId && task.bountyAmount > 0) {
      const parentTask = await this.getTask(task.parentId);
      if (!parentTask) {
        throw new NotFoundError('Parent task not found');
      }

      const payerId = parentTask.assigneeId;
      if (!payerId) {
        throw new ValidationError('Parent task has no assignee to pay bounty');
      }

      // Verify payer balance
      const payerQuery = `SELECT balance FROM users WHERE id = $1`;
      const payerResult = await pool.query(payerQuery, [payerId]);
      if (payerResult.rows.length === 0) {
        throw new NotFoundError('Payer not found');
      }

      const payerBalance = parseFloat(payerResult.rows[0].balance);
      if (payerBalance < task.bountyAmount) {
        throw new ValidationError(`Parent task assignee has insufficient balance to pay bounty. Balance: ${payerBalance}, Required: ${task.bountyAmount}`);
      }

      // Execute transaction: deduct bounty from payer and lock it
      await this.transactionManager.executeInTransaction(async (client) => {
        // 1. Deduct bounty from payer's account
        await client.query(
          'UPDATE users SET balance = balance - $1 WHERE id = $2',
          [task.bountyAmount, payerId]
        );

        // 2. Lock bounty in bounty_transactions
        await client.query(
          `INSERT INTO bounty_transactions (task_id, from_user_id, to_user_id, amount, transaction_type, status)
           VALUES ($1, $2, $3, $4, 'task_completion', 'locked')`,
          [taskId, payerId, userId, task.bountyAmount]
        );

        // 3. Update task with bounty payer info and assign to user
        await client.query(
          `UPDATE tasks 
           SET assignee_id = $1, status = $2, bounty_payer_id = $3, updated_at = NOW()
           WHERE id = $4`,
          [userId, TaskStatus.IN_PROGRESS, payerId, taskId]
        );
      });

      // Invalidate cache
      try {
        await this.cacheService.deletePattern('available_tasks:*');
      } catch (error) {
        logger.warn('Failed to invalidate cache after task acceptance', { error, taskId });
      }

      // Return updated task
      return this.getTask(taskId) as Promise<Task>;
    }

    // Requirement 5.5: Update task status and assign to user (for non-subtasks or subtasks without bounty)
    const updatedTask = await this.updateTask(taskId, {
      assigneeId: userId,
      status: TaskStatus.IN_PROGRESS,
    });

    // NEW: If this is a parent task (has subtasks), update all subtask assignees
    const subtasks = await this.getSubtasks(taskId);
    if (subtasks.length > 0) {
      await this.transactionManager.executeInTransaction(async (client) => {
        // Update all subtasks' assignee to the new parent task assignee
        await client.query(
          `UPDATE tasks 
           SET assignee_id = $1, bounty_payer_id = $1, updated_at = NOW()
           WHERE parent_id = $2`,
          [userId, taskId]
        );
      });
    }

    // Invalidate available tasks cache after successful acceptance
    try {
      await this.cacheService.deletePattern('available_tasks:*');
    } catch (error) {
      logger.warn('Failed to invalidate cache after task acceptance', { error, taskId });
    }

    return updatedTask;
  }

  /**
   * Check if user has a specific position
   */
  private async checkUserHasPosition(userId: string, positionId: string): Promise<boolean> {
    const query = `
      SELECT EXISTS(
        SELECT 1 FROM user_positions
        WHERE user_id = $1 AND position_id = $2
      ) as has_position
    `;

    const result = await pool.query(query, [userId, positionId]);
    return result.rows[0].has_position;
  }

  /**
   * Complete a task and resolve downstream dependencies
   * Returns list of task IDs that became available due to dependency resolution
   * Requirement 27.5: Automatically lock progress when task is completed
   * 
   * Performance optimizations:
   * - Cache invalidation is async (fire-and-forget)
   * - Dependency resolution is async for tasks without dependencies
   * - Ranking updates are async (fire-and-forget)
   */
  @CacheEvict({
    keyGenerator: (taskId: string) => [`task:${taskId}`],
    patterns: ['available_tasks:*', 'visible_tasks:*', 'task_stats:*']
  })
  @HandleError({ context: 'TaskService.completeTask' })
  async completeTask(taskId: string, userId: string): Promise<string[]> {
    const task = await this.getTask(taskId);
    if (!task) {
      throw new NotFoundError('Task not found');
    }

    // Check permission: only assignee can complete tasks in in_progress status
    const canComplete = task.assigneeId === userId && task.status === TaskStatus.IN_PROGRESS;
    
    if (!canComplete) {
      throw new AuthorizationError('Only the assignee can complete tasks in in_progress status');
    }

    // Update task status to completed and set progress to 100%
    await this.updateTask(taskId, {
      status: TaskStatus.COMPLETED,
      progress: 100,
    });

    // Requirement 27.5: Lock progress after completion
    await this.lockProgress(taskId);

    // Distribute bounty and create transaction records
    // This should happen after task completion to ensure bounty is only distributed once
    try {
      if (!task.isBountySettled) {
        await this.bountyDistributionService.distributeBounty(taskId);
        logger.info('Bounty distributed successfully', { taskId, userId });
      }
    } catch (error) {
      // Log error but don't fail the task completion
      // Bounty distribution can be retried manually if needed
      logger.error('Failed to distribute bounty after task completion', { 
        error, 
        taskId, 
        userId,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Invalidate available tasks cache asynchronously (don't wait for it)
    // This improves response time significantly as Redis KEYS operation can be slow
    this.cacheService.deletePattern('available_tasks:*').catch(error => {
      logger.warn('Failed to invalidate cache after task completion', { error, taskId });
    });

    // Check if task has any dependent tasks
    const dependentTasks = await this.dependencyService.getDependentTasks(taskId);
    
    if (dependentTasks.length === 0) {
      // No dependencies - return immediately for fastest response
      // This is the common case for most tasks
      return [];
    }

    // Task has dependencies - resolve them
    // For tasks with dependencies, we need to wait to return the resolved task IDs
    const resolvedTaskIds = await this.dependencyService.resolveDownstreamDependencies(taskId);

    return resolvedTaskIds;
  }

  /**
   * Add a dependency to a task
   */
  async addDependency(taskId: string, dependsOnTaskId: string): Promise<void> {
    await this.dependencyService.addDependency({ taskId, dependsOnTaskId });
  }

  /**
   * Add bonus reward to a completed task (admin only)
   * Requirements: Admin can add extra bounty to reward exceptional work
   * 
   * @param taskId - Task ID
   * @param bonusAmount - Additional bounty amount
   * @param adminId - Admin user ID who is adding the bonus
   * @param reason - Optional reason for the bonus
   * @returns Updated task and transaction record
   */
  async addBonusReward(
    taskId: string, 
    bonusAmount: number, 
    adminId: string, 
    reason?: string
  ): Promise<{ task: Task; transaction: any }> {
    const task = await this.getTask(taskId);
    if (!task) {
      throw new NotFoundError('Task not found');
    }

    // Verify task is completed
    if (task.status !== TaskStatus.COMPLETED) {
      throw new ValidationError('Can only add bonus to completed tasks');
    }

    // Verify task has an assignee
    if (!task.assigneeId) {
      throw new ValidationError('Task must have an assignee to receive bonus');
    }

    // Check if this admin has already given a bonus for this task
    const existingBonusQuery = `
      SELECT id, created_at FROM bounty_transactions 
      WHERE task_id = $1 AND from_user_id = $2 AND type = 'extra_reward'
    `;
    const existingBonus = await pool.query(existingBonusQuery, [taskId, adminId]);
    
    if (existingBonus.rows.length > 0) {
      const existingDate = new Date(existingBonus.rows[0].created_at).toLocaleString();
      logger.warn('Duplicate bonus attempt blocked', {
        adminId,
        taskId,
        existingDate
      });
      throw new ValidationError(`You have already given a bonus reward for this task on ${existingDate}`);
    }

    // Also check if there are too many bonus rewards for this task (safety limit)
    const totalBonusQuery = `
      SELECT COUNT(*) as count FROM bounty_transactions 
      WHERE task_id = $1 AND type = 'extra_reward'
    `;
    const totalBonusResult = await pool.query(totalBonusQuery, [taskId]);
    const totalBonusCount = parseInt(totalBonusResult.rows[0].count);
    
    if (totalBonusCount >= 5) {
      logger.warn('Maximum bonus limit reached', {
        taskId,
        totalBonusCount
      });
      throw new ValidationError('This task has already received the maximum number of bonus rewards');
    }

    logger.info('Bonus validation passed', {
      adminId,
      taskId
    });

    // Update task bounty amount
    const newBountyAmount = Number(task.bountyAmount || 0) + bonusAmount;
    await this.updateTask(taskId, {
      bountyAmount: newBountyAmount,
    });

    // Create bounty transaction record for the bonus
    const transactionQuery = `
      INSERT INTO bounty_transactions (
        task_id, from_user_id, to_user_id, amount, type, description, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING *
    `;

    const description = reason 
      ? `额外奖赏: ${reason}` 
      : '额外奖赏';

    const transactionResult = await pool.query(transactionQuery, [
      taskId,
      adminId, // from_user_id is the admin who gives the bonus
      task.assigneeId, // to_user_id
      bonusAmount,
      'extra_reward', // type (must match the enum value)
      description,
      'completed', // status
    ]);

    // Update user balance
    const updateBalanceQuery = `
      UPDATE users 
      SET balance = balance + $1 
      WHERE id = $2
    `;
    await pool.query(updateBalanceQuery, [bonusAmount, task.assigneeId]);

    // Send notification to assignee
    await this.notificationService.createNotification({
      userId: task.assigneeId,
      type: NotificationType.BONUS_REWARD,
      title: '您收到了额外奖赏',
      message: `恭喜！您完成的任务"${task.name}"获得了 $${bonusAmount.toFixed(2)} 的额外奖赏${reason ? `：${reason}` : ''}`,
      relatedTaskId: taskId,
      senderId: adminId,
    });

    // Trigger ranking update asynchronously
    rankingUpdateQueue.scheduleUpdate();

    // Get updated task
    const updatedTask = await this.getTask(taskId);

    logger.info('Bonus reward added successfully', { 
      taskId, 
      assigneeId: task.assigneeId, 
      bonusAmount, 
      adminId,
      reason 
    });

    return {
      task: updatedTask!,
      transaction: transactionResult.rows[0],
    };
  }

  /**
   * Remove a dependency from a task
   */
  async removeDependency(taskId: string, dependsOnTaskId: string): Promise<void> {
    await this.dependencyService.removeDependency(taskId, dependsOnTaskId);
  }

  /**
   * Get bonus reward records for a task
   */
  async getBonusRewards(taskId: string): Promise<any[]> {
    const query = `
      SELECT 
        bt.*,
        u.username as admin_username,
        u.email as admin_email
      FROM bounty_transactions bt
      LEFT JOIN users u ON bt.from_user_id = u.id
      WHERE bt.task_id = $1 AND bt.type = 'extra_reward'
      ORDER BY bt.created_at DESC
    `;
    
    const result = await pool.query(query, [taskId]);
    return result.rows;
  }

  /**
   * Get all dependencies for a task
   */
  async getTaskDependencies(taskId: string) {
    return this.dependencyService.getTaskDependencies(taskId);
  }

  /**
   * Check if task dependencies are resolved
   */
  async areDependenciesResolved(taskId: string): Promise<boolean> {
    return this.dependencyService.areDependenciesResolved(taskId);
  }

  /**
   * Get visible tasks for a user based on visibility rules
   * Requirement 5.1: Filter tasks based on user and task visibility
   * 
   * Visibility rules:
   * - PUBLIC: visible to all users
   * - POSITION_ONLY: visible only to users with matching position
   * - PRIVATE: visible only to publisher and assignee
   */
  @Cache({ 
    ttl: 120, // 缓存2分钟
    prefix: 'visible_tasks',
    keyGenerator: (userId: string, userRole?: string) => `visible_tasks:${userId}:${userRole || 'hunter'}`
  })
  @HandleError({ context: 'TaskService.getVisibleTasks' })
  async getVisibleTasks(userId: string, userRole?: string): Promise<Task[]> {
    const query = `
      SELECT DISTINCT
        t.id, t.name, t.description, t.parent_id as "parentId", t.depth, t.is_executable as "isExecutable",
        t.tags, t.created_at as "createdAt", t.planned_start_date as "plannedStartDate",
        t.planned_end_date as "plannedEndDate", t.actual_start_date as "actualStartDate",
        t.actual_end_date as "actualEndDate", t.estimated_hours as "estimatedHours",
        t.complexity, t.priority, t.status, t.position_id as "positionId", t.visibility,
        t.bounty_amount as "bountyAmount", t.bounty_algorithm_version as "bountyAlgorithmVersion",
        t.is_bounty_settled as "isBountySettled", t.publisher_id as "publisherId",
        t.assignee_id as "assigneeId", t.group_id as "groupId", t.progress, t.progress_locked as "progressLocked",
        t.aggregated_estimated_hours as "aggregatedEstimatedHours",
        t.aggregated_complexity as "aggregatedComplexity", t.updated_at as "updatedAt",
        p.name as "positionName",
        tg.name as "groupName",
        t.project_group_id as "projectGroupId",
        pg.name as "projectGroupName"
      FROM tasks t
      LEFT JOIN user_positions up ON t.position_id = up.position_id AND up.user_id = $1
      LEFT JOIN positions p ON t.position_id = p.id
      LEFT JOIN task_groups tg ON t.group_id = tg.id
      LEFT JOIN project_groups pg ON t.project_group_id = pg.id
      WHERE 
        -- PUBLIC tasks are visible to everyone
        t.visibility = 'public'
        -- POSITION_ONLY tasks are visible to users with matching position
        OR (t.visibility = 'position_only' AND (up.position_id IS NOT NULL OR $2 = 'super_admin' OR $2 = 'position_admin'))
        -- PRIVATE tasks are visible to publisher and assignee
        OR (t.visibility = 'private' AND (t.publisher_id = $1 OR t.assignee_id = $1 OR $2 = 'super_admin'))
      ORDER BY t.created_at DESC
    `;

    const result = await pool.query(query, [userId, userRole]);
    return result.rows;
  }

  /**
   * Build ORDER BY clause for available tasks query
   * Supports sorting by bounty, deadline, priority, createdAt, updatedAt
   */
  private buildOrderByClause(sortBy?: string, sortOrder?: string): string {
    const order = sortOrder === 'asc' ? 'ASC' : 'DESC';
    
    switch (sortBy) {
      case 'bounty':
        return `ORDER BY t.bounty_amount ${order}, t.created_at DESC`;
      case 'deadline':
        return `ORDER BY t.planned_end_date ${order} NULLS LAST, t.created_at DESC`;
      case 'priority':
        return `ORDER BY t.priority ${order}, t.created_at DESC`;
      case 'updatedAt':
        return `ORDER BY t.updated_at ${order}`;
      case 'createdAt':
      default:
        return `ORDER BY t.created_at ${order}`;
    }
  }

  /**
   * Build search WHERE clause for available tasks query
   * Searches in task name, description, and tags
   */
  private buildSearchClause(searchKeyword?: string): { clause: string; param: string | null } {
    if (!searchKeyword || searchKeyword.trim() === '') {
      return { clause: '', param: null };
    }
    
    const searchPattern = `%${searchKeyword.trim()}%`;
    return {
      clause: `AND (
        t.name ILIKE $5
        OR t.description ILIKE $5
        OR EXISTS (
          SELECT 1 FROM unnest(t.tags) AS tag
          WHERE tag ILIKE $5
        )
      )`,
      param: searchPattern
    };
  }

  /**
   * Get available tasks for a user to accept
   * Filters for unassigned, executable tasks that are visible to the user
   * Supports pagination, dynamic sorting, and search for better UX
   */
  async getAvailableTasks(
    userId: string, 
    userRole?: string,
    pagination?: PaginationParams,
    sortBy?: string,
    sortOrder?: string,
    searchKeyword?: string
  ): Promise<Task[] | PaginatedResponse<Task>> {
    const startTime = Date.now();
    let cacheHit = false;
    
    // Set default pagination values
    const page = pagination?.page || 1;
    const pageSize = Math.min(pagination?.pageSize || 50, 100); // Max 100
    
    // Validate pagination parameters using Validator
    Validator.min(page, 1, 'Page');
    Validator.range(pageSize, 1, 100, 'Page size');
    
    // Build cache key (include sort and search params)
    const cacheKey = `available_tasks:${userId}:${userRole || 'hunter'}:${page}:${pageSize}:${sortBy || 'createdAt'}:${sortOrder || 'desc'}:${searchKeyword || ''}`;
    
    // Try cache first (with circuit breaker)
    if (this.cacheService.isAvailable()) {
      try {
        const cached = await this.cacheService.get<Task[] | PaginatedResponse<Task>>(cacheKey);
        if (cached) {
          cacheHit = true;
          const duration = Date.now() - startTime;
          
          // Log cache hit metrics
          performanceMonitor.logMetrics({
            operation: 'getAvailableTasks',
            duration,
            cacheHit: true,
            resultCount: Array.isArray(cached) ? cached.length : cached.data.length,
            timestamp: new Date(),
          });
          
          return cached;
        }
      } catch (error) {
        // Log cache error but continue with database query
        logger.warn('Cache lookup failed, falling back to database', { error, cacheKey });
      }
    }
    
    const offset = (page - 1) * pageSize;
    
    // Build dynamic ORDER BY clause
    const orderByClause = this.buildOrderByClause(sortBy, sortOrder);
    
    // Build search clause
    const searchClause = this.buildSearchClause(searchKeyword);
    
    const query = `
      SELECT
        t.id, t.name, t.description, t.parent_id as "parentId", t.depth, t.is_executable as "isExecutable",
        t.tags, t.created_at as "createdAt", t.planned_start_date as "plannedStartDate",
        t.planned_end_date as "plannedEndDate", t.actual_start_date as "actualStartDate",
        t.actual_end_date as "actualEndDate", t.estimated_hours as "estimatedHours",
        t.complexity, t.priority, t.status, t.position_id as "positionId", t.visibility,
        t.bounty_amount as "bountyAmount", t.bounty_algorithm_version as "bountyAlgorithmVersion",
        t.is_bounty_settled as "isBountySettled", t.publisher_id as "publisherId",
        t.assignee_id as "assigneeId", t.group_id as "groupId", t.progress, t.progress_locked as "progressLocked",
        t.aggregated_estimated_hours as "aggregatedEstimatedHours",
        t.aggregated_complexity as "aggregatedComplexity", t.updated_at as "updatedAt",
        p.name as "positionName",
        u.id as "publisher.id", u.username as "publisher.username", u.email as "publisher.email",
        u.avatar_id as "publisher.avatarId", u.role as "publisher.role", u.created_at as "publisher.createdAt",
        u.last_login as "publisher.lastLogin",
        a.image_url as "publisher.avatarUrl",
        tg.name as "groupName",
        t.project_group_id as "projectGroupId",
        pg.name as "projectGroupName"
      FROM tasks t
      LEFT JOIN user_positions up ON t.position_id = up.position_id AND up.user_id = $1
      LEFT JOIN users u ON u.id = t.publisher_id
      LEFT JOIN avatars a ON u.avatar_id = a.id
      LEFT JOIN positions p ON t.position_id = p.id
      LEFT JOIN task_groups tg ON t.group_id = tg.id
      LEFT JOIN project_groups pg ON t.project_group_id = pg.id
      WHERE 
        t.assignee_id IS NULL
        AND t.status = 'available'
        AND (
          t.visibility = 'public'
          OR (t.visibility = 'position_only' AND (up.position_id IS NOT NULL OR $2 = 'super_admin' OR $2 = 'position_admin'))
          OR (t.visibility = 'private' AND (t.publisher_id = $1 OR $2 = 'super_admin'))
        )
        ${searchClause.clause}
      ${orderByClause}
      LIMIT $3 OFFSET $4
    `;

    const queryParams = searchClause.param 
      ? [userId, userRole, pageSize, offset, searchClause.param]
      : [userId, userRole, pageSize, offset];

    const result = await pool.query(query, queryParams);
    const tasks = this.mapTasksWithUsers(result.rows);
    
    let response: Task[] | PaginatedResponse<Task>;
    
    // If pagination was requested, return paginated response
    if (pagination) {
      // Get total count for pagination metadata
      const countQuery = `
        SELECT COUNT(t.id) as total
        FROM tasks t
        LEFT JOIN user_positions up ON t.position_id = up.position_id AND up.user_id = $1
        WHERE 
          t.assignee_id IS NULL
          AND t.status = 'available'
          AND (
            t.visibility = 'public'
            OR (t.visibility = 'position_only' AND (up.position_id IS NOT NULL OR $2 = 'super_admin' OR $2 = 'position_admin'))
            OR (t.visibility = 'private' AND (t.publisher_id = $1 OR $2 = 'super_admin'))
          )
          ${searchClause.clause}
      `;
      
      const countParams = searchClause.param 
        ? [userId, userRole, searchClause.param]
        : [userId, userRole];
      
      const countResult = await pool.query(countQuery, countParams);
      const totalItems = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(totalItems / pageSize);
      
      response = {
        data: tasks,
        pagination: {
          currentPage: page,
          pageSize,
          totalItems,
          totalPages
        }
      };
    } else {
      // Non-paginated request - return array directly for backward compatibility
      response = tasks;
    }
    
    // Cache result (best effort, don't fail on cache errors)
    if (this.cacheService.isAvailable()) {
      try {
        await this.cacheService.set(cacheKey, response, 60); // 60 seconds TTL
      } catch (error) {
        logger.warn('Failed to cache result', { error, cacheKey });
      }
    }
    
    const duration = Date.now() - startTime;
    
    // Log cache miss metrics
    performanceMonitor.logMetrics({
      operation: 'getAvailableTasks',
      duration,
      cacheHit: false,
      resultCount: Array.isArray(response) ? response.length : response.data.length,
      timestamp: new Date(),
    });
    
    return response;
  }

  /**
   * Transfer a task to another user
   * Requirement 11.2, 11.3: Validate receiver's position qualification and update assignee
   * 
   * @param taskId - ID of the task to transfer
   * @param currentUserId - ID of the current assignee
   * @param newUserId - ID of the user receiving the task
   * @returns Updated task and both user IDs for notification
   */
  async transferTask(
    taskId: string,
    currentUserId: string,
    newUserId: string
  ): Promise<{ task: Task; currentUserId: string; newUserId: string; publisherId: string }> {
    const task = await this.getTask(taskId);
    if (!task) {
      throw new NotFoundError('Task not found');
    }

    // Verify the current user is the assignee
    if (task.assigneeId !== currentUserId) {
      throw new ValidationError('Only the assigned user can transfer this task');
    }

    // Cannot transfer completed tasks
    if (task.status === TaskStatus.COMPLETED) {
      throw new ValidationError('Cannot transfer a completed task');
    }

    // Requirement 11.2: Validate receiver has required position if task has position requirement
    if (task.positionId) {
      const hasPosition = await this.checkUserHasPosition(newUserId, task.positionId);
      if (!hasPosition) {
        throw new ValidationError('Receiver does not have the required position for this task');
      }
    }

    // Requirement 11.3: Update task assignee
    const updatedTask = await this.updateTask(taskId, {
      assigneeId: newUserId,
    });

    // Invalidate available tasks cache after successful transfer
    try {
      await this.cacheService.deletePattern('available_tasks:*');
    } catch (error) {
      logger.warn('Failed to invalidate cache after task transfer', { error, taskId });
    }

    // Return task and user IDs for notification
    return {
      task: updatedTask,
      currentUserId,
      newUserId,
      publisherId: task.publisherId,
    };
  }

  /**
   * Get all tasks (for super admin)
   * Requirements: 16.2
   */
  async getAllTasks(): Promise<Task[]> {
    const query = `
      SELECT 
        t.id, t.name, t.description, t.parent_id as "parentId", t.depth, t.is_executable as "isExecutable",
        t.tags, t.created_at as "createdAt", t.planned_start_date as "plannedStartDate",
        t.planned_end_date as "plannedEndDate", t.actual_start_date as "actualStartDate",
        t.actual_end_date as "actualEndDate", t.estimated_hours as "estimatedHours",
        t.complexity, t.priority, t.status, t.progress, t.visibility,
        t.bounty_amount as "bountyAmount", t.bounty_algorithm_version as "bountyAlgorithmVersion",
        t.publisher_id as "publisherId", t.assignee_id as "assigneeId",
        t.project_group_id as "projectGroupId", t.group_id as "groupId",
        t.updated_at as "updatedAt",
        p.id as "publisher.id", p.username as "publisher.username", p.email as "publisher.email",
        p.avatar_id as "publisher.avatarId", p.role as "publisher.role",
        p.created_at as "publisher.createdAt", p.last_login as "publisher.lastLogin",
        pa.image_url as "publisher.avatarUrl",
        a.id as "assignee.id", a.username as "assignee.username", a.email as "assignee.email",
        a.avatar_id as "assignee.avatarId", a.role as "assignee.role",
        a.created_at as "assignee.createdAt", a.last_login as "assignee.lastLogin",
        aa.image_url as "assignee.avatarUrl",
        pg.name as "projectGroupName"
      FROM tasks t
      LEFT JOIN users p ON t.publisher_id = p.id
      LEFT JOIN avatars pa ON p.avatar_id = pa.id
      LEFT JOIN users a ON t.assignee_id = a.id
      LEFT JOIN avatars aa ON a.avatar_id = aa.id
      LEFT JOIN project_groups pg ON t.project_group_id = pg.id
      ORDER BY t.created_at DESC
    `;

    const result = await pool.query(query);
    return this.mapTasksWithUsers(result.rows);
  }

  /**
   * Get tasks by position IDs (for position admin)
   * Requirements: 16.1
   */
  async getTasksByPositions(positionIds: string[]): Promise<Task[]> {
    if (positionIds.length === 0) {
      return [];
    }

    const query = `
      SELECT 
        t.id, t.name, t.description, t.parent_id as "parentId", t.depth, t.is_executable as "isExecutable",
        t.tags, t.created_at as "createdAt", t.planned_start_date as "plannedStartDate",
        t.planned_end_date as "plannedEndDate", t.actual_start_date as "actualStartDate",
        t.actual_end_date as "actualEndDate", t.estimated_hours as "estimatedHours",
        t.complexity, t.priority, t.status, t.position_id as "positionId", t.visibility,
        t.bounty_amount as "bountyAmount", t.bounty_algorithm_version as "bountyAlgorithmVersion",
        t.is_bounty_settled as "isBountySettled", t.publisher_id as "publisherId",
        t.assignee_id as "assigneeId", t.group_id as "groupId", t.progress, t.progress_locked as "progressLocked",
        t.aggregated_estimated_hours as "aggregatedEstimatedHours",
        t.aggregated_complexity as "aggregatedComplexity", t.updated_at as "updatedAt",
        p.id as "publisher.id", p.username as "publisher.username", p.email as "publisher.email",
        p.avatar_id as "publisher.avatarId", p.role as "publisher.role",
        p.created_at as "publisher.createdAt", p.last_login as "publisher.lastLogin",
        pa.image_url as "publisher.avatarUrl",
        a.id as "assignee.id", a.username as "assignee.username", a.email as "assignee.email",
        a.avatar_id as "assignee.avatarId", a.role as "assignee.role",
        a.created_at as "assignee.createdAt", a.last_login as "assignee.lastLogin",
        aa.image_url as "assignee.avatarUrl"
      FROM tasks t
      LEFT JOIN users p ON t.publisher_id = p.id
      LEFT JOIN avatars pa ON p.avatar_id = pa.id
      LEFT JOIN users a ON t.assignee_id = a.id
      LEFT JOIN avatars aa ON a.avatar_id = aa.id
      WHERE t.position_id = ANY($1)
      ORDER BY t.created_at DESC
    `;

    const result = await pool.query(query, [positionIds]);
    return this.mapTasksWithUsers(result.rows);
  }

  /**
   * Update task progress
   * Requirement 27.1: Validate progress range (0-100)
   * Requirement 27.4: Generate completion prompt when progress reaches 100%
   * Requirement 27.5: Lock progress after task completion
   * 
   * @param taskId - ID of the task to update
   * @param progress - Progress percentage (0-100)
   * @returns Updated task and completion prompt flag
   */
  async updateProgress(taskId: string, progress: number): Promise<{ task: Task; completionPrompt: boolean }> {
    // Requirement 27.1: Validate progress range (0-100) using Validator
    Validator.range(progress, 0, 100, 'Progress');

    const task = await this.getTask(taskId);
    if (!task) {
      throw new NotFoundError('Task not found');
    }

    // Requirement 27.5: Cannot update progress if locked (task completed)
    if (task.progressLocked) {
      throw new ValidationError('Progress is locked for completed tasks');
    }

    // Update progress
    const updatedTask = await this.updateTask(taskId, { progress });

    // Requirement 27.4: Generate completion prompt when progress reaches 100%
    const completionPrompt = progress === 100;

    // Requirement 27.2: If this is a subtask, update parent task progress
    if (task.parentId) {
      await this.aggregateParentProgress(task.parentId);
    }

    return {
      task: updatedTask,
      completionPrompt,
    };
  }

  /**
   * Aggregate parent task progress from all subtasks
   * Requirement 27.2: Calculate parent progress based on subtask progress
   * 
   * @param parentId - ID of the parent task
   * @returns Aggregated progress percentage
   */
  async aggregateParentProgress(parentId: string): Promise<number> {
    const query = `
      SELECT 
        AVG(progress) as average_progress
      FROM tasks
      WHERE parent_id = $1
    `;

    const result = await pool.query(query, [parentId]);
    const averageProgress = parseFloat(result.rows[0].average_progress) || 0;

    // Round to nearest integer
    const roundedProgress = Math.round(averageProgress);

    // Update parent task progress
    const updateQuery = `
      UPDATE tasks
      SET 
        progress = $1,
        updated_at = NOW()
      WHERE id = $2
    `;

    await pool.query(updateQuery, [roundedProgress, parentId]);

    // Recursively update grandparent if exists
    const parentTask = await this.getTask(parentId);
    if (parentTask && parentTask.parentId) {
      await this.aggregateParentProgress(parentTask.parentId);
    }

    return roundedProgress;
  }

  /**
   * Lock task progress after completion
   * Requirement 27.5: Lock progress when task is completed
   * 
   * @param taskId - ID of the task to lock
   */
  async lockProgress(taskId: string): Promise<Task> {
    const task = await this.getTask(taskId);
    if (!task) {
      throw new NotFoundError('Task not found');
    }

    // Only lock if task is completed
    if (task.status !== TaskStatus.COMPLETED) {
      throw new ValidationError('Can only lock progress for completed tasks');
    }

    const query = `
      UPDATE tasks
      SET 
        progress_locked = TRUE,
        updated_at = NOW()
      WHERE id = $1
      RETURNING 
        id, name, description, parent_id as "parentId", depth, is_executable as "isExecutable",
        tags, created_at as "createdAt", planned_start_date as "plannedStartDate",
        planned_end_date as "plannedEndDate", actual_start_date as "actualStartDate",
        actual_end_date as "actualEndDate", estimated_hours as "estimatedHours",
        complexity, priority, status, position_id as "positionId", visibility,
        bounty_amount as "bountyAmount", bounty_algorithm_version as "bountyAlgorithmVersion",
        is_bounty_settled as "isBountySettled", publisher_id as "publisherId",
        assignee_id as "assigneeId", group_id as "groupId", progress, progress_locked as "progressLocked",
        aggregated_estimated_hours as "aggregatedEstimatedHours",
        aggregated_complexity as "aggregatedComplexity", updated_at as "updatedAt"
    `;

    const result = await pool.query(query, [taskId]);
    return result.rows[0];
  }

  /**
   * Assign an existing task to a user
   * Only the publisher can assign the task
   */
  async assignTaskToUser(taskId: string, publisherId: string, invitedUserId: string): Promise<Task> {
    const task = await this.getTask(taskId);
    if (!task) {
      throw new NotFoundError('Task not found');
    }

    // Verify permission: only publisher can assign using OwnershipValidator
    await OwnershipValidator.validateTaskOwnership(taskId, publisherId);

    // Verify task is not already assigned
    if (task.assigneeId) {
      throw new ValidationError('Task is already assigned');
    }

    // Verify task status is appropriate for assignment
    if (task.status !== TaskStatus.NOT_STARTED && task.status !== TaskStatus.AVAILABLE) {
      throw new ValidationError('Task cannot be assigned in its current status');
    }

    // Cannot invite yourself
    if (invitedUserId === publisherId) {
      throw new ValidationError('Cannot invite yourself');
    }

    // Verify invited user exists
    const invitedUser = await this.userRepository.findById(invitedUserId);
    if (!invitedUser) {
      throw new NotFoundError('Invited user not found');
    }

    // Update task with invitation
    const updatedTask = await this.updateTask(taskId, {
      invitedUserId,
      invitationStatus: InvitationStatus.PENDING,
      status: TaskStatus.PENDING_ACCEPTANCE,
      visibility: Visibility.PRIVATE, // Make task private when assigned to specific user
    });

    // Send notification to invited user
    await this.notificationService.createNotification({
      userId: invitedUserId,
      type: NotificationType.TASK_ASSIGNMENT_INVITATION,
      title: '您收到了一个任务指派',
      message: `${task.publisher?.username || '某用户'} 邀请您承接任务 "${task.name}"`,
      relatedTaskId: task.id,
      senderId: publisherId,
    });

    return updatedTask;
  }

  /**
   * Accept task assignment invitation
   * Only the invited user can accept the task
   */
  async acceptTaskAssignment(taskId: string, userId: string): Promise<Task> {
    const task = await this.getTask(taskId);
    if (!task) {
      throw new NotFoundError('Task not found');
    }

    // Verify permission: only invited user can accept
    if (task.invitedUserId !== userId) {
      throw new ValidationError('You are not invited to this task');
    }

    // Verify status
    if (task.status !== TaskStatus.PENDING_ACCEPTANCE) {
      throw new ValidationError('Task is not in pending acceptance status');
    }

    // Update task status
    const updatedTask = await this.updateTask(taskId, {
      status: TaskStatus.IN_PROGRESS,
      assigneeId: userId,
      invitationStatus: InvitationStatus.ACCEPTED,
      actualStartDate: new Date(),
    });

    // Send notification to publisher
    await this.notificationService.createNotification({
      userId: task.publisherId,
      type: NotificationType.TASK_ASSIGNMENT_ACCEPTED,
      title: '任务指派已接受',
      message: `${updatedTask.assignee?.username || '某用户'} 已接受您的任务指派 "${task.name}"`,
      relatedTaskId: task.id,
      senderId: userId,
    });

    return updatedTask;
  }

  /**
   * Reject task assignment invitation
   * Only the invited user can reject the task
   */
  async rejectTaskAssignment(taskId: string, userId: string, reason?: string): Promise<Task> {
    const task = await this.getTask(taskId);
    if (!task) {
      throw new NotFoundError('Task not found');
    }

    // Verify permission: only invited user can reject
    if (task.invitedUserId !== userId) {
      throw new ValidationError('You are not invited to this task');
    }

    // Verify status
    if (task.status !== TaskStatus.PENDING_ACCEPTANCE) {
      throw new ValidationError('Task is not in pending acceptance status');
    }

    // Get invited user info for notification
    const invitedUser = await this.userRepository.findById(userId);

    // Update task status
    const updatedTask = await this.updateTask(taskId, {
      status: TaskStatus.AVAILABLE,  // Make available for others
      invitationStatus: InvitationStatus.REJECTED,
      invitedUserId: null,  // Clear invited user
    });

    // Send notification to publisher
    const reasonText = reason ? `\n拒绝原因：${reason}` : '';
    await this.notificationService.createNotification({
      userId: task.publisherId,
      type: NotificationType.TASK_ASSIGNMENT_REJECTED,
      title: '任务指派已拒绝',
      message: `${invitedUser?.username || '某用户'} 拒绝了您的任务指派 "${task.name}"${reasonText}`,
      relatedTaskId: task.id,
      senderId: userId,
    });

    return updatedTask;
  }

  /**
   * Get task invitations for a user
   * Returns tasks where user is invited and status is PENDING_ACCEPTANCE
   */
  async getTaskInvitations(userId: string): Promise<Task[]> {
    const query = `
      SELECT 
        t.id, t.name, t.description, t.parent_id as "parentId", t.depth, t.is_executable as "isExecutable",
        t.tags, t.created_at as "createdAt", t.planned_start_date as "plannedStartDate",
        t.planned_end_date as "plannedEndDate", t.actual_start_date as "actualStartDate",
        t.actual_end_date as "actualEndDate", t.estimated_hours as "estimatedHours",
        t.complexity, t.priority, t.status, t.position_id as "positionId", t.visibility,
        t.bounty_amount as "bountyAmount", t.bounty_algorithm_version as "bountyAlgorithmVersion",
        t.is_bounty_settled as "isBountySettled", t.publisher_id as "publisherId",
        t.assignee_id as "assigneeId", t.group_id as "groupId", t.progress, t.progress_locked as "progressLocked",
        t.aggregated_estimated_hours as "aggregatedEstimatedHours",
        t.aggregated_complexity as "aggregatedComplexity", t.updated_at as "updatedAt",
        t.invited_user_id as "invitedUserId", t.invitation_status as "invitationStatus",
        u.id as "publisher.id", u.username as "publisher.username", u.email as "publisher.email",
        u.avatar_id as "publisher.avatarId", u.role as "publisher.role", u.created_at as "publisher.createdAt",
        u.last_login as "publisher.lastLogin",
        a.image_url as "publisher.avatarUrl"
      FROM tasks t
      LEFT JOIN users u ON u.id = t.publisher_id
      LEFT JOIN avatars a ON u.avatar_id = a.id
      WHERE t.invited_user_id = $1
        AND t.status = 'pending_acceptance'
      ORDER BY t.created_at DESC
    `;

    const result = await pool.query(query, [userId]);
    return this.mapTasksWithUsers(result.rows);
  }
  /**
   * Get task statistics for a user
   * Returns aggregated statistics for published and assigned tasks
   */
  @Cache({ 
    ttl: 600, // 缓存10分钟
    prefix: 'task_stats',
    keyGenerator: (userId: string) => `task_stats:${userId}`
  })
  @HandleError({ context: 'TaskService.getTaskStats' })
  async getTaskStats(userId: string): Promise<{
    publishedTotal: number;
    publishedNotStarted: number;
    publishedInProgress: number;
    publishedCompleted: number;
    assignedTotal: number;
    assignedInProgress: number;
    assignedCompleted: number;
    totalBountyEarned: number;
  }> {
    const query = `
      WITH published_stats AS (
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'not_started' THEN 1 END) as not_started,
          COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed
        FROM tasks 
        WHERE publisher_id = $1
      ),
      assigned_stats AS (
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
          COALESCE(SUM(CASE WHEN status = 'completed' THEN bounty_amount ELSE 0 END), 0) as total_bounty_earned
        FROM tasks 
        WHERE assignee_id = $1
      )
      SELECT 
        p.total as published_total,
        p.not_started as published_not_started,
        p.in_progress as published_in_progress,
        p.completed as published_completed,
        a.total as assigned_total,
        a.in_progress as assigned_in_progress,
        a.completed as assigned_completed,
        a.total_bounty_earned
      FROM published_stats p, assigned_stats a
    `;

    const result = await pool.query(query, [userId]);
    const row = result.rows[0];

    return {
      publishedTotal: parseInt(row.published_total) || 0,
      publishedNotStarted: parseInt(row.published_not_started) || 0,
      publishedInProgress: parseInt(row.published_in_progress) || 0,
      publishedCompleted: parseInt(row.published_completed) || 0,
      assignedTotal: parseInt(row.assigned_total) || 0,
      assignedInProgress: parseInt(row.assigned_in_progress) || 0,
      assignedCompleted: parseInt(row.assigned_completed) || 0,
      totalBountyEarned: parseFloat(row.total_bounty_earned) || 0,
    };
  }

}
