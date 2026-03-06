import { Pool } from 'pg';
import { pool } from '../config/database.js';
import { UserRole } from '../models/User.js';
import { logger } from '../config/logger.js';
import { systemMetricsCollector } from '../utils/SystemMetricsCollector.js';
import { performanceMonitor } from '../utils/PerformanceMonitor.js';

export interface SystemStats {
  totalUsers: number;
  onlineUsers: number;
  totalTasks: number;
  activeTasks: number;
  totalBounty: number;
  completedTasks: number;
}

export interface OnlineUser {
  id: string;
  username: string;
  avatarUrl?: string;
  lastActive: string;
  status: 'online' | 'away' | 'busy';
}

export interface SystemPerformance {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkLoad: number;
  uptime: string;
}

export interface ActivityLog {
  id: string;
  type: string;
  user: string;
  action: string;
  time: string;
  status: 'success' | 'info' | 'warning' | 'error';
}

export class SystemMonitorService {
  constructor(private dbPool: Pool = pool) {}

  /**
   * Get system statistics for admin dashboard
   */
  async getSystemStats(): Promise<SystemStats> {
    try {
      // Get total users count
      const totalUsersResult = await this.dbPool.query('SELECT COUNT(*) as count FROM users');
      const totalUsers = parseInt(totalUsersResult.rows[0].count);

      // Get online users count (users active in last 15 minutes)
      const onlineUsersResult = await this.dbPool.query(`
        SELECT COUNT(*) as count 
        FROM users 
        WHERE last_login > NOW() - INTERVAL '15 minutes'
      `);
      const onlineUsers = parseInt(onlineUsersResult.rows[0].count);

      // Get total tasks count
      const totalTasksResult = await this.dbPool.query('SELECT COUNT(*) as count FROM tasks');
      const totalTasks = parseInt(totalTasksResult.rows[0].count);

      // Get active tasks count (not completed or abandoned)
      const activeTasksResult = await this.dbPool.query(`
        SELECT COUNT(*) as count 
        FROM tasks 
        WHERE status NOT IN ('completed', 'abandoned')
      `);
      const activeTasks = parseInt(activeTasksResult.rows[0].count);

      // Get total bounty amount (from completed transactions)
      const totalBountyResult = await this.dbPool.query(`
        SELECT COALESCE(SUM(amount), 0) as total 
        FROM bounty_transactions
        WHERE status = 'completed'
      `);
      const totalBounty = parseFloat(totalBountyResult.rows[0].total);

      // Get completed tasks count
      const completedTasksResult = await this.dbPool.query(`
        SELECT COUNT(*) as count 
        FROM tasks 
        WHERE status = 'completed'
      `);
      const completedTasks = parseInt(completedTasksResult.rows[0].count);

      return {
        totalUsers,
        onlineUsers,
        totalTasks,
        activeTasks,
        totalBounty,
        completedTasks
      };
    } catch (error) {
      logger.error('Error getting system stats:', error);
      throw error;
    }
  }

  /**
   * Get online users list
   */
  async getOnlineUsers(limit: number = 10): Promise<OnlineUser[]> {
    try {
      const query = `
        SELECT 
          u.id,
          u.username,
          a.image_url as avatar_url,
          u.last_login,
          CASE 
            WHEN u.last_login > NOW() - INTERVAL '5 minutes' THEN 'online'
            WHEN u.last_login > NOW() - INTERVAL '15 minutes' THEN 'away'
            ELSE 'busy'
          END as status
        FROM users u
        LEFT JOIN avatars a ON u.avatar_id = a.id
        WHERE u.last_login > NOW() - INTERVAL '15 minutes'
        ORDER BY u.last_login DESC
        LIMIT $1
      `;

      const result = await this.dbPool.query(query, [limit]);
      
      return result.rows.map(row => ({
        id: row.id,
        username: row.username,
        avatarUrl: row.avatar_url,
        lastActive: this.formatLastActive(row.last_login),
        status: row.status
      }));
    } catch (error) {
      logger.error('Error getting online users:', error);
      throw error;
    }
  }

  /**
   * Get system performance metrics
   */
  async getSystemPerformance(): Promise<SystemPerformance> {
    try {
      // Get real system metrics from SystemMetricsCollector
      const metrics = await systemMetricsCollector.getSystemMetrics();
      
      return {
        cpuUsage: metrics.cpuUsage,
        memoryUsage: metrics.memoryUsage,
        diskUsage: metrics.diskUsage,
        networkLoad: metrics.networkLoad,
        uptime: metrics.uptime
      };
    } catch (error) {
      logger.error('Error getting system performance:', error);
      throw error;
    }
  }

