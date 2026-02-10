import { Pool } from 'pg';
import { BountyHistoryService } from './BountyHistoryService.js';
import { TransactionType } from '../models/BountyTransaction.js';
import { AppError } from '../utils/errors.js';
import { pool } from '../config/database.js';
import { randomUUID } from 'crypto';

describe('BountyHistoryService', () => {
  let service: BountyHistoryService;
  let testUserId1: string;
  let testUserId2: string;
  let testTaskId: string;

  beforeAll(async () => {
    service = new BountyHistoryService(pool);

    // Generate UUIDs for test data
    testUserId1 = randomUUID();
    testUserId2 = randomUUID();
    testTaskId = randomUUID();

    // Create test users directly
    await pool.query(
      `INSERT INTO users (id, username, email, password_hash, role)
       VALUES ($1, $2, $3, $4, $5), ($6, $7, $8, $9, $10)`,
      [
        testUserId1, 'bounty_test_user1', 'bounty_test1@example.com', '$2b$10$test', 'user',
        testUserId2, 'bounty_test_user2', 'bounty_test2@example.com', '$2b$10$test', 'user'
      ]
    );

    // Create a test task
    await pool.query(
      `INSERT INTO tasks (id, name, description, publisher_id, depth, is_executable, status, visibility)
       VALUES ($1, $2, $3, $4, 0, true, 'not_started', 'public')`,
      [testTaskId, 'Test Task for Bounty History', 'Test description', testUserId1]
    );
  });

  afterAll(async () => {
    // Clean up test data
    await pool.query('DELETE FROM bounty_transactions WHERE task_id = $1', [testTaskId]);
    await pool.query('DELETE FROM tasks WHERE id = $1', [testTaskId]);
    await pool.query('DELETE FROM users WHERE id = ANY($1)', [[testUserId1, testUserId2]]);
  });

  describe('getUserTransactionHistory', () => {
    beforeEach(async () => {
      // Clean up any existing transactions
      await pool.query('DELETE FROM bounty_transactions WHERE from_user_id = $1 OR to_user_id = $1', [testUserId1]);
      await pool.query('DELETE FROM bounty_transactions WHERE from_user_id = $1 OR to_user_id = $1', [testUserId2]);
    });

    it('should return empty result for user with no transactions', async () => {
      const result = await service.getUserTransactionHistory(testUserId1, {
        page: 1,
        limit: 20,
      });

      expect(result.transactions).toHaveLength(0);
      expect(result.pagination.totalCount).toBe(0);
      expect(result.pagination.totalPages).toBe(0);
      expect(result.summary.totalEarned).toBe(0);
      expect(result.summary.totalSpent).toBe(0);
      expect(result.summary.netBalance).toBe(0);
    });

    it('should return transactions where user is receiver', async () => {
      // Create a transaction where testUserId1 receives bounty
      await pool.query(
        `INSERT INTO bounty_transactions (task_id, from_user_id, to_user_id, amount, type, description)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [testTaskId, testUserId2, testUserId1, 100, TransactionType.TASK_COMPLETION, 'Task completed']
      );

      const result = await service.getUserTransactionHistory(testUserId1, {
        page: 1,
        limit: 20,
      });

      expect(result.transactions).toHaveLength(1);
      expect(result.transactions[0].toUserId).toBe(testUserId1);
      expect(result.transactions[0].fromUserId).toBe(testUserId2);
      expect(result.transactions[0].amount).toBe(100);
      expect(result.transactions[0].type).toBe(TransactionType.TASK_COMPLETION);
      expect(result.summary.totalEarned).toBe(100);
      expect(result.summary.totalSpent).toBe(0);
    });

    it('should return transactions where user is sender', async () => {
      // Create a transaction where testUserId1 sends bounty
      await pool.query(
        `INSERT INTO bounty_transactions (task_id, from_user_id, to_user_id, amount, type, description)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [testTaskId, testUserId1, testUserId2, 50, TransactionType.EXTRA_REWARD, 'Extra reward']
      );

      const result = await service.getUserTransactionHistory(testUserId1, {
        page: 1,
        limit: 20,
      });

      expect(result.transactions).toHaveLength(1);
      expect(result.transactions[0].fromUserId).toBe(testUserId1);
      expect(result.transactions[0].toUserId).toBe(testUserId2);
      expect(result.transactions[0].amount).toBe(50);
      expect(result.summary.totalEarned).toBe(0);
      expect(result.summary.totalSpent).toBe(50);
    });

    it('should return all transactions where user is either sender or receiver', async () => {
      // Create multiple transactions
      await pool.query(
        `INSERT INTO bounty_transactions (task_id, from_user_id, to_user_id, amount, type, description)
         VALUES 
         ($1, $2, $3, 100, $4, 'Received'),
         ($1, $3, $2, 50, $5, 'Sent')`,
        [testTaskId, testUserId2, testUserId1, TransactionType.TASK_COMPLETION, TransactionType.EXTRA_REWARD]
      );

      const result = await service.getUserTransactionHistory(testUserId1, {
        page: 1,
        limit: 20,
      });

      expect(result.transactions).toHaveLength(2);
      expect(result.summary.totalEarned).toBe(100);
      expect(result.summary.totalSpent).toBe(50);
      expect(result.summary.netBalance).toBe(50);
    });

    it('should order transactions by created_at DESC (newest first)', async () => {
      // Create transactions with different timestamps
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

      await pool.query(
        `INSERT INTO bounty_transactions (task_id, from_user_id, to_user_id, amount, type, description, created_at)
         VALUES 
         ($1, $2, $3, 100, $4, 'Oldest', $5),
         ($1, $2, $3, 200, $4, 'Middle', $6),
         ($1, $2, $3, 300, $4, 'Newest', $7)`,
        [testTaskId, testUserId2, testUserId1, TransactionType.TASK_COMPLETION, twoDaysAgo, yesterday, now]
      );

      const result = await service.getUserTransactionHistory(testUserId1, {
        page: 1,
        limit: 20,
      });

      expect(result.transactions).toHaveLength(3);
      expect(result.transactions[0].amount).toBe(300); // Newest
      expect(result.transactions[1].amount).toBe(200); // Middle
      expect(result.transactions[2].amount).toBe(100); // Oldest
    });

    it('should include task name from LEFT JOIN', async () => {
      await pool.query(
        `INSERT INTO bounty_transactions (task_id, from_user_id, to_user_id, amount, type, description)
         VALUES ($1, $2, $3, 100, $4, 'With task')`,
        [testTaskId, testUserId2, testUserId1, TransactionType.TASK_COMPLETION]
      );

      const result = await service.getUserTransactionHistory(testUserId1, {
        page: 1,
        limit: 20,
      });

      expect(result.transactions).toHaveLength(1);
      expect(result.transactions[0].taskName).toBe('Test Task for Bounty History');
    });

    it('should handle transactions with null task_id gracefully', async () => {
      await pool.query(
        `INSERT INTO bounty_transactions (task_id, from_user_id, to_user_id, amount, type, description)
         VALUES (NULL, $1, $2, 100, $3, 'No task')`,
        [testUserId2, testUserId1, TransactionType.REFUND]
      );

      const result = await service.getUserTransactionHistory(testUserId1, {
        page: 1,
        limit: 20,
      });

      expect(result.transactions).toHaveLength(1);
      expect(result.transactions[0].taskName).toBe('Unknown Task');
    });

    it('should filter by transaction type', async () => {
      // Create transactions of different types
      await pool.query(
        `INSERT INTO bounty_transactions (task_id, from_user_id, to_user_id, amount, type, description)
         VALUES 
         ($1, $2, $3, 100, $4, 'Task completion'),
         ($1, $2, $3, 50, $5, 'Extra reward'),
         ($1, $2, $3, 25, $6, 'Assistant share')`,
        [
          testTaskId,
          testUserId2,
          testUserId1,
          TransactionType.TASK_COMPLETION,
          TransactionType.EXTRA_REWARD,
          TransactionType.ASSISTANT_SHARE,
        ]
      );

      const result = await service.getUserTransactionHistory(testUserId1, {
        page: 1,
        limit: 20,
        type: TransactionType.TASK_COMPLETION,
      });

      expect(result.transactions).toHaveLength(1);
      expect(result.transactions[0].type).toBe(TransactionType.TASK_COMPLETION);
      expect(result.transactions[0].amount).toBe(100);
    });

    it('should paginate results correctly', async () => {
      // Create 5 transactions
      for (let i = 0; i < 5; i++) {
        await pool.query(
          `INSERT INTO bounty_transactions (task_id, from_user_id, to_user_id, amount, type, description)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [testTaskId, testUserId2, testUserId1, (i + 1) * 10, TransactionType.TASK_COMPLETION, `Transaction ${i + 1}`]
        );
      }

      // Get first page (2 items)
      const page1 = await service.getUserTransactionHistory(testUserId1, {
        page: 1,
        limit: 2,
      });

      expect(page1.transactions).toHaveLength(2);
      expect(page1.pagination.currentPage).toBe(1);
      expect(page1.pagination.pageSize).toBe(2);
      expect(page1.pagination.totalCount).toBe(5);
      expect(page1.pagination.totalPages).toBe(3);

      // Get second page (2 items)
      const page2 = await service.getUserTransactionHistory(testUserId1, {
        page: 2,
        limit: 2,
      });

      expect(page2.transactions).toHaveLength(2);
      expect(page2.pagination.currentPage).toBe(2);

      // Get third page (1 item)
      const page3 = await service.getUserTransactionHistory(testUserId1, {
        page: 3,
        limit: 2,
      });

      expect(page3.transactions).toHaveLength(1);
      expect(page3.pagination.currentPage).toBe(3);
    });

    it('should throw error for invalid page parameter', async () => {
      await expect(
        service.getUserTransactionHistory(testUserId1, {
          page: 0,
          limit: 20,
        })
      ).rejects.toThrow(AppError);

      await expect(
        service.getUserTransactionHistory(testUserId1, {
          page: -1,
          limit: 20,
        })
      ).rejects.toThrow('Page must be greater than 0');
    });

    it('should throw error for invalid limit parameter', async () => {
      await expect(
        service.getUserTransactionHistory(testUserId1, {
          page: 1,
          limit: 0,
        })
      ).rejects.toThrow(AppError);

      await expect(
        service.getUserTransactionHistory(testUserId1, {
          page: 1,
          limit: 101,
        })
      ).rejects.toThrow('Limit must be between 1 and 100');
    });
  });

  describe('getUserBountySummary', () => {
    beforeEach(async () => {
      // Clean up any existing transactions
      await pool.query('DELETE FROM bounty_transactions WHERE from_user_id = $1 OR to_user_id = $1', [testUserId1]);
    });

    it('should return zero summary for user with no transactions', async () => {
      const summary = await service.getUserBountySummary(testUserId1);

      expect(summary.totalEarned).toBe(0);
      expect(summary.totalSpent).toBe(0);
      expect(summary.netBalance).toBe(0);
      expect(summary.transactionCount).toBe(0);
    });

    it('should calculate total earned correctly', async () => {
      await pool.query(
        `INSERT INTO bounty_transactions (task_id, from_user_id, to_user_id, amount, type, description)
         VALUES 
         ($1, $2, $3, 100, $4, 'Earned 1'),
         ($1, $2, $3, 50, $4, 'Earned 2')`,
        [testTaskId, testUserId2, testUserId1, TransactionType.TASK_COMPLETION]
      );

      const summary = await service.getUserBountySummary(testUserId1);

      expect(summary.totalEarned).toBe(150);
      expect(summary.totalSpent).toBe(0);
      expect(summary.netBalance).toBe(150);
      expect(summary.transactionCount).toBe(2);
    });

    it('should calculate total spent correctly', async () => {
      await pool.query(
        `INSERT INTO bounty_transactions (task_id, from_user_id, to_user_id, amount, type, description)
         VALUES 
         ($1, $2, $3, 100, $4, 'Spent 1'),
         ($1, $2, $3, 50, $4, 'Spent 2')`,
        [testTaskId, testUserId1, testUserId2, TransactionType.EXTRA_REWARD]
      );

      const summary = await service.getUserBountySummary(testUserId1);

      expect(summary.totalEarned).toBe(0);
      expect(summary.totalSpent).toBe(150);
      expect(summary.netBalance).toBe(-150);
      expect(summary.transactionCount).toBe(2);
    });

    it('should calculate net balance correctly with mixed transactions', async () => {
      await pool.query(
        `INSERT INTO bounty_transactions (task_id, from_user_id, to_user_id, amount, type, description)
         VALUES 
         ($1, $2, $3, 200, $4, 'Earned'),
         ($1, $3, $2, 75, $5, 'Spent')`,
        [testTaskId, testUserId2, testUserId1, TransactionType.TASK_COMPLETION, TransactionType.EXTRA_REWARD]
      );

      const summary = await service.getUserBountySummary(testUserId1);

      expect(summary.totalEarned).toBe(200);
      expect(summary.totalSpent).toBe(75);
      expect(summary.netBalance).toBe(125);
      expect(summary.transactionCount).toBe(2);
    });

    it('should filter summary by transaction type', async () => {
      await pool.query(
        `INSERT INTO bounty_transactions (task_id, from_user_id, to_user_id, amount, type, description)
         VALUES 
         ($1, $2, $3, 100, $4, 'Task completion'),
         ($1, $2, $3, 50, $5, 'Extra reward')`,
        [testTaskId, testUserId2, testUserId1, TransactionType.TASK_COMPLETION, TransactionType.EXTRA_REWARD]
      );

      const summary = await service.getUserBountySummary(testUserId1, TransactionType.TASK_COMPLETION);

      expect(summary.totalEarned).toBe(100);
      expect(summary.totalSpent).toBe(0);
      expect(summary.netBalance).toBe(100);
      expect(summary.transactionCount).toBe(1);
    });
  });
});
