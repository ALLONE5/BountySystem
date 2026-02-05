import { pool } from '../config/database.js';
import { Task, TaskStatus } from '../models/Task.js';
import { DependencyService } from './DependencyService.js';
import { NotificationService } from './NotificationService.js';
import { NotificationType } from '../models/Notification.js';

/**
 * Workload analysis for a user
 */
export interface WorkloadAnalysis {
  userId: string;
  activeTaskCount: number;
  totalEstimatedHours: number;
  averageComplexity: number;
  isOverloaded: boolean;
  recommendation: string;
}

/**
 * SchedulerService handles automatic task scheduling and recommendations
 * Requirements: 3.5, 28.1, 28.2, 28.3, 28.4, 28.5
 */
export class SchedulerService {
  private dependencyService: DependencyService;
  private notificationService: NotificationService;

  constructor() {
    this.dependencyService = new DependencyService();
    this.notificationService = new NotificationService();
  }

  /**
   * Check if all dependencies for a task are resolved
   * Requirement 3.5, 28.1: Dependency checking for automatic scheduling
   */
  async checkDependenciesResolved(taskId: string): Promise<boolean> {
    return this.dependencyService.areDependenciesResolved(taskId);
  }

  /**
   * Update task availability based on dependency resolution
   * Requirement 3.5, 28.1: Automatically mark tasks as available when dependencies resolve
   * 
   * This method checks if all dependencies are resolved and updates the task status
   * from NOT_STARTED to AVAILABLE if appropriate.
   */
  async updateTaskAvailability(taskId: string): Promise<void> {
    await this.dependencyService.updateTaskAvailability(taskId);
  }

  /**
   * Process completed task and update downstream dependencies
   * Requirement 28.1: When task dependencies are resolved, automatically mark tasks as available
   * 
   * @param completedTaskId - ID of the task that was just completed
   * @returns Array of task IDs that became available
   */
  async processCompletedTask(completedTaskId: string): Promise<string[]> {
    // Get all tasks that depend on this completed task
    const resolvedTaskIds = await this.dependencyService.resolveDownstreamDependencies(completedTaskId);

    // Send notifications for each newly available task
    for (const taskId of resolvedTaskIds) {
      const task = await this.getTask(taskId);
      if (task) {
        // Notify the publisher about the dependency resolution
        await this.notificationService.sendDependencyResolvedNotification(
          task.publisherId,
          task.id,
          task.name
        );

        // If task has an assignee, notify them too
        if (task.assigneeId) {
          await this.notificationService.sendDependencyResolvedNotification(
            task.assigneeId,
            task.id,
            task.name
          );
        }
      }
    }

    return resolvedTaskIds;
  }

  /**
   * Evaluate user's current workload
   * Requirement 28.3: Check user's work load and provide suggestions
   * 
   * @param userId - ID of the user to evaluate
   * @returns Workload analysis with recommendations
   */
  async evaluateWorkload(userId: string): Promise<WorkloadAnalysis> {
    const query = `
      SELECT 
        COUNT(*) as active_count,
        COALESCE(SUM(estimated_hours), 0) as total_hours,
        COALESCE(AVG(complexity), 0) as avg_complexity
      FROM tasks
      WHERE assignee_id = $1 
        AND status IN ($2, $3)
        AND is_executable = true
    `;

    const result = await pool.query(query, [
      userId,
      TaskStatus.IN_PROGRESS,
      TaskStatus.AVAILABLE,
    ]);

    const row = result.rows[0];
    const activeTaskCount = parseInt(row.active_count, 10);
    const totalEstimatedHours = parseFloat(row.total_hours);
    const averageComplexity = parseFloat(row.avg_complexity);

    // Define workload thresholds
    const OVERLOAD_TASK_COUNT = 5;
    const OVERLOAD_HOURS = 40;
    const HIGH_COMPLEXITY_THRESHOLD = 4;

    const isOverloaded =
      activeTaskCount >= OVERLOAD_TASK_COUNT ||
      totalEstimatedHours >= OVERLOAD_HOURS ||
      (activeTaskCount > 0 && averageComplexity >= HIGH_COMPLEXITY_THRESHOLD);

    let recommendation = '';
    if (isOverloaded) {
      if (activeTaskCount >= OVERLOAD_TASK_COUNT) {
        recommendation = `You have ${activeTaskCount} active tasks. Consider completing some before taking on more.`;
      } else if (totalEstimatedHours >= OVERLOAD_HOURS) {
        recommendation = `You have ${totalEstimatedHours.toFixed(1)} hours of estimated work. Consider your capacity before accepting more tasks.`;
      } else {
        recommendation = `Your tasks have high average complexity (${averageComplexity.toFixed(1)}/5). Focus on completing current tasks first.`;
      }
    } else {
      recommendation = 'Your workload looks manageable. You can take on more tasks if needed.';
    }

    return {
      userId,
      activeTaskCount,
      totalEstimatedHours,
      averageComplexity,
      isOverloaded,
      recommendation,
    };
  }

