import { Pool } from 'pg';
import {
  ProjectGroup,
  ProjectGroupCreateDTO,
  ProjectGroupUpdateDTO,
  ProjectGroupWithTasks,
  ProjectGroupStats,
} from '../models/ProjectGroup.js';
import { Task } from '../models/Task.js';
import { AppError } from '../utils/errors.js';

export class ProjectGroupService {
  constructor(private pool: Pool) {}

  /**
   * Get all project groups
   */
  async getAllProjectGroups(): Promise<ProjectGroup[]> {
    const query = `
      SELECT 
        id, 
        name, 
        description,
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM project_groups
      ORDER BY created_at DESC
    `;

    const result = await this.pool.query(query);
    return result.rows;
  }

  /**
   * Get project group by ID
   */
  async getProjectGroupById(id: string): Promise<ProjectGroup | null> {
    const query = `
      SELECT 
        id, 
        name, 
        description,
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM project_groups
      WHERE id = $1
    `;

    const result = await this.pool.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Get project group with tasks
   */
  async getProjectGroupWithTasks(id: string): Promise<ProjectGroupWithTasks | null> {
    const groupQuery = `
      SELECT 
        pg.id, 
        pg.name, 
        pg.description,
        pg.created_at as "createdAt",
        pg.updated_at as "updatedAt",
        COUNT(t.id) as "taskCount",
        COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as "completedTaskCount",
        COALESCE(SUM(t.bounty_amount), 0) as "totalBounty"
      FROM project_groups pg
      LEFT JOIN tasks t ON t.project_group_id = pg.id
      WHERE pg.id = $1
      GROUP BY pg.id, pg.name, pg.description, pg.created_at, pg.updated_at
    `;

    const groupResult = await this.pool.query(groupQuery, [id]);
    
    if (groupResult.rows.length === 0) {
      return null;
    }

    const group = groupResult.rows[0];

    // Get tasks
    const tasksQuery = `
      SELECT 
        t.id,
        t.name,
        t.description,
        t.status,
        t.bounty_amount as "bountyAmount",
        t.priority,
        t.complexity,
        t.progress,
        t.created_at as "createdAt",
        t.planned_end_date as "plannedEndDate"
      FROM tasks t
      WHERE t.project_group_id = $1
      ORDER BY t.created_at DESC
    `;

    const tasksResult = await this.pool.query(tasksQuery, [id]);

    return {
      ...group,
      taskCount: parseInt(group.taskCount),
      completedTaskCount: parseInt(group.completedTaskCount),
      totalBounty: parseFloat(group.totalBounty),
      tasks: tasksResult.rows,
    };
  }

  /**
   * Get project group statistics
   */
  async getProjectGroupStats(id: string): Promise<ProjectGroupStats | null> {
    const query = `
      SELECT 
        COUNT(*) as "totalTasks",
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as "completedTasks",
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as "inProgressTasks",
        COUNT(CASE WHEN status = 'available' THEN 1 END) as "availableTasks",
        COALESCE(SUM(bounty_amount), 0) as "totalBounty",
        COALESCE(SUM(CASE WHEN status = 'completed' THEN bounty_amount ELSE 0 END), 0) as "earnedBounty"
      FROM tasks
      WHERE project_group_id = $1
    `;

    const result = await this.pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const stats = result.rows[0];
    const totalTasks = parseInt(stats.totalTasks);
    const completedTasks = parseInt(stats.completedTasks);

    return {
      totalTasks,
      completedTasks,
      inProgressTasks: parseInt(stats.inProgressTasks),
      availableTasks: parseInt(stats.availableTasks),
      totalBounty: parseFloat(stats.totalBounty),
      earnedBounty: parseFloat(stats.earnedBounty),
      completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
    };
  }

  /**
   * Create project group
   */
  async createProjectGroup(data: ProjectGroupCreateDTO): Promise<ProjectGroup> {
    // Check if name already exists
    const checkQuery = 'SELECT id FROM project_groups WHERE name = $1';
    const checkResult = await this.pool.query(checkQuery, [data.name]);

    if (checkResult.rows.length > 0) {
      throw new AppError('PROJECT_GROUP_NAME_EXISTS', 'Project group name already exists', 400);
    }

    const query = `
      INSERT INTO project_groups (name, description)
      VALUES ($1, $2)
      RETURNING 
        id, 
        name, 
        description,
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    const result = await this.pool.query(query, [
      data.name,
      data.description || null,
    ]);

    return result.rows[0];
  }

  /**
   * Update project group
   */
  async updateProjectGroup(id: string, data: ProjectGroupUpdateDTO): Promise<ProjectGroup> {
    // Check if project group exists
    const existingGroup = await this.getProjectGroupById(id);
    if (!existingGroup) {
      throw new AppError('PROJECT_GROUP_NOT_FOUND', 'Project group not found', 404);
    }

    // Check if new name conflicts with existing groups
    if (data.name && data.name !== existingGroup.name) {
      const checkQuery = 'SELECT id FROM project_groups WHERE name = $1 AND id != $2';
      const checkResult = await this.pool.query(checkQuery, [data.name, id]);

      if (checkResult.rows.length > 0) {
        throw new AppError('PROJECT_GROUP_NAME_EXISTS', 'Project group name already exists', 400);
      }
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }

    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(data.description);
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE project_groups
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING 
        id, 
        name, 
        description,
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Delete project group
   */
  async deleteProjectGroup(id: string): Promise<void> {
    // Check if project group exists
    const existingGroup = await this.getProjectGroupById(id);
    if (!existingGroup) {
      throw new AppError('PROJECT_GROUP_NOT_FOUND', 'Project group not found', 404);
    }

    // Check if there are tasks associated with this project group
    const taskCheckQuery = 'SELECT COUNT(*) as count FROM tasks WHERE project_group_id = $1';
    const taskCheckResult = await this.pool.query(taskCheckQuery, [id]);
    const taskCount = parseInt(taskCheckResult.rows[0].count);

    if (taskCount > 0) {
      throw new AppError(
        'PROJECT_GROUP_HAS_TASKS',
        `Cannot delete project group with ${taskCount} associated tasks`,
        400
      );
    }

    const query = 'DELETE FROM project_groups WHERE id = $1';
    await this.pool.query(query, [id]);
  }

  /**
   * Get tasks by project group
   */
  async getTasksByProjectGroup(projectGroupId: string): Promise<Task[]> {
    const query = `
      SELECT 
        t.id,
        t.name,
        t.description,
        t.parent_id as "parentId",
        t.depth,
        t.is_executable as "isExecutable",
        t.tags,
        t.created_at as "createdAt",
        t.planned_start_date as "plannedStartDate",
        t.planned_end_date as "plannedEndDate",
        t.actual_start_date as "actualStartDate",
        t.actual_end_date as "actualEndDate",
        t.estimated_hours as "estimatedHours",
        t.complexity,
        t.priority,
        t.status,
        t.position_id as "positionId",
        t.visibility,
        t.bounty_amount as "bountyAmount",
        t.bounty_algorithm_version as "bountyAlgorithmVersion",
        t.is_bounty_settled as "isBountySettled",
        t.publisher_id as "publisherId",
        t.assignee_id as "assigneeId",
        t.group_id as "groupId",
        t.project_group_id as "projectGroupId",
        t.progress,
        t.progress_locked as "progressLocked",
        t.updated_at as "updatedAt",
        u.username as "publisher.username",
        a.username as "assignee.username"
      FROM tasks t
      LEFT JOIN users u ON t.publisher_id = u.id
      LEFT JOIN users a ON t.assignee_id = a.id
      WHERE t.project_group_id = $1
      ORDER BY t.created_at DESC
    `;

    const result = await this.pool.query(query, [projectGroupId]);
    return result.rows;
  }
}