  /**
   * Get recent activity logs
   */
  async getActivityLogs(limit: number = 10): Promise<ActivityLog[]> {
    try {
      // Get recent audit logs
      const query = `
        SELECT 
          al.id,
          al.action,
          al.timestamp as created_at,
          al.username,
          al.details,
          al.success
        FROM audit_logs al
        ORDER BY al.timestamp DESC
        LIMIT $1
      `;

      const result = await this.dbPool.query(query, [limit]);
      
      return result.rows.map(row => ({
        id: row.id,
        type: this.getActivityType(row.action),
        user: row.username || 'System',
        action: this.formatAction(row.action, row.details),
        time: this.formatLastActive(row.created_at),
        status: row.success ? 'success' : 'error'
      }));
    } catch (error) {
      logger.error('Error getting activity logs:', error);
      // Return mock data if audit logs table doesn't exist
      return this.getMockActivityLogs(limit);
    }
  }

  /**
   * Get database connection count
   */
  async getDatabaseConnections(): Promise<number> {
    try {
      const result = await this.dbPool.query(`
        SELECT count(*) as connections 
        FROM pg_stat_activity 
        WHERE state = 'active'
      `);
      return parseInt(result.rows[0].connections);
    } catch (error) {
      logger.error('Error getting database connections:', error);
      return 0;
    }
  }

  /**
   * Get API response time (average from performance monitor)
   */
  async getApiResponseTime(): Promise<number> {
    try {
      // Get average API response time from PerformanceMonitor
      const avgResponseTime = performanceMonitor.getAverageApiResponseTime();
      
      // If no data available, get from SystemMetricsCollector
      if (avgResponseTime === 0) {
        return systemMetricsCollector.getApiResponseTime();
      }
      
      return avgResponseTime;
    } catch (error) {
      logger.error('Error getting API response time:', error);
      return systemMetricsCollector.getApiResponseTime();
    }
  }

  private formatLastActive(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) {
      return '刚刚';
    } else if (minutes < 60) {
      return `${minutes}分钟前`;
    } else {
      const hours = Math.floor(minutes / 60);
      return `${hours}小时前`;
    }
  }

  private getActivityType(action: string): string {
    if (action.includes('login')) return 'user_login';
    if (action.includes('task') && action.includes('create')) return 'task_created';
    if (action.includes('task') && action.includes('complete')) return 'task_completed';
    if (action.includes('bounty')) return 'bounty_awarded';
    if (action.includes('group')) return 'group_joined';
    return 'system_action';
  }

  private formatAction(action: string, details?: string): string {
    // Format action for display
    const actionMap: { [key: string]: string } = {
      'user_login': '登录系统',
      'task_create': '创建了新任务',
      'task_complete': '完成了任务',
      'task_update': '更新了任务',
      'bounty_award': '获得赏金奖励',
      'group_join': '加入了项目组',
      'user_register': '注册了账户'
    };
    
    return actionMap[action] || action;
  }

  private getActivityStatus(action: string): 'success' | 'info' | 'warning' | 'error' {
    if (action.includes('complete') || action.includes('success')) return 'success';
    if (action.includes('error') || action.includes('fail')) return 'error';
    if (action.includes('warning') || action.includes('bounty')) return 'warning';
    return 'info';
  }

  private getMockActivityLogs(limit: number): ActivityLog[] {
    const mockLogs: ActivityLog[] = [
      { id: '1', type: 'task_created', user: 'Alice', action: '创建了新任务', time: '2分钟前', status: 'success' },
      { id: '2', type: 'task_completed', user: 'Bob', action: '完成了任务', time: '5分钟前', status: 'success' },
      { id: '3', type: 'user_login', user: 'Charlie', action: '登录系统', time: '8分钟前', status: 'info' },
      { id: '4', type: 'bounty_awarded', user: 'Diana', action: '获得赏金奖励', time: '12分钟前', status: 'warning' },
      { id: '5', type: 'group_joined', user: 'Eve', action: '加入了项目组', time: '15分钟前', status: 'info' },
    ];
    
    return mockLogs.slice(0, limit);
  }
}