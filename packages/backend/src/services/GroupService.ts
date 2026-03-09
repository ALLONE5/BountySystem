import { pool } from '../config/database.js';
import { TaskGroup, TaskGroupCreateDTO, TaskGroupWithMembers, GroupMember, GroupMemberDetail } from '../models/TaskGroup.js';
import { ValidationError, NotFoundError, AuthorizationError } from '../utils/errors.js';
import { NotificationService } from './NotificationService.js';
import { BountyService } from './BountyService.js';
import { NotificationType } from '../models/Notification.js';
import { GroupRepository, IGroupRepository } from '../repositories/GroupRepository.js';
import { PermissionChecker } from '../utils/PermissionChecker.js';
import { GroupMapper } from '../utils/mappers/GroupMapper.js';
import { Validator } from '../utils/Validator.js';
import { OwnershipValidator } from '../utils/OwnershipValidator.js';
import { Cache, CacheEvict } from '../utils/decorators/cache.js';
import { logger } from '../config/logger.js';
import { UserResponse } from '../models/User.js';
import { Task } from '../models/Task.js';

export interface GroupBountyDistribution {
  taskId: string;
  groupId: string;
  totalBounty: number;
  memberDistributions: Array<{
    userId: string;
    amount: number;
  }>;
  transactionIds: string[];
}

export class GroupService {
  private notificationService: NotificationService;
  private bountyService: BountyService;
  private groupRepository: IGroupRepository;
  private permissionChecker: PermissionChecker;

  constructor(
    groupRepository: IGroupRepository,
    permissionChecker: PermissionChecker
  ) {
    this.groupRepository = groupRepository;
    this.permissionChecker = permissionChecker;
    this.notificationService = new NotificationService();
    this.bountyService = new BountyService();
  }

  /**
   * Create a new task group
   * Requirement 7.1: Allow users to create task groups
   */
  async createGroup(groupData: TaskGroupCreateDTO): Promise<any> {
    const { name, creatorId } = groupData;

    // Create group using repository (provide data in snake_case for database)
    const group = await this.groupRepository.create({
      name,
      creator_id: creatorId, // Use snake_case for database column
    } as any);

    // Automatically add creator as a member
    await this.groupRepository.addMember(group.id, creatorId);

    return GroupMapper.toDTO(group);
  }

  /**
   * Get a task group by ID
   */
  async getGroup(groupId: string): Promise<any | null> {
    const group = await this.groupRepository.findById(groupId);
    return group ? GroupMapper.toDTO(group) : null;
  }

  /**
   * Get a task group with its members
   */
  async getGroupWithMembers(groupId: string): Promise<any | null> {
    const groupWithMembers = await this.groupRepository.findWithMembers(groupId);
    return groupWithMembers ? GroupMapper.toWithMembersDTO(groupWithMembers) : null;
  }

  /**
   * Get all task groups (Admin only)
   */
  async getAllGroups(): Promise<any[]> {
    const query = `
      SELECT 
        g.id, 
        g.name, 
        g.creator_id as "creatorId", 
        g.created_at as "createdAt",
        g.updated_at as "updatedAt",
        u.username as "creatorName",
        a.image_url as "creatorAvatarUrl"
      FROM task_groups g
      LEFT JOIN users u ON g.creator_id = u.id
      LEFT JOIN avatars a ON u.avatar_id = a.id
      ORDER BY g.created_at DESC
    `;

    const result = await pool.query(query);
    return result.rows.map(row => GroupMapper.toDTO(row));
  }

  /**
   * Delete (dissolve) a task group as admin (bypasses creator check)
   * Cannot delete if group has completed tasks
   */
  async deleteGroupAsAdmin(groupId: string): Promise<void> {
    const group = await this.groupRepository.findById(groupId);
    if (!group) {
      throw new NotFoundError('Task group not found');
    }

    // Check if group has any completed tasks
    const completedTasksQuery = `
      SELECT COUNT(*) as count
      FROM tasks
      WHERE group_id = $1 AND status = 'completed'
    `;
    const result = await pool.query(completedTasksQuery, [groupId]);
    const completedTasksCount = parseInt(result.rows[0].count, 10);

    if (completedTasksCount > 0) {
      throw new ValidationError('无法解散组群：组群中存在已完成的任务');
    }

    await this.groupRepository.delete(groupId);
  }

  /**
   * Add a member to a task group
   * Requirement 7.1: Allow inviting users to join groups
   */
  async addMember(groupId: string, userId: string): Promise<any> {
    const member = await this.groupRepository.addMember(groupId, userId);
    return GroupMapper.mapMemberToDTO(member);
  }

