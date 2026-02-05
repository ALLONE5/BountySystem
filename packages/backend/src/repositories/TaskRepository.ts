import { PoolClient } from 'pg';
import { BaseRepository, IRepository } from './BaseRepository.js';
import { Task, TaskStatus, Visibility } from '../models/Task.js';
import { Position } from '../models/Position.js';
import { Validator } from '../utils/Validator.js';

/**
 * Task Filters Interface
 */
export interface TaskFilters {
  status?: TaskStatus;
  visibility?: Visibility;
  positionId?: string;
  groupId?: string;
  projectGroupId?: string;
  tags?: string[];
  minBounty?: number;
  maxBounty?: number;
}

/**
 * Task Repository Interface
 * Extends base repository with task-specific queries
 */
export interface ITaskRepository extends IRepository<Task> {
  findByCreator(creatorId: string): Promise<Task[]>;
  findByGroup(groupId: string): Promise<Task[]>;
  findWithPositions(taskId: string): Promise<Task & { positions: Position[] }>;
  findPublicTasks(filters?: TaskFilters): Promise<Task[]>;
  updateStatus(taskId: string, status: TaskStatus): Promise<Task>;
}

/**
 * Task Repository
 * Handles all database operations for tasks
 */
export class TaskRepository extends BaseRepository<Task> implements ITaskRepository {
  constructor() {
    super('tasks');
  }

  /**
   * Get all column names for the tasks table
   */
  protected getColumns(): string[] {
    return [
      'id',
      'name',
      'description',
      'parent_id',
      'depth',
      'is_executable',
      'tags',
      'created_at',
      'planned_start_date',
      'planned_end_date',
      'actual_start_date',
      'actual_end_date',
      'estimated_hours',
      'complexity',
      'priority',
      'status',
      'position_id',
      'visibility',
      'bounty_amount',
      'bounty_algorithm_version',
      'is_bounty_settled',
      'bounty_payer_id',
      'is_published',
      'published_at',
      'published_by',
      'publisher_id',
      'assignee_id',
      'group_id',
      'project_group_id',
      'progress',
      'progress_locked',
      'aggregated_estimated_hours',
      'aggregated_complexity',
      'updated_at'
    ];
  }

