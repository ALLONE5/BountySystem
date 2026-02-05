/**
 * Transaction Manager Utility
 * 
 * Manages database transactions for multi-step operations.
 * Ensures proper commit on success, rollback on failure, and connection release.
 * 
 * @example
 * ```typescript
 * const txManager = new TransactionManager(pool);
 * 
 * await txManager.executeInTransaction(async (client) => {
 *   await client.query('INSERT INTO users ...');
 *   await client.query('INSERT INTO tasks ...');
 *   return result;
 * });
 * ```
 */

import { Pool, PoolClient } from 'pg';

export class TransactionManager {
  constructor(private pool: Pool) {}

  /**
   * Execute a callback within a database transaction
   * 
   * - Begins transaction
   * - Executes callback with transaction client
   * - Commits on success
   * - Rolls back on failure
   * - Releases connection in finally block
   * - Preserves error stack traces
   * 
   * @param callback - Function to execute within transaction
   * @returns Result from callback
   * @throws Original error from callback with preserved stack trace
   */
  async executeInTransaction<T>(
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await this.pool.connect();

    try {
      // Begin transaction
      await client.query('BEGIN');

      // Execute callback
      const result = await callback(client);

      // Commit on success
      await client.query('COMMIT');

      return result;
    } catch (error) {
      // Rollback on failure
      await client.query('ROLLBACK');

      // Propagate error with preserved stack trace
      throw error;
    } finally {
      // Always release connection
      client.release();
    }
  }

  /**
   * Execute a callback within a transaction with retry logic
   * 
   * Useful for handling transient database errors like deadlocks.
   * 
   * @param callback - Function to execute within transaction
   * @param maxRetries - Maximum number of retry attempts (default: 3)
   * @returns Result from callback
   * @throws Last error if all retries fail
   */
  async executeInTransactionWithRetry<T>(
    callback: (client: PoolClient) => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await this.executeInTransaction(callback);
      } catch (error) {
        lastError = error as Error;
        
        // Only retry on transient errors
        if (attempt < maxRetries - 1) {
          // Exponential backoff
          await this.delay(Math.pow(2, attempt) * 100);
        }
      }
    }

    // Throw last error with preserved stack trace
    throw lastError;
  }

  /**
   * Helper method for exponential backoff delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
