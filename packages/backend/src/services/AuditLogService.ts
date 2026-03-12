import { pool } from '../config/database.js';
import { 
  AuditLog, 
  AuditLogCreateDTO, 
  AuditLogFilters, 
  AuditLogResponse,
  AuditAction,
  AuditResource
} from '../models/AuditLog.js';
import { NotFoundError } from '../utils/errors.js';
import logger from '../config/logger.js';

export class AuditLogService {
  /**
   * Create a new audit log entry
   */
  async createLog(logData: AuditLogCreateDTO): Promise<AuditLog> {
    const query = `
      INSERT INTO audit_logs (
        user_id,
        username,
        action,
        resource,
        resource_id,
        details,
        ip_address,
        user_agent,
        success
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING 
        id,
        user_id as "userId",
        username,
        action,
        resource,
        resource_id as "resourceId",
        details,
        ip_address as "ipAddress",
        user_agent as "userAgent",
        timestamp,
        success
    `;

    const values = [
      logData.userId,
      logData.username,
      logData.action,
      logData.resource,
      logData.resourceId || '',
      JSON.stringify(logData.details || {}),
      logData.ipAddress,
      logData.userAgent,
      logData.success
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Get audit logs with filtering and pagination
   */
  async getLogs(filters: AuditLogFilters = {}): Promise<{
    logs: AuditLogResponse[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const {
      search,
      action,
      resource,
      userId,
      success,
      startDate,
      endDate,
      limit = 20,
      offset = 0
    } = filters;

    // Build WHERE conditions
    const conditions: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (search) {
      conditions.push(`(username ILIKE $${paramCount} OR action ILIKE $${paramCount} OR resource ILIKE $${paramCount})`);
      values.push(`%${search}%`);
      paramCount++;
    }

    if (action) {
      conditions.push(`action = $${paramCount}`);
      values.push(action);
      paramCount++;
    }

    if (resource) {
      conditions.push(`resource = $${paramCount}`);
      values.push(resource);
      paramCount++;
    }

    if (userId) {
      conditions.push(`user_id = $${paramCount}`);
      values.push(userId);
      paramCount++;
    }

    if (success !== undefined) {
      conditions.push(`success = $${paramCount}`);
      values.push(success);
      paramCount++;
    }

    if (startDate) {
      conditions.push(`timestamp >= $${paramCount}`);
      values.push(startDate);
      paramCount++;
    }

    if (endDate) {
      conditions.push(`timestamp <= $${paramCount}`);
      values.push(endDate);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM audit_logs
      ${whereClause}
    `;

    const countResult = await pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].total);

    // Get paginated results
    const dataQuery = `
      SELECT 
        id,
        user_id as "userId",
        username,
        action,
        resource,
        resource_id as "resourceId",
        details,
        ip_address as "ipAddress",
        user_agent as "userAgent",
        timestamp,
        success
      FROM audit_logs
      ${whereClause}
      ORDER BY timestamp DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    values.push(limit, offset);
    const dataResult = await pool.query(dataQuery, values);

    return {
      logs: dataResult.rows,
      total,
      page: Math.floor(offset / limit) + 1,
      pageSize: limit
    };
  }

  /**
   * Get audit log by ID
   */
  async getLogById(id: string): Promise<AuditLogResponse> {
    const query = `
      SELECT 
        id,
        user_id as "userId",
        username,
        action,
        resource,
        resource_id as "resourceId",
        details,
        ip_address as "ipAddress",
        user_agent as "userAgent",
        timestamp,
        success
      FROM audit_logs
      WHERE id = $1
    `;

    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      throw new NotFoundError('Audit log not found');
    }

    return result.rows[0];
  }

  /**
   * Get audit logs for a specific user
   */
  async getLogsByUser(userId: string, limit: number = 50): Promise<AuditLogResponse[]> {
    const query = `
      SELECT 
        id,
        user_id as "userId",
        username,
        action,
        resource,
        resource_id as "resourceId",
        details,
        ip_address as "ipAddress",
        user_agent as "userAgent",
        timestamp,
        success
      FROM audit_logs
      WHERE user_id = $1
      ORDER BY timestamp DESC
      LIMIT $2
    `;

    const result = await pool.query(query, [userId, limit]);
    return result.rows;
  }

  /**
   * Get audit logs for a specific resource
   */
  async getLogsByResource(resource: string, resourceId: string, limit: number = 50): Promise<AuditLogResponse[]> {
    const query = `
      SELECT 
        id,
        user_id as "userId",
        username,
        action,
        resource,
        resource_id as "resourceId",
        details,
        ip_address as "ipAddress",
        user_agent as "userAgent",
        timestamp,
        success
      FROM audit_logs
      WHERE resource = $1 AND resource_id = $2
      ORDER BY timestamp DESC
      LIMIT $3
    `;

    const result = await pool.query(query, [resource, resourceId, limit]);
    return result.rows;
  }

  /**
   * Get failed operations
   */
  async getFailedOperations(limit: number = 100): Promise<AuditLogResponse[]> {
    const query = `
      SELECT 
        id,
        user_id as "userId",
        username,
        action,
        resource,
        resource_id as "resourceId",
        details,
        ip_address as "ipAddress",
        user_agent as "userAgent",
        timestamp,
        success
      FROM audit_logs
      WHERE success = false
      ORDER BY timestamp DESC
      LIMIT $1
    `;

    const result = await pool.query(query, [limit]);
    return result.rows;
  }

  /**
   * Get audit statistics
   */
  async getStatistics(days: number = 30): Promise<{
    totalLogs: number;
    successfulOperations: number;
    failedOperations: number;
    uniqueUsers: number;
    topActions: Array<{ action: string; count: number }>;
    topResources: Array<{ resource: string; count: number }>;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get basic statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_logs,
        COUNT(*) FILTER (WHERE success = true) as successful_operations,
        COUNT(*) FILTER (WHERE success = false) as failed_operations,
        COUNT(DISTINCT user_id) as unique_users
      FROM audit_logs
      WHERE timestamp >= $1
    `;

    const statsResult = await pool.query(statsQuery, [startDate]);
    const stats = statsResult.rows[0];

    // Get top actions
    const actionsQuery = `
      SELECT action, COUNT(*) as count
      FROM audit_logs
      WHERE timestamp >= $1
      GROUP BY action
      ORDER BY count DESC
      LIMIT 10
    `;

    const actionsResult = await pool.query(actionsQuery, [startDate]);

    // Get top resources
    const resourcesQuery = `
      SELECT resource, COUNT(*) as count
      FROM audit_logs
      WHERE timestamp >= $1
      GROUP BY resource
      ORDER BY count DESC
      LIMIT 10
    `;

    const resourcesResult = await pool.query(resourcesQuery, [startDate]);

    return {
      totalLogs: parseInt(stats.total_logs),
      successfulOperations: parseInt(stats.successful_operations),
      failedOperations: parseInt(stats.failed_operations),
      uniqueUsers: parseInt(stats.unique_users),
      topActions: actionsResult.rows,
      topResources: resourcesResult.rows
    };
  }

  /**
   * Delete old audit logs (for cleanup)
   */
  async deleteOldLogs(daysToKeep: number = 365): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const query = `
      DELETE FROM audit_logs
      WHERE timestamp < $1
    `;

    const result = await pool.query(query, [cutoffDate]);
    return result.rowCount || 0;
  }

  /**
   * Export audit logs to CSV format
   */
  async exportLogs(filters: AuditLogFilters = {}): Promise<string> {
    const { logs } = await this.getLogs({ ...filters, limit: 10000 }); // Large limit for export

    // CSV header
    const header = 'ID,User ID,Username,Action,Resource,Resource ID,IP Address,Timestamp,Success,Details\n';

    // CSV rows
    const rows = logs.map(log => {
      const details = JSON.stringify(log.details).replace(/"/g, '""'); // Escape quotes
      return [
        log.id,
        log.userId,
        log.username,
        log.action,
        log.resource,
        log.resourceId,
        log.ipAddress,
        log.timestamp.toISOString(),
        log.success,
        `"${details}"`
      ].join(',');
    }).join('\n');

    return header + rows;
  }

  /**
   * Helper method to log user actions
   */
  async logUserAction(
    userId: string,
    username: string,
    action: AuditAction,
    resource: AuditResource,
    resourceId: string = '',
    details: any = {},
    ipAddress: string = '',
    userAgent: string = '',
    success: boolean = true
  ): Promise<void> {
    try {
      await this.createLog({
        userId,
        username,
        action,
        resource,
        resourceId,
        details,
        ipAddress,
        userAgent,
        success
      });
    } catch (error) {
      // Log audit logging errors but don't throw to avoid breaking the main operation
      logger.error('Failed to create audit log:', error);
    }
  }
}