import { pool } from '../config/database.js';
import { TaskDependency, TaskDependencyCreateDTO } from '../models/TaskDependency.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';
import { TaskStatus } from '../models/Task.js';

export class DependencyService {
  /**
   * Add a dependency relationship between tasks
   * Validates that both tasks exist and no circular dependency is created
   * The database trigger will prevent circular dependencies
   */
  async addDependency(dependencyData: TaskDependencyCreateDTO): Promise<TaskDependency> {
    const { taskId, dependsOnTaskId } = dependencyData;

    // Validate that task and dependency task exist
    const taskCheckQuery = 'SELECT id FROM tasks WHERE id = $1';
    const taskResult = await pool.query(taskCheckQuery, [taskId]);
    if (taskResult.rows.length === 0) {
      throw new NotFoundError('Task not found');
    }

    const dependsOnResult = await pool.query(taskCheckQuery, [dependsOnTaskId]);
    if (dependsOnResult.rows.length === 0) {
      throw new NotFoundError('Dependency task not found');
    }

    // Validate that task is not depending on itself
    if (taskId === dependsOnTaskId) {
      throw new ValidationError('Task cannot depend on itself');
    }

    try {
      // Insert dependency - database trigger will check for circular dependencies
      const query = `
        INSERT INTO task_dependencies (task_id, depends_on_task_id)
        VALUES ($1, $2)
        RETURNING 
          id,
          task_id as "taskId",
          depends_on_task_id as "dependsOnTaskId",
          created_at as "createdAt"
      `;

      const result = await pool.query(query, [taskId, dependsOnTaskId]);
      return result.rows[0];
    } catch (error: any) {
      // Check if error is due to circular dependency
      if (error.message && error.message.includes('Circular dependency detected')) {
        throw new ValidationError('Cannot create dependency: circular dependency detected');
      }
      // Check if error is due to duplicate dependency
      if (error.code === '23505') {
        throw new ValidationError('Dependency already exists');
      }
      throw error;
    }
  }

  /**
   * Remove a dependency relationship
   */
  async removeDependency(taskId: string, dependsOnTaskId: string): Promise<void> {
    const query = `
      DELETE FROM task_dependencies
      WHERE task_id = $1 AND depends_on_task_id = $2
    `;

    const result = await pool.query(query, [taskId, dependsOnTaskId]);

    if (result.rowCount === 0) {
      throw new NotFoundError('Dependency not found');
    }
  }

  /**
   * Get all dependencies for a task (tasks that this task depends on)
   */
  async getTaskDependencies(taskId: string): Promise<TaskDependency[]> {
    const query = `
      SELECT 
        id,
        task_id as "taskId",
        depends_on_task_id as "dependsOnTaskId",
        created_at as "createdAt"
      FROM task_dependencies
      WHERE task_id = $1
      ORDER BY created_at ASC
    `;

    const result = await pool.query(query, [taskId]);
    return result.rows;
  }

  /**
   * Get all tasks that depend on a given task
   */
  async getDependentTasks(taskId: string): Promise<TaskDependency[]> {
    const query = `
      SELECT 
        id,
        task_id as "taskId",
        depends_on_task_id as "dependsOnTaskId",
        created_at as "createdAt"
      FROM task_dependencies
      WHERE depends_on_task_id = $1
      ORDER BY created_at ASC
    `;

    const result = await pool.query(query, [taskId]);
    return result.rows;
  }

  /**
   * Check if a task has any unresolved dependencies
   * Returns true if all dependencies are completed, false otherwise
   */
  async areDependenciesResolved(taskId: string): Promise<boolean> {
    const query = `
      SELECT COUNT(*) as unresolved_count
      FROM task_dependencies td
      JOIN tasks t ON t.id = td.depends_on_task_id
      WHERE td.task_id = $1 AND t.status != $2
    `;

    const result = await pool.query(query, [taskId, TaskStatus.COMPLETED]);
    const unresolvedCount = parseInt(result.rows[0].unresolved_count);

    return unresolvedCount === 0;
  }

  /**
   * Get all unresolved dependencies for a task
   * Returns the list of tasks that must be completed before this task can be started
   */
  async getUnresolvedDependencies(taskId: string): Promise<string[]> {
    const query = `
      SELECT t.id, t.name, t.status
      FROM task_dependencies td
      JOIN tasks t ON t.id = td.depends_on_task_id
      WHERE td.task_id = $1 AND t.status != $2
      ORDER BY t.name
    `;

    const result = await pool.query(query, [taskId, TaskStatus.COMPLETED]);
    return result.rows.map((row) => row.id);
  }

  /**
   * Check if adding a dependency would create a circular dependency
   * This is a manual check that can be used before attempting to add a dependency
   * The database trigger also enforces this constraint
   */
  async wouldCreateCircularDependency(taskId: string, dependsOnTaskId: string): Promise<boolean> {
    // Use recursive CTE to check if there's a path from dependsOnTaskId back to taskId
    const query = `
      WITH RECURSIVE dependency_chain AS (
        -- Start with the proposed dependency
        SELECT $1::uuid as current_task, $2::uuid as depends_on, 1 as depth
        UNION ALL
        -- Follow the chain
        SELECT dc.current_task, td.depends_on_task_id, dc.depth + 1
        FROM dependency_chain dc
        JOIN task_dependencies td ON td.task_id = dc.depends_on
        WHERE dc.depth < 100
      )
      SELECT EXISTS(
        SELECT 1 FROM dependency_chain 
        WHERE current_task = depends_on
      ) as has_cycle
    `;

    const result = await pool.query(query, [taskId, dependsOnTaskId]);
    return result.rows[0].has_cycle;
  }

  /**
   * Update task status to AVAILABLE when all dependencies are resolved
   * This should be called when a dependency task is completed
   * Returns true if the task was updated to AVAILABLE
   */
  async updateTaskAvailability(taskId: string): Promise<boolean> {
    const resolved = await this.areDependenciesResolved(taskId);

    if (resolved) {
      // Check current status - only update if task is NOT_STARTED
      const statusQuery = 'SELECT status FROM tasks WHERE id = $1';
      const statusResult = await pool.query(statusQuery, [taskId]);

      if (statusResult.rows.length > 0 && statusResult.rows[0].status === TaskStatus.NOT_STARTED) {
        const updateQuery = `
          UPDATE tasks
          SET status = $1, updated_at = NOW()
          WHERE id = $2
        `;
        await pool.query(updateQuery, [TaskStatus.AVAILABLE, taskId]);
        return true;
      }
    }
    
    return false;
  }

  /**
   * When a task is completed, check all dependent tasks and update their availability
   */
  async resolveDownstreamDependencies(completedTaskId: string): Promise<string[]> {
    // Get all tasks that depend on this completed task
    const dependentTasks = await this.getDependentTasks(completedTaskId);

    const resolvedTaskIds: string[] = [];

    // Process all dependent tasks in parallel for better performance
    const results = await Promise.all(
      dependentTasks.map(async (dep) => {
        const wasUpdated = await this.updateTaskAvailability(dep.taskId);
        return { taskId: dep.taskId, wasUpdated };
      })
    );

    // Collect task IDs that were successfully updated
    results.forEach(({ taskId, wasUpdated }) => {
      if (wasUpdated) {
        resolvedTaskIds.push(taskId);
      }
    });

    return resolvedTaskIds;
  }
}
