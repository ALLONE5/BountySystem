/**
 * Test cleanup utilities
 * Provides safe cleanup methods for test data with proper ordering to avoid foreign key violations
 */

import { pool } from '../config/database.js';
import { logger } from '../config/logger.js';

/**
 * Clean up all test data in the correct order to avoid foreign key violations
 * This should be called in afterEach or afterAll hooks
 */
export async function cleanupAllTestData(): Promise<void> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Delete in reverse order of dependencies
    await client.query('DELETE FROM task_reviews WHERE 1=1');
    await client.query('DELETE FROM task_assistants WHERE 1=1');
    await client.query('DELETE FROM task_dependencies WHERE 1=1');
    await client.query('DELETE FROM notifications WHERE 1=1');
    await client.query('DELETE FROM rankings WHERE 1=1');
    await client.query('DELETE FROM bounty_transactions WHERE 1=1');
    await client.query('DELETE FROM admin_budgets WHERE 1=1');
    await client.query('DELETE FROM user_positions WHERE 1=1');
    await client.query('DELETE FROM positions WHERE 1=1');
    await client.query('DELETE FROM comments WHERE 1=1');
    await client.query('DELETE FROM attachments WHERE 1=1');
    await client.query('DELETE FROM tasks WHERE 1=1');
    await client.query('DELETE FROM task_groups WHERE 1=1');
    await client.query('DELETE FROM project_groups WHERE 1=1');
    await client.query('DELETE FROM bounty_algorithms WHERE 1=1');
    await client.query('DELETE FROM avatars WHERE 1=1');
    await client.query('DELETE FROM users WHERE 1=1');
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error cleaning up test data', { 
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Clean up test data for specific user
 */
export async function cleanupUserTestData(userId: string): Promise<void> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Delete user-related data
    await client.query('DELETE FROM task_reviews WHERE reviewer_id = $1', [userId]);
    await client.query('DELETE FROM notifications WHERE user_id = $1', [userId]);
    await client.query('DELETE FROM rankings WHERE user_id = $1', [userId]);
    await client.query('DELETE FROM bounty_transactions WHERE user_id = $1', [userId]);
    await client.query('DELETE FROM admin_budgets WHERE admin_id = $1', [userId]);
    await client.query('DELETE FROM user_positions WHERE user_id = $1', [userId]);
    await client.query('DELETE FROM tasks WHERE publisher_id = $1', [userId]);
    await client.query('DELETE FROM task_groups WHERE creator_id = $1', [userId]);
    await client.query('DELETE FROM project_groups WHERE creator_id = $1', [userId]);
    await client.query('DELETE FROM bounty_algorithms WHERE created_by = $1', [userId]);
    await client.query('DELETE FROM users WHERE id = $1', [userId]);
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error cleaning up test data for user', { 
      error: error instanceof Error ? error.message : String(error),
      userId 
    });
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Clean up test data for specific task
 */
export async function cleanupTaskTestData(taskId: string): Promise<void> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Delete task-related data
    await client.query('DELETE FROM task_reviews WHERE task_id = $1', [taskId]);
    await client.query('DELETE FROM task_assistants WHERE task_id = $1', [taskId]);
    await client.query('DELETE FROM task_dependencies WHERE task_id = $1 OR dependency_id = $1', [taskId]);
    await client.query('DELETE FROM notifications WHERE related_task_id = $1', [taskId]);
    await client.query('DELETE FROM bounty_transactions WHERE task_id = $1', [taskId]);
    await client.query('DELETE FROM positions WHERE task_id = $1', [taskId]);
    await client.query('DELETE FROM comments WHERE task_id = $1', [taskId]);
    await client.query('DELETE FROM attachments WHERE task_id = $1', [taskId]);
    await client.query('DELETE FROM tasks WHERE id = $1', [taskId]);
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error cleaning up test data for task', { 
      error: error instanceof Error ? error.message : String(error),
      taskId 
    });
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Disable foreign key checks temporarily (use with caution)
 */
export async function disableForeignKeyChecks(): Promise<void> {
  await pool.query('SET session_replication_role = replica');
}

/**
 * Re-enable foreign key checks
 */
export async function enableForeignKeyChecks(): Promise<void> {
  await pool.query('SET session_replication_role = DEFAULT');
}

/**
 * Truncate all tables (fastest cleanup, but requires superuser or table owner)
 */
export async function truncateAllTables(): Promise<void> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Disable triggers temporarily
    await client.query('SET session_replication_role = replica');
    
    // Truncate all tables
    await client.query('TRUNCATE TABLE task_reviews CASCADE');
    await client.query('TRUNCATE TABLE task_assistants CASCADE');
    await client.query('TRUNCATE TABLE task_dependencies CASCADE');
    await client.query('TRUNCATE TABLE notifications CASCADE');
    await client.query('TRUNCATE TABLE rankings CASCADE');
    await client.query('TRUNCATE TABLE bounty_transactions CASCADE');
    await client.query('TRUNCATE TABLE admin_budgets CASCADE');
    await client.query('TRUNCATE TABLE user_positions CASCADE');
    await client.query('TRUNCATE TABLE positions CASCADE');
    await client.query('TRUNCATE TABLE comments CASCADE');
    await client.query('TRUNCATE TABLE attachments CASCADE');
    await client.query('TRUNCATE TABLE tasks CASCADE');
    await client.query('TRUNCATE TABLE task_groups CASCADE');
    await client.query('TRUNCATE TABLE project_groups CASCADE');
    await client.query('TRUNCATE TABLE bounty_algorithms CASCADE');
    await client.query('TRUNCATE TABLE avatars CASCADE');
    await client.query('TRUNCATE TABLE users CASCADE');
    
    // Re-enable triggers
    await client.query('SET session_replication_role = DEFAULT');
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    await client.query('SET session_replication_role = DEFAULT');
    logger.error('Error truncating tables', { 
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  } finally {
    client.release();
  }
}