  /**
   * Remove a member from a task group
   * Requirement 7.4: Allow users to leave groups
   */
  async removeMember(groupId: string, userId: string): Promise<void> {
    const group = await this.groupRepository.findById(groupId);
    if (!group) {
      throw new NotFoundError('Task group not found');
    }

    // Prevent removing the creator if they are the only member using Validator
    const members = await this.groupRepository.getGroupMembers(groupId);
    Validator.custom(
      members.length === 1 && group.creatorId === userId,
      (shouldPrevent) => !shouldPrevent,
      'Member removal',
      'Cannot remove the creator when they are the only member. Delete the group instead.'
    );

    await this.groupRepository.removeMember(groupId, userId);
  }

  /**
   * Get all members of a task group
   */
  @Cache({ ttl: 180, prefix: 'group_members', keyGenerator: (groupId: string) => `group_members:${groupId}` })

  async getGroupMembers(groupId: string): Promise<any[]> {
    const members = await this.groupRepository.getGroupMembers(groupId);
    return GroupMapper.mapMembersToDTOList(members);
  }

  /**
   * Check if a user is a member of a group
   */
  async isMember(groupId: string, userId: string): Promise<boolean> {
    return await this.groupRepository.isMember(groupId, userId);
  }

  /**
   * Get all groups a user is a member of
   */
  async getUserGroups(userId: string): Promise<any[]> {
    // Query groups with creator information
    const query = `
      SELECT 
        g.id, 
        g.name, 
        g.creator_id as "creatorId", 
        g.created_at as "createdAt",
        g.updated_at as "updatedAt",
        u.username as "creatorName",
        a.image_url as "creatorAvatarUrl"
      FROM task_groups g
      INNER JOIN group_members gm ON g.id = gm.group_id
      LEFT JOIN users u ON g.creator_id = u.id
      LEFT JOIN avatars a ON u.avatar_id = a.id
      WHERE gm.user_id = $1
      ORDER BY g.created_at DESC
    `;

    const result = await pool.query(query, [userId]);
    const groups = result.rows;

    // Fetch members for each group
    const groupsWithMembers = await Promise.all(
      groups.map(async (group) => {
        const members = await this.groupRepository.getGroupMembers(group.id);
        return {
          ...group,
          memberIds: members.map(m => m.userId),
          members,
        };
      })
    );

    return GroupMapper.toWithMembersDTOList(groupsWithMembers);
  }

  /**
   * Delete (dissolve) a task group
   * Only the creator can delete the group
   * Cannot delete if group has completed tasks
   */
  async deleteGroup(groupId: string, userId: string): Promise<void> {
    const group = await this.groupRepository.findById(groupId);
    if (!group) {
      throw new NotFoundError('Task group not found');
    }

    // Verify user is the creator using OwnershipValidator
    await OwnershipValidator.validateGroupOwnership(groupId, userId);

    // Check if group has any completed tasks
    const completedTasksQuery = `
      SELECT COUNT(*) as count
      FROM tasks
      WHERE group_id = $1 AND status = 'completed'
    `;
    const result = await pool.query(completedTasksQuery, [groupId]);
    const completedTasksCount = parseInt(result.rows[0].count, 10);

    if (completedTasksCount > 0) {
      throw new ValidationError('无法解散组群：组群中存在已完成的任务');
    }

    await this.groupRepository.delete(groupId);
  }

  /**
   * Update group name
   */
  async updateGroup(groupId: string, name: string, userId: string): Promise<any> {
    const group = await this.groupRepository.findById(groupId);
    if (!group) {
      throw new NotFoundError('Task group not found');
    }

    // Verify user is the creator using OwnershipValidator
    await OwnershipValidator.validateGroupOwnership(groupId, userId);

    const updated = await this.groupRepository.update(groupId, { name });
    return GroupMapper.toDTO(updated);
  }