  /**
   * Transform database row to Task model
   */
  protected mapRowToModel(row: any): Task {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      parentId: row.parent_id,
      depth: row.depth,
      isExecutable: row.is_executable,
      tags: row.tags || [],
      createdAt: row.created_at,
      plannedStartDate: row.planned_start_date,
      plannedEndDate: row.planned_end_date,
      actualStartDate: row.actual_start_date,
      actualEndDate: row.actual_end_date,
      estimatedHours: row.estimated_hours,
      complexity: row.complexity,
      priority: row.priority,
      status: row.status as TaskStatus,
      positionId: row.position_id,
      visibility: row.visibility as Visibility,
      bountyAmount: parseFloat(row.bounty_amount) || 0,
      bountyAlgorithmVersion: row.bounty_algorithm_version,
      isBountySettled: row.is_bounty_settled,
      bountyPayerId: row.bounty_payer_id,
      isPublished: row.is_published !== undefined ? row.is_published : true,
      publishedAt: row.published_at,
      publishedBy: row.published_by,
      publisherId: row.publisher_id,
      assigneeId: row.assignee_id,
      groupId: row.group_id,
      projectGroupId: row.project_group_id,
      progress: row.progress || 0,
      progressLocked: row.progress_locked || false,
      aggregatedEstimatedHours: row.aggregated_estimated_hours,
      aggregatedComplexity: row.aggregated_complexity,
      updatedAt: row.updated_at
    };
  }

  /**
   * Validate task data before create/update
   */
  protected validateData(data: Partial<Task>, isUpdate: boolean = false): void {
    if (!isUpdate) {
      // Required fields for creation
      Validator.required(data.name, 'name');
      Validator.required(data.publisherId, 'publisherId');
    }

    // Validate name length if provided
    if (data.name) {
      Validator.minLength(data.name, 1, 'name');
      Validator.maxLength(data.name, 255, 'name');
    }

    // Validate status if provided
    if (data.status) {
      const validStatuses = Object.values(TaskStatus);
      if (!validStatuses.includes(data.status)) {
        throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      }
    }

    // Validate visibility if provided
    if (data.visibility) {
      const validVisibilities = Object.values(Visibility);
      if (!validVisibilities.includes(data.visibility)) {
        throw new Error(`Invalid visibility. Must be one of: ${validVisibilities.join(', ')}`);
      }
    }

    // Validate bounty amount if provided
    if (data.bountyAmount !== undefined && data.bountyAmount < 0) {
      throw new Error('Bounty amount must be non-negative');
    }

    // Validate progress if provided
    if (data.progress !== undefined) {
      if (data.progress < 0 || data.progress > 100) {
        throw new Error('Progress must be between 0 and 100');
      }
    }
  }

  /**
   * Find tasks by creator
   */
  async findByCreator(creatorId: string): Promise<Task[]> {
    try {
      Validator.required(creatorId, 'creatorId');

      const query = `
        SELECT ${this.getColumns().join(', ')}
        FROM ${this.tableName}
        WHERE publisher_id = $1
        ORDER BY created_at DESC
      `;

      const rows = await this.executeQuery<any>(query, [creatorId]);
      return rows.map(row => this.mapRowToModel(row));
    } catch (error) {
      console.error('Error finding tasks by creator:', error);
      throw error;
    }
  }

  /**
   * Find tasks by group
   */
  async findByGroup(groupId: string): Promise<Task[]> {
    try {
      Validator.required(groupId, 'groupId');

      const query = `
        SELECT ${this.getColumns().join(', ')}
        FROM ${this.tableName}
        WHERE group_id = $1
        ORDER BY created_at DESC
      `;

      const rows = await this.executeQuery<any>(query, [groupId]);
      return rows.map(row => this.mapRowToModel(row));
    } catch (error) {
      console.error('Error finding tasks by group:', error);
      throw error;
    }
  }

  /**
   * Find task with positions (not applicable in current schema)
   * Note: In the current schema, positions are separate entities that reference tasks,
   * not the other way around. This method returns the task with an empty positions array.
   */
  async findWithPositions(taskId: string): Promise<Task & { positions: Position[] }> {
    try {
      Validator.required(taskId, 'taskId');

      const task = await this.findById(taskId);
      
      if (!task) {
        throw new Error('Task not found');
      }

      // In the current schema, tasks don't have positions as child entities
      // This is a placeholder for future implementation if needed
      return {
        ...task,
        positions: []
      };
    } catch (error) {
      console.error('Error finding task with positions:', error);
      throw error;
    }
  }

  /**
   * Find public tasks with optional filters
   */
  async findPublicTasks(filters?: TaskFilters): Promise<Task[]> {
    try {
      let query = `
        SELECT ${this.getColumns().join(', ')}
        FROM ${this.tableName}
        WHERE visibility = 'public'
      `;

      const params: any[] = [];
      let paramIndex = 1;

      if (filters) {
        if (filters.status) {
          query += ` AND status = $${paramIndex}`;
          params.push(filters.status);
          paramIndex++;
        }

        if (filters.positionId) {
          query += ` AND position_id = $${paramIndex}`;
          params.push(filters.positionId);
          paramIndex++;
        }

        if (filters.groupId) {
          query += ` AND group_id = $${paramIndex}`;
          params.push(filters.groupId);
          paramIndex++;
        }

        if (filters.projectGroupId) {
          query += ` AND project_group_id = $${paramIndex}`;
          params.push(filters.projectGroupId);
          paramIndex++;
        }

        if (filters.minBounty !== undefined) {
          query += ` AND bounty_amount >= $${paramIndex}`;
          params.push(filters.minBounty);
          paramIndex++;
        }

        if (filters.maxBounty !== undefined) {
          query += ` AND bounty_amount <= $${paramIndex}`;
          params.push(filters.maxBounty);
          paramIndex++;
        }

        if (filters.tags && filters.tags.length > 0) {
          query += ` AND tags && $${paramIndex}`;
          params.push(filters.tags);
          paramIndex++;
        }
      }

      query += ' ORDER BY created_at DESC';

      const rows = await this.executeQuery<any>(query, params);
      return rows.map(row => this.mapRowToModel(row));
    } catch (error) {
      console.error('Error finding public tasks:', error);
      throw error;
    }
  }

  /**
   * Update task status
   */
  async updateStatus(taskId: string, status: TaskStatus): Promise<Task> {
    try {
      Validator.required(taskId, 'taskId');
      Validator.required(status, 'status');

      const validStatuses = Object.values(TaskStatus);
      if (!validStatuses.includes(status)) {
        throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      }

      const query = `
        UPDATE ${this.tableName}
        SET status = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `;

      const rows = await this.executeQuery<any>(query, [status, taskId]);

      if (rows.length === 0) {
        throw new Error('Task not found');
      }

      return this.mapRowToModel(rows[0]);
    } catch (error) {
      console.error('Error updating task status:', error);
      throw error;
    }
  }

  /**
   * Find task by ID with all relations (publisher, assignee, groups)
   */
  async findByIdWithRelations(taskId: string): Promise<Task | null> {
    try {
      Validator.required(taskId, 'taskId');

      const query = `
        SELECT 
          t.id, t.name, t.description, t.parent_id, t.depth, t.is_executable,
          t.tags, t.created_at, t.planned_start_date, t.planned_end_date,
          t.actual_start_date, t.actual_end_date, t.estimated_hours,
          t.complexity, t.priority, t.status, t.position_id, t.visibility,
          t.bounty_amount, t.bounty_algorithm_version, t.is_bounty_settled,
          t.bounty_payer_id, t.is_published, t.published_at, t.published_by,
          t.publisher_id, t.assignee_id, t.group_id, t.project_group_id,
          t.progress, t.progress_locked, t.aggregated_estimated_hours,
          t.aggregated_complexity, t.updated_at,
          t.invited_user_id, t.invitation_status,
          p.id as "publisher.id", p.username as "publisher.username", 
          p.email as "publisher.email", p.avatar_id as "publisher.avatarId", 
          p.role as "publisher.role", p.created_at as "publisher.createdAt",
          p.last_login as "publisher.lastLogin",
          pa.image_url as "publisher.avatarUrl",
          a.id as "assignee.id", a.username as "assignee.username", 
          a.email as "assignee.email", a.avatar_id as "assignee.avatarId", 
          a.role as "assignee.role", a.created_at as "assignee.createdAt",
          a.last_login as "assignee.lastLogin",
          aa.image_url as "assignee.avatarUrl",
          tg.name as "groupName",
          pg.name as "projectGroupName"
        FROM tasks t
        LEFT JOIN users p ON t.publisher_id = p.id
        LEFT JOIN avatars pa ON p.avatar_id = pa.id
        LEFT JOIN users a ON t.assignee_id = a.id
        LEFT JOIN avatars aa ON a.avatar_id = aa.id
        LEFT JOIN task_groups tg ON t.group_id = tg.id
        LEFT JOIN project_groups pg ON t.project_group_id = pg.id
        WHERE t.id = $1
      `;

      const rows = await this.executeQuery<any>(query, [taskId]);
      
      if (rows.length === 0) {
        return null;
      }

      const row = rows[0];
      
      // Map publisher if exists
      const publisher = row['publisher.id'] ? {
        id: row['publisher.id'],
        username: row['publisher.username'],
        email: row['publisher.email'],
        avatarId: row['publisher.avatarId'],
        avatarUrl: row['publisher.avatarUrl'],
        role: row['publisher.role'],
        createdAt: row['publisher.createdAt'],
        lastLogin: row['publisher.lastLogin'],
      } : undefined;

      // Map assignee if exists
      const assignee = row['assignee.id'] ? {
        id: row['assignee.id'],
        username: row['assignee.username'],
        email: row['assignee.email'],
        avatarId: row['assignee.avatarId'],
        avatarUrl: row['assignee.avatarUrl'],
        role: row['assignee.role'],
        createdAt: row['assignee.createdAt'],
        lastLogin: row['assignee.lastLogin'],
      } : undefined;

      // Map task
      const task: any = {
        id: row.id,
        name: row.name,
        description: row.description,
        parentId: row.parent_id,
        depth: row.depth,
        isExecutable: row.is_executable,
        tags: row.tags || [],
        createdAt: row.created_at,
        plannedStartDate: row.planned_start_date,
        plannedEndDate: row.planned_end_date,
        actualStartDate: row.actual_start_date,
        actualEndDate: row.actual_end_date,
        estimatedHours: row.estimated_hours,
        complexity: row.complexity,
        priority: row.priority,
        status: row.status,
        positionId: row.position_id,
        visibility: row.visibility,
        bountyAmount: parseFloat(row.bounty_amount) || 0,
        bountyAlgorithmVersion: row.bounty_algorithm_version,
        isBountySettled: row.is_bounty_settled,
        bountyPayerId: row.bounty_payer_id,
        isPublished: row.is_published !== undefined ? row.is_published : true,
        publishedAt: row.published_at,
        publishedBy: row.published_by,
        publisherId: row.publisher_id,
        assigneeId: row.assignee_id,
        groupId: row.group_id,
        projectGroupId: row.project_group_id,
        progress: row.progress || 0,
        progressLocked: row.progress_locked || false,
        aggregatedEstimatedHours: row.aggregated_estimated_hours,
        aggregatedComplexity: row.aggregated_complexity,
        invitedUserId: row.invited_user_id,
        invitationStatus: row.invitation_status,
        updatedAt: row.updated_at,
        groupName: row.groupName,
        projectGroupName: row.projectGroupName
      };

      if (publisher) task.publisher = publisher;
      if (assignee) task.assignee = assignee;

      return task;
    } catch (error) {
      console.error('Error finding task by ID with relations:', error);
      throw error;
    }
  }

  /**
   * Find subtasks of a parent task
   */
  async findSubtasks(parentId: string): Promise<Task[]> {
    try {
      Validator.required(parentId, 'parentId');

      const query = `
        SELECT 
          t.id, t.name, t.description, t.parent_id, t.depth, t.is_executable,
          t.tags, t.created_at, t.planned_start_date, t.planned_end_date,
          t.actual_start_date, t.actual_end_date, t.estimated_hours,
          t.complexity, t.priority, t.status, t.position_id, t.visibility,
          t.bounty_amount, t.bounty_algorithm_version, t.is_bounty_settled,
          t.bounty_payer_id, t.is_published, t.published_at, t.published_by,
          t.publisher_id, t.assignee_id, t.group_id, t.project_group_id,
          t.progress, t.progress_locked, t.aggregated_estimated_hours,
          t.aggregated_complexity, t.updated_at,
          p.id as "publisher.id", p.username as "publisher.username", 
          p.email as "publisher.email", p.avatar_id as "publisher.avatarId", 
          p.role as "publisher.role", p.created_at as "publisher.createdAt",
          p.last_login as "publisher.lastLogin",
          pa.image_url as "publisher.avatarUrl",
          a.id as "assignee.id", a.username as "assignee.username", 
          a.email as "assignee.email", a.avatar_id as "assignee.avatarId", 
          a.role as "assignee.role", a.created_at as "assignee.createdAt",
          a.last_login as "assignee.lastLogin",
          aa.image_url as "assignee.avatarUrl"
        FROM ${this.tableName} t
        LEFT JOIN users p ON t.publisher_id = p.id
        LEFT JOIN avatars pa ON p.avatar_id = pa.id
        LEFT JOIN users a ON t.assignee_id = a.id
        LEFT JOIN avatars aa ON a.avatar_id = aa.id
        WHERE t.parent_id = $1
        ORDER BY t.created_at ASC
      `;

      const rows = await this.executeQuery<any>(query, [parentId]);
      
      return rows.map(row => {
        // Map publisher if exists
        const publisher = row['publisher.id'] ? {
          id: row['publisher.id'],
          username: row['publisher.username'],
          email: row['publisher.email'],
          avatarId: row['publisher.avatarId'],
          avatarUrl: row['publisher.avatarUrl'],
          role: row['publisher.role'],
          createdAt: row['publisher.createdAt'],
          lastLogin: row['publisher.lastLogin'],
        } : undefined;

        // Map assignee if exists
        const assignee = row['assignee.id'] ? {
          id: row['assignee.id'],
          username: row['assignee.username'],
          email: row['assignee.email'],
          avatarId: row['assignee.avatarId'],
          avatarUrl: row['assignee.avatarUrl'],
          role: row['assignee.role'],
          createdAt: row['assignee.createdAt'],
          lastLogin: row['assignee.lastLogin'],
        } : undefined;

        const task: any = {
          id: row.id,
          name: row.name,
          description: row.description,
          parentId: row.parent_id,
          depth: row.depth,
          isExecutable: row.is_executable,
          tags: row.tags || [],
          createdAt: row.created_at,
          plannedStartDate: row.planned_start_date,
          plannedEndDate: row.planned_end_date,
          actualStartDate: row.actual_start_date,
          actualEndDate: row.actual_end_date,
          estimatedHours: row.estimated_hours,
          complexity: row.complexity,
          priority: row.priority,
          status: row.status,
          positionId: row.position_id,
          visibility: row.visibility,
          bountyAmount: parseFloat(row.bounty_amount) || 0,
          bountyAlgorithmVersion: row.bounty_algorithm_version,
          isBountySettled: row.is_bounty_settled,
          bountyPayerId: row.bounty_payer_id,
          isPublished: row.is_published !== undefined ? row.is_published : true,
          publishedAt: row.published_at,
          publishedBy: row.published_by,
          publisherId: row.publisher_id,
          assigneeId: row.assignee_id,
          groupId: row.group_id,
          projectGroupId: row.project_group_id,
          progress: row.progress || 0,
          progressLocked: row.progress_locked || false,
          aggregatedEstimatedHours: row.aggregated_estimated_hours,
          aggregatedComplexity: row.aggregated_complexity,
          updatedAt: row.updated_at
        };

        if (publisher) task.publisher = publisher;
        if (assignee) task.assignee = assignee;

        return task;
      });
    } catch (error) {
      console.error('Error finding subtasks:', error);
      throw error;
    }
  }
}
