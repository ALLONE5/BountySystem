/**
 * Database Optimization Service
 * Handles database maintenance tasks like refreshing materialized views
 */

import { pool } from '../config/database.js';
import { logger } from '../config/logger.js';
export class DatabaseOptimizationService {
  /**
   * Refresh the current month rankings materialized view
   * Should be called after ranking calculations or periodically
   */
  static async refreshCurrentMonthRankings(): Promise<void> {
    try {
      await pool.query('REFRESH MATERIALIZED VIEW CONCURRENTLY current_month_rankings');
      logger.info('Refreshed current_month_rankings materialized view');
    } catch (error) {
      logger.error('Error refreshing current_month_rankings:', error);
      throw error;
    }
  }

  /**
   * Update table statistics for query planner optimization
   * Should be run periodically (e.g., daily) or after bulk operations
   */
  static async updateStatistics(tables?: string[]): Promise<void> {
    const defaultTables = [
      'users',
      'positions',
      'tasks',
      'task_dependencies',
      'notifications',
      'rankings',
      'bounty_transactions',
      'task_assistants',
      'task_groups',
    ];

    const tablesToAnalyze = tables || defaultTables;

    try {
      for (const table of tablesToAnalyze) {
        await pool.query(`ANALYZE ${table}`);
        logger.info(`Analyzed table: ${table}`);
      }
      logger.info('Statistics update completed');
    } catch (error) {
      logger.error('Error updating statistics:', error);
      throw error;
    }
  }

  /**
   * Vacuum tables to reclaim storage and update statistics
   * Should be run periodically (e.g., weekly) during low-traffic periods
   */
  static async vacuumTables(tables?: string[]): Promise<void> {
    const defaultTables = [
      'notifications', // High insert/delete activity
      'bounty_transactions',
      'task_reviews',
    ];

    const tablesToVacuum = tables || defaultTables;

    try {
      for (const table of tablesToVacuum) {
        await pool.query(`VACUUM ANALYZE ${table}`);
        logger.info(`Vacuumed table: ${table}`);
      }
      logger.info('Vacuum completed');
    } catch (error) {
      logger.error('Error vacuuming tables:', error);
      throw error;
    }
  }

  /**
   * Get index usage statistics to identify unused indexes
   */
  static async getIndexUsageStats(): Promise<any[]> {
    const query = `
      SELECT
        schemaname,
        tablename,
        indexname,
        idx_scan as index_scans,
        idx_tup_read as tuples_read,
        idx_tup_fetch as tuples_fetched
      FROM pg_stat_user_indexes
      WHERE schemaname = 'public'
      ORDER BY idx_scan ASC, tablename;
    `;

    try {
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      logger.error('Error getting index usage stats:', error);
      throw error;
    }
  }

  /**
   * Get table size information
   */
  static async getTableSizes(): Promise<any[]> {
    const query = `
      SELECT
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
        pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS indexes_size
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
    `;

    try {
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      logger.error('Error getting table sizes:', error);
      throw error;
    }
  }

  /**
   * Get slow query statistics
   */
  static async getSlowQueries(minDuration: number = 100): Promise<any[]> {
    const query = `
      SELECT
        query,
        calls,
        total_time,
        mean_time,
        max_time,
        stddev_time
      FROM pg_stat_statements
      WHERE mean_time > $1
      ORDER BY mean_time DESC
      LIMIT 20;
    `;

    try {
      const result = await pool.query(query, [minDuration]);
      return result.rows;
    } catch (error) {
      // pg_stat_statements extension might not be enabled
      logger.warn('pg_stat_statements extension not available');
      return [];
    }
  }
}
