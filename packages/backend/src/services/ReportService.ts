/**
 * Report Service
 * Handles report generation for user task statistics
 */

import { Pool } from 'pg';
import { QueueService, ReportJob } from './QueueService';

export interface TaskStatistics {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  totalBountyEarned: number;
  averageCompletionTime: number;
  tasksByComplexity: Record<number, number>;
  tasksByPriority: Record<number, number>;
}

export interface ReportData {
  userId: string;
  reportType: 'daily' | 'weekly' | 'monthly' | 'total';
  startDate?: Date;
  endDate?: Date;
  publishedTasks: TaskStatistics;
  assignedTasks: TaskStatistics;
  generatedAt: Date;
}

export class ReportService {
  constructor(private pool: Pool) {}

  /**
   * Generate report asynchronously via queue
   */
  async generateReportAsync(
    userId: string,
    reportType: 'daily' | 'weekly' | 'monthly' | 'total',
    startDate?: Date,
    endDate?: Date
  ): Promise<string> {
    const job: ReportJob = {
      userId,
      reportType,
      startDate,
      endDate,
    };

    return QueueService.enqueueReportGeneration(job);
  }

  /**
   * Generate daily report
   */
  async generateDailyReport(userId: string): Promise<string> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.generateReportAsync(userId, 'daily', today, tomorrow);
  }

  /**
   * Generate weekly report
   */
  async generateWeeklyReport(userId: string): Promise<string> {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    return this.generateReportAsync(userId, 'weekly', weekStart, weekEnd);
  }

  /**
   * Generate monthly report
   */
  async generateMonthlyReport(userId: string): Promise<string> {
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    return this.generateReportAsync(userId, 'monthly', monthStart, monthEnd);
  }

  /**
   * Generate total report (all time)
   */
  async generateTotalReport(userId: string): Promise<string> {
    return this.generateReportAsync(userId, 'total');
  }

  /**
   * Calculate task statistics (synchronous - used by worker)
   */
  async calculateTaskStatistics(
    userId: string,
    role: 'publisher' | 'assignee',
    startDate?: Date,
    endDate?: Date
  ): Promise<TaskStatistics> {
    const roleColumn = role === 'publisher' ? 'publisher_id' : 'assignee_id';
    
    let dateFilter = '';
    const params: any[] = [userId];
    let paramIndex = 2;

    if (startDate && endDate) {
      dateFilter = `AND created_at >= $${paramIndex++} AND created_at < $${paramIndex++}`;
      params.push(startDate, endDate);
    }

    // Get total tasks
    const totalQuery = `
      SELECT COUNT(*) as count
      FROM tasks
      WHERE ${roleColumn} = $1 ${dateFilter}
    `;
    const totalResult = await this.pool.query(totalQuery, params);
    const totalTasks = parseInt(totalResult.rows[0].count);

    // Get completed tasks
    const completedQuery = `
      SELECT COUNT(*) as count
      FROM tasks
      WHERE ${roleColumn} = $1 AND status = 'completed' ${dateFilter}
    `;
    const completedResult = await this.pool.query(completedQuery, params);
    const completedTasks = parseInt(completedResult.rows[0].count);

    // Get in-progress tasks
    const inProgressQuery = `
      SELECT COUNT(*) as count
      FROM tasks
      WHERE ${roleColumn} = $1 AND status = 'in_progress' ${dateFilter}
    `;
    const inProgressResult = await this.pool.query(inProgressQuery, params);
    const inProgressTasks = parseInt(inProgressResult.rows[0].count);

    // Get total bounty earned (for assignee role)
    let totalBountyEarned = 0;
    if (role === 'assignee') {
      const bountyQuery = `
        SELECT COALESCE(SUM(bounty_amount), 0) as total
        FROM tasks
        WHERE ${roleColumn} = $1 AND status = 'completed' ${dateFilter}
      `;
      const bountyResult = await this.pool.query(bountyQuery, params);
      totalBountyEarned = parseFloat(bountyResult.rows[0].total);
    }

    // Get average completion time
    const avgTimeQuery = `
      SELECT AVG(EXTRACT(EPOCH FROM (actual_end_date - actual_start_date))) as avg_seconds
      FROM tasks
      WHERE ${roleColumn} = $1 
        AND status = 'completed' 
        AND actual_start_date IS NOT NULL 
        AND actual_end_date IS NOT NULL
        ${dateFilter}
    `;
    const avgTimeResult = await this.pool.query(avgTimeQuery, params);
    const averageCompletionTime = avgTimeResult.rows[0].avg_seconds 
      ? parseFloat(avgTimeResult.rows[0].avg_seconds) / 3600 // Convert to hours
      : 0;

    // Get tasks by complexity
    const complexityQuery = `
      SELECT complexity, COUNT(*) as count
      FROM tasks
      WHERE ${roleColumn} = $1 AND complexity IS NOT NULL ${dateFilter}
      GROUP BY complexity
    `;
    const complexityResult = await this.pool.query(complexityQuery, params);
    const tasksByComplexity: Record<number, number> = {};
    complexityResult.rows.forEach((row) => {
      tasksByComplexity[row.complexity] = parseInt(row.count);
    });

    // Get tasks by priority
    const priorityQuery = `
      SELECT priority, COUNT(*) as count
      FROM tasks
      WHERE ${roleColumn} = $1 AND priority IS NOT NULL ${dateFilter}
      GROUP BY priority
    `;
    const priorityResult = await this.pool.query(priorityQuery, params);
    const tasksByPriority: Record<number, number> = {};
    priorityResult.rows.forEach((row) => {
      tasksByPriority[row.priority] = parseInt(row.count);
    });

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      totalBountyEarned,
      averageCompletionTime,
      tasksByComplexity,
      tasksByPriority,
    };
  }

  /**
   * Generate complete report data (synchronous - used by worker)
   */
  async generateReportData(
    userId: string,
    reportType: 'daily' | 'weekly' | 'monthly' | 'total',
    startDate?: Date,
    endDate?: Date
  ): Promise<ReportData> {
    const publishedTasks = await this.calculateTaskStatistics(
      userId,
      'publisher',
      startDate,
      endDate
    );

    const assignedTasks = await this.calculateTaskStatistics(
      userId,
      'assignee',
      startDate,
      endDate
    );

    return {
      userId,
      reportType,
      startDate,
      endDate,
      publishedTasks,
      assignedTasks,
      generatedAt: new Date(),
    };
  }
}