  /**
   * Recommend tasks for a user based on their positions and workload
   * Requirement 28.3, 28.4: Recommend suitable tasks and push long-unaccepted tasks
   * 
   * @param userId - ID of the user to recommend tasks for
   * @param limit - Maximum number of tasks to recommend (default: 10)
   * @returns Array of recommended tasks
   */
  async recommendTasks(userId: string, limit: number = 10): Promise<Task[]> {
    // First check user's workload
    const workload = await this.evaluateWorkload(userId);

    // If user is overloaded, return empty recommendations
    if (workload.isOverloaded) {
      return [];
    }

    // Get user's positions
    const positionsQuery = `
      SELECT position_id
      FROM user_positions
      WHERE user_id = $1
    `;
    const positionsResult = await pool.query(positionsQuery, [userId]);
    const userPositionIds = positionsResult.rows.map((row) => row.position_id);

    // Recommend tasks that:
    // 1. Are executable (leaf nodes)
    // 2. Are not assigned
    // 3. Have all dependencies resolved (status = AVAILABLE)
    // 4. Match user's positions OR have no position requirement
    // 5. Are visible to the user
    // 6. Prioritize tasks that have been waiting longer
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
        EXTRACT(EPOCH FROM (NOW() - t.created_at)) / 3600 as hours_waiting
      FROM tasks t
      WHERE t.is_executable = true
        AND t.assignee_id IS NULL
        AND t.status = $1
        AND (
          t.position_id IS NULL 
          OR t.position_id = ANY($2)
        )
        AND (
          t.visibility = 'public'
          OR (t.visibility = 'position_only' AND t.position_id = ANY($2))
          OR (t.visibility = 'private' AND t.publisher_id = $3)
        )
      ORDER BY 
        -- Prioritize tasks waiting longer (Requirement 28.4)
        hours_waiting DESC,
        -- Then by priority
        t.priority DESC NULLS LAST,
        -- Then by bounty amount
        t.bounty_amount DESC
      LIMIT $4
    `;

    const result = await pool.query(query, [
      TaskStatus.AVAILABLE,
      userPositionIds.length > 0 ? userPositionIds : [null],
      userId,
      limit,
    ]);

    return result.rows;
  }

  /**
   * Push notifications for long-unaccepted tasks to qualified users
   * Requirement 28.4, 28.5: Push tasks that haven't been accepted for a long time
   * 
   * @param hoursThreshold - Number of hours a task must be waiting to be considered "long-unaccepted" (default: 48)
   * @returns Number of notifications sent
   */
  async pushLongUnacceptedTasks(hoursThreshold: number = 48): Promise<number> {
    // Find tasks that have been waiting for more than the threshold
    const tasksQuery = `
      SELECT 
        t.id, t.name, t.position_id as "positionId",
        EXTRACT(EPOCH FROM (NOW() - t.created_at)) / 3600 as hours_waiting
      FROM tasks t
      WHERE t.is_executable = true
        AND t.assignee_id IS NULL
        AND t.status = $1
        AND EXTRACT(EPOCH FROM (NOW() - t.created_at)) / 3600 > $2
      ORDER BY hours_waiting DESC
    `;

    const tasksResult = await pool.query(tasksQuery, [
      TaskStatus.AVAILABLE,
      hoursThreshold,
    ]);

    let notificationCount = 0;

    for (const task of tasksResult.rows) {
      // Find qualified users for this task
      let usersQuery: string;
      let usersResult: any;

      if (task.positionId) {
        // Task has position requirement - notify users with that position
        usersQuery = `
          SELECT DISTINCT u.id
          FROM users u
          JOIN user_positions up ON u.id = up.user_id
          WHERE up.position_id = $1
        `;
        usersResult = await pool.query(usersQuery, [task.positionId]);
      } else {
        // Task has no position requirement - notify all users
        usersQuery = 'SELECT id FROM users';
        usersResult = await pool.query(usersQuery);
      }

      // Send notification to each qualified user
      for (const user of usersResult.rows) {
        // Check if user is not overloaded before sending recommendation
        const workload = await this.evaluateWorkload(user.id);
        if (!workload.isOverloaded) {
          await this.notificationService.createNotification({
            userId: user.id,
            type: NotificationType.TASK_RECOMMENDATION,
            title: 'Task Recommendation',
            message: `Task "${task.name}" has been waiting for ${Math.floor(task.hours_waiting)} hours and matches your qualifications. Consider taking it on!`,
            relatedTaskId: task.id,
          });
          notificationCount++;
        }
      }
    }

    return notificationCount;
  }

  /**
   * Reprioritize tasks based on deadline proximity
   * Requirement 28.2: Increase priority weight for tasks approaching deadline
   * 
   * This method adjusts task priorities based on how close they are to their deadline.
   * Tasks closer to deadline get higher priority.
   */
  async reprioritizeTasks(): Promise<number> {
    // Update priority for tasks with approaching deadlines
    // Priority boost formula: 
    // - If deadline is within 24 hours: boost by 2
    // - If deadline is within 3 days: boost by 1
    // - Otherwise: no change
    
    const query = `
      UPDATE tasks
      SET 
        priority = CASE
          WHEN planned_end_date IS NOT NULL AND planned_end_date <= NOW() + INTERVAL '24 hours' 
            THEN LEAST(COALESCE(priority, 3) + 2, 5)
          WHEN planned_end_date IS NOT NULL AND planned_end_date <= NOW() + INTERVAL '3 days'
            THEN LEAST(COALESCE(priority, 3) + 1, 5)
          ELSE COALESCE(priority, 3)
        END,
        updated_at = NOW()
      WHERE 
        is_executable = true
        AND assignee_id IS NULL
        AND status IN ($1, $2)
        AND planned_end_date IS NOT NULL
        AND planned_end_date > NOW()
    `;

    const result = await pool.query(query, [
      TaskStatus.NOT_STARTED,
      TaskStatus.AVAILABLE,
    ]);

    return result.rowCount || 0;
  }

  /**
   * Helper method to get a task by ID
   */
  private async getTask(taskId: string): Promise<Task | null> {
    const query = `
      SELECT 
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
      FROM tasks
      WHERE id = $1
    `;

    const result = await pool.query(query, [taskId]);
    return result.rows[0] || null;
  }
}