  /**
   * Create a task for the group
   * All group members can create tasks, tasks are private by default
   */
  async createGroupTask(groupId: string, userId: string, taskData: any): Promise<Task> {
    // Verify group exists
    const group = await this.groupRepository.findById(groupId);
    if (!group) {
      throw new NotFoundError('Task group not found');
    }

    // Verify user is a member of the group
    const isMember = await this.groupRepository.isMember(groupId, userId);
    if (!isMember) {
      throw new AuthorizationError('Only group members can create tasks for the group');
    }

    // Calculate bounty for the task
    const bountyCalculation = await this.bountyService.calculateBounty({
      estimatedHours: taskData.estimatedHours,
      complexity: taskData.complexity,
      priority: taskData.priority,
      plannedStartDate: taskData.plannedStartDate,
      plannedEndDate: taskData.plannedEndDate,
    });

    // Create task with group_id and private visibility
    const query = `
      INSERT INTO tasks (
        name, description, tags, planned_start_date, planned_end_date,
        estimated_hours, complexity, priority, visibility, publisher_id, group_id,
        status, depth, is_executable, progress, bounty_amount, bounty_algorithm_version
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'private', $9, $10, 'not_started', 0, true, 0, $11, $12)
      RETURNING *
    `;

    const values = [
      taskData.name,
      taskData.description,
      taskData.tags || [],
      taskData.plannedStartDate,
      taskData.plannedEndDate,
      taskData.estimatedHours,
      taskData.complexity,
      taskData.priority,
      userId, // publisher_id
      groupId, // group_id
      bountyCalculation.amount, // bounty_amount
      bountyCalculation.algorithmVersion, // bounty_algorithm_version
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Accept a group task (assign to user)
   * All group members can accept tasks
   */
  async acceptGroupTask(groupId: string, taskId: string, userId: string): Promise<void> {
    // Verify group exists
    const group = await this.groupRepository.findById(groupId);
    if (!group) {
      throw new NotFoundError('Task group not found');
    }

    // Verify user is a member of the group
    const isMember = await this.groupRepository.isMember(groupId, userId);
    if (!isMember) {
      throw new AuthorizationError('Only group members can accept group tasks');
    }

    // Verify task exists and belongs to the group
    const taskQuery = `
      SELECT id, assignee_id, group_id, status
      FROM tasks
      WHERE id = $1
    `;
    const taskResult = await pool.query(taskQuery, [taskId]);
    
    if (taskResult.rows.length === 0) {
      throw new NotFoundError('Task not found');
    }

    const task = taskResult.rows[0];

    // Verify task belongs to this group
    if (task.group_id !== groupId) {
      throw new ValidationError('Task does not belong to this group');
    }

    // Check if task is already assigned
    if (task.assignee_id) {
      throw new ValidationError('Task is already assigned');
    }

    // Assign task to user
    const updateQuery = `
      UPDATE tasks
      SET assignee_id = $1, status = 'in_progress', actual_start_date = NOW(), updated_at = NOW()
      WHERE id = $2
    `;
    await pool.query(updateQuery, [userId, taskId]);
  }

  /**
   * Convert an assigned task to a group task
   * The assignee can convert their task to a group task
   */
  async convertTaskToGroupTask(taskId: string, groupId: string, userId: string): Promise<void> {
    // Verify group exists
    const group = await this.groupRepository.findById(groupId);
    if (!group) {
      throw new NotFoundError('Task group not found');
    }

    // Verify user is a member of the group
    const isMember = await this.groupRepository.isMember(groupId, userId);
    if (!isMember) {
      throw new AuthorizationError('You must be a member of the group to convert task to group task');
    }

    // Verify task exists and user is the assignee
    const taskQuery = `
      SELECT id, assignee_id, group_id, status
      FROM tasks
      WHERE id = $1
    `;
    const taskResult = await pool.query(taskQuery, [taskId]);
    
    if (taskResult.rows.length === 0) {
      throw new NotFoundError('Task not found');
    }

    const task = taskResult.rows[0];

    // Verify user is the assignee
    if (task.assignee_id !== userId) {
      throw new AuthorizationError('Only the task assignee can convert it to a group task');
    }

    // Check if task is already a group task
    if (task.group_id) {
      throw new ValidationError('Task is already a group task');
    }

    // Convert task to group task
    const updateQuery = `
      UPDATE tasks
      SET group_id = $1, updated_at = NOW()
      WHERE id = $2
    `;
    await pool.query(updateQuery, [groupId, taskId]);
  }

  /**
   * Get all tasks for a group
   * Returns all tasks (including subtasks) so frontend can calculate subtask counts
   * Frontend will filter to show only top-level tasks
   */
  async getGroupTasks(groupId: string): Promise<Task[]> {
    // Verify group exists
    const group = await this.groupRepository.findById(groupId);
    if (!group) {
      throw new NotFoundError('Task group not found');
    }

    const query = `
      SELECT 
        t.*,
        t.publisher_id as "publisherId",
        t.assignee_id as "assigneeId",
        t.project_group_id as "projectGroupId",
        t.parent_id as "parentId",
        t.planned_start_date as "plannedStartDate",
        t.planned_end_date as "plannedEndDate",
        t.actual_start_date as "actualStartDate",
        t.actual_end_date as "actualEndDate",
        t.estimated_hours as "estimatedHours",
        t.bounty_amount as "bountyAmount",
        t.bounty_algorithm_version as "bountyAlgorithmVersion",
        t.is_executable as "isExecutable",
        t.created_at as "createdAt",
        t.updated_at as "updatedAt",
        t.group_id as "groupId",
        u_publisher.username as publisher_name,
        u_assignee.username as assignee_name,
        a_publisher.image_url as publisher_avatar_url,
        a_assignee.image_url as assignee_avatar_url,
        pg.name as project_group_name
      FROM tasks t
      LEFT JOIN users u_publisher ON t.publisher_id = u_publisher.id
      LEFT JOIN users u_assignee ON t.assignee_id = u_assignee.id
      LEFT JOIN avatars a_publisher ON u_publisher.avatar_id = a_publisher.id
      LEFT JOIN avatars a_assignee ON u_assignee.avatar_id = a_assignee.id
      LEFT JOIN project_groups pg ON t.project_group_id = pg.id
      WHERE t.group_id = $1
      ORDER BY t.created_at DESC
    `;

    const result = await pool.query(query, [groupId]);
    return result.rows;
  }

  /**
   * Get all tasks for groups the user is a member of
   */
  async getUserGroupTasks(userId: string): Promise<Task[]> {
    const query = `
      SELECT 
        t.*,
        u_publisher.username as publisher_name,
        u_assignee.username as assignee_name,
        a_publisher.image_url as publisher_avatar_url,
        a_assignee.image_url as assignee_avatar_url,
        pg.name as project_group_name,
        tg.name as group_name
      FROM tasks t
      INNER JOIN task_groups tg ON t.group_id = tg.id
      INNER JOIN group_members gm ON tg.id = gm.group_id
      LEFT JOIN users u_publisher ON t.publisher_id = u_publisher.id
      LEFT JOIN users u_assignee ON t.assignee_id = u_assignee.id
      LEFT JOIN avatars a_publisher ON u_publisher.avatar_id = a_publisher.id
      LEFT JOIN avatars a_assignee ON u_assignee.avatar_id = a_assignee.id
      LEFT JOIN project_groups pg ON t.project_group_id = pg.id
      WHERE gm.user_id = $1 AND t.parent_id IS NULL
      ORDER BY t.created_at DESC
    `;

    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  /**
   * Assign an existing task to a group
   */
  async assignTaskToGroup(taskId: string, groupId: string): Promise<void> {
    // Verify group exists
    const group = await this.groupRepository.findById(groupId);
    if (!group) {
      throw new NotFoundError('Task group not found');
    }

    // Verify task exists
    const taskQuery = `SELECT id FROM tasks WHERE id = $1`;
    const taskResult = await pool.query(taskQuery, [taskId]);
    
    if (taskResult.rows.length === 0) {
      throw new NotFoundError('Task not found');
    }

    // Assign task to group
    const updateQuery = `
      UPDATE tasks
      SET group_id = $1, updated_at = NOW()
      WHERE id = $2
    `;
    await pool.query(updateQuery, [groupId, taskId]);
  }

  /**
   * Calculate bounty distribution for a group task
   */
  async calculateGroupBountyDistribution(taskId: string): Promise<GroupBountyDistribution> {
    // Get task details
    const taskQuery = `
      SELECT id, group_id, bounty_amount, status
      FROM tasks
      WHERE id = $1
    `;
    const taskResult = await pool.query(taskQuery, [taskId]);
    
    if (taskResult.rows.length === 0) {
      throw new NotFoundError('Task not found');
    }

    const task = taskResult.rows[0];

    // Validate task is a group task using Validator
    Validator.required(task.group_id, 'Group ID');

    // Validate task status using Validator
    Validator.custom(
      task.status,
      (status) => status === 'completed',
      'Task status',
      'Task must be completed before distributing bounty'
    );

    // Get group members
    const members = await this.groupRepository.getGroupMembers(task.group_id);
    
    // Validate group has members using Validator
    Validator.arrayNotEmpty(members, 'Group members');

    // Calculate equal distribution
    const totalBounty = Number(task.bounty_amount);
    const amountPerMember = totalBounty / members.length;

    const memberDistributions = members.map(member => ({
      userId: member.userId,
      amount: amountPerMember,
    }));

    return {
      taskId: task.id,
      groupId: task.group_id,
      totalBounty,
      memberDistributions,
      transactionIds: [],
    };
  }

  /**
   * Distribute bounty for a completed group task
   */
  async distributeGroupBounty(taskId: string): Promise<GroupBountyDistribution> {
    // Calculate distribution
    const distribution = await this.calculateGroupBountyDistribution(taskId);

    // Create bounty transactions for each member
    const transactionIds: string[] = [];

    for (const memberDist of distribution.memberDistributions) {
      const transactionQuery = `
        INSERT INTO bounty_transactions (
          user_id, task_id, amount, transaction_type, description
        )
        VALUES ($1, $2, $3, 'task_completion', $4)
        RETURNING id
      `;

      const result = await pool.query(transactionQuery, [
        memberDist.userId,
        taskId,
        memberDist.amount,
        `Group task bounty distribution`,
      ]);

      transactionIds.push(result.rows[0].id);

      // Update user balance
      const updateBalanceQuery = `
        UPDATE users
        SET balance = balance + $1
        WHERE id = $2
      `;
      await pool.query(updateBalanceQuery, [memberDist.amount, memberDist.userId]);
    }

    return {
      ...distribution,
      transactionIds,
    };
  }
}
