import { pool } from '../config/database.js';
import { TaskAssistant, TaskAssistantCreateDTO, AllocationType } from '../models/TaskAssistant.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

export interface BountyDistribution {
  taskId: string;
  totalBounty: number;
  mainAssignee: {
    userId: string;
    amount: number;
  };
  assistants: Array<{
    userId: string;
    amount: number;
    allocationType: AllocationType;
    allocationValue: number;
  }>;
  extraBounty: number;
  transactionIds: string[];
}

export interface BountyTransaction {
  id: string;
  taskId: string;
  fromUserId: string | null;
  toUserId: string;
  amount: number;
  transactionType: 'task_completion' | 'assistant_share' | 'extra_reward';
  createdAt: Date;
}

export class BountyDistributionService {
  /**
   * Add an assistant user to a task
   * Requirements 11.4, 11.5, 11.6, 11.7, 11.8: Assistant user management with allocation validation
   */
  async addAssistant(assistantData: TaskAssistantCreateDTO): Promise<TaskAssistant> {
    const { taskId, userId, allocationType, allocationValue } = assistantData;

    // Validate allocation value
    if (allocationValue <= 0) {
      throw new ValidationError('Allocation value must be positive');
    }

    if (allocationType === AllocationType.PERCENTAGE && allocationValue > 100) {
      throw new ValidationError('Percentage allocation cannot exceed 100%');
    }

    // Get task bounty to validate fixed allocation
    const taskQuery = 'SELECT bounty_amount, assignee_id FROM tasks WHERE id = $1';
    const taskResult = await pool.query(taskQuery, [taskId]);
    
    if (taskResult.rows.length === 0) {
      throw new NotFoundError('Task not found');
    }

    const taskBounty = parseFloat(taskResult.rows[0].bounty_amount);
    const assigneeId = taskResult.rows[0].assignee_id;

    if (!assigneeId) {
      throw new ValidationError('Cannot add assistants to unassigned tasks');
    }

    // Check if user is trying to add themselves as assistant
    if (userId === assigneeId) {
      throw new ValidationError('Main assignee cannot be added as assistant');
    }

    // For fixed allocation, validate it doesn't exceed task bounty
    if (allocationType === AllocationType.FIXED) {
      // Get total existing fixed allocations
      const existingQuery = `
        SELECT COALESCE(SUM(allocation_value), 0) as total_fixed
        FROM task_assistants
        WHERE task_id = $1 AND allocation_type = 'fixed'
      `;
      const existingResult = await pool.query(existingQuery, [taskId]);
      const existingFixed = parseFloat(existingResult.rows[0].total_fixed);

      if (existingFixed + allocationValue > taskBounty) {
        throw new ValidationError(
          `Total fixed allocation (${existingFixed + allocationValue}) cannot exceed task bounty (${taskBounty})`
        );
      }
    }

    // Insert assistant
    const insertQuery = `
      INSERT INTO task_assistants (task_id, user_id, allocation_type, allocation_value)
      VALUES ($1, $2, $3, $4)
      RETURNING 
        id,
        task_id as "taskId",
        user_id as "userId",
        allocation_type as "allocationType",
        allocation_value as "allocationValue",
        added_at as "addedAt"
    `;

    try {
      const result = await pool.query(insertQuery, [
        taskId,
        userId,
        allocationType,
        allocationValue,
      ]);

      return result.rows[0];
    } catch (error: any) {
      if (error.code === '23505') { // Unique violation
        throw new ValidationError('User is already an assistant on this task');
      }
      throw error;
    }
  }

  /**
   * Get all assistants for a task
   */
  async getTaskAssistants(taskId: string): Promise<TaskAssistant[]> {
    const query = `
      SELECT 
        id,
        task_id as "taskId",
        user_id as "userId",
        allocation_type as "allocationType",
        allocation_value as "allocationValue",
        added_at as "addedAt"
      FROM task_assistants
      WHERE task_id = $1
      ORDER BY added_at ASC
    `;

    const result = await pool.query(query, [taskId]);
    return result.rows;
  }

  /**
   * Remove an assistant from a task
   */
  async removeAssistant(taskId: string, userId: string): Promise<void> {
    const query = 'DELETE FROM task_assistants WHERE task_id = $1 AND user_id = $2';
    const result = await pool.query(query, [taskId, userId]);

    if (result.rowCount === 0) {
      throw new NotFoundError('Assistant not found on this task');
    }
  }

  /**
   * Calculate bounty distribution for a task
   * Requirement 11.9: Calculate main assignee and assistant bounties
   */
  async calculateDistribution(taskId: string): Promise<BountyDistribution> {
    // Get task information
    const taskQuery = `
      SELECT bounty_amount, assignee_id, is_bounty_settled
      FROM tasks
      WHERE id = $1
    `;
    const taskResult = await pool.query(taskQuery, [taskId]);

    if (taskResult.rows.length === 0) {
      throw new NotFoundError('Task not found');
    }

    const task = taskResult.rows[0];
    const totalBounty = parseFloat(task.bounty_amount);
    const assigneeId = task.assignee_id;

    if (!assigneeId) {
      throw new ValidationError('Cannot distribute bounty for unassigned task');
    }

    if (task.is_bounty_settled) {
      throw new ValidationError('Bounty already settled for this task');
    }

    // Get assistants
    const assistants = await this.getTaskAssistants(taskId);

    // Calculate assistant amounts
    let totalFixedAllocation = 0;
    let totalPercentageAllocation = 0;

    const assistantDistributions = assistants.map((assistant) => {
      let amount = 0;

      if (assistant.allocationType === AllocationType.FIXED) {
        amount = assistant.allocationValue;
        totalFixedAllocation += amount;
      } else {
        // Percentage - will calculate after fixed amounts
        totalPercentageAllocation += assistant.allocationValue;
      }

      return {
        userId: assistant.userId,
        amount: 0, // Will be set below
        allocationType: assistant.allocationType,
        allocationValue: assistant.allocationValue,
      };
    });

    // Calculate remaining bounty after fixed allocations
    const remainingAfterFixed = totalBounty - totalFixedAllocation;

    if (remainingAfterFixed < 0) {
      throw new ValidationError('Fixed allocations exceed total bounty');
    }

    // Now calculate percentage allocations from remaining bounty
    assistantDistributions.forEach((dist) => {
      if (dist.allocationType === AllocationType.FIXED) {
        dist.amount = dist.allocationValue;
      } else {
        // Percentage of remaining bounty after fixed allocations
        dist.amount = (remainingAfterFixed * dist.allocationValue) / 100;
      }
    });

    // Calculate main assignee amount (remaining after all allocations)
    const totalAssistantAmount = assistantDistributions.reduce(
      (sum, dist) => sum + dist.amount,
      0
    );
    const mainAssigneeAmount = totalBounty - totalAssistantAmount;

    // Get extra bounty if any
    const extraBountyQuery = `
      SELECT COALESCE(SUM(extra_bounty), 0) as total_extra
      FROM task_reviews
      WHERE task_id = $1
    `;
    const extraResult = await pool.query(extraBountyQuery, [taskId]);
    const extraBounty = parseFloat(extraResult.rows[0].total_extra);

    return {
      taskId,
      totalBounty,
      mainAssignee: {
        userId: assigneeId,
        amount: parseFloat(mainAssigneeAmount.toFixed(2)),
      },
      assistants: assistantDistributions.map((dist) => ({
        ...dist,
        amount: parseFloat(dist.amount.toFixed(2)),
      })),
      extraBounty: parseFloat(extraBounty.toFixed(2)),
      transactionIds: [],
    };
  }

  /**
   * Distribute bounty to main assignee and assistants
   * Requirement 11.9: Execute bounty transfer and record transaction history
   */
  async distributeBounty(taskId: string): Promise<BountyDistribution> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Calculate distribution
      const distribution = await this.calculateDistribution(taskId);

      // Create transaction records
      const transactionIds: string[] = [];

      // Record main assignee bounty (task completion)
      const mainTxQuery = `
        INSERT INTO bounty_transactions (task_id, from_user_id, to_user_id, amount, type, description)
        VALUES ($1, NULL, $2, $3, 'task_completion', 'Task completion bounty')
        RETURNING id
      `;
      const mainTxResult = await client.query(mainTxQuery, [
        taskId,
        distribution.mainAssignee.userId,
        distribution.mainAssignee.amount,
      ]);
      transactionIds.push(mainTxResult.rows[0].id);

      // Record assistant bounties (assistant share)
      for (const assistant of distribution.assistants) {
        const assistantTxQuery = `
          INSERT INTO bounty_transactions (task_id, from_user_id, to_user_id, amount, type, description)
          VALUES ($1, NULL, $2, $3, 'assistant_share', 'Assistant bounty share')
          RETURNING id
        `;
        const assistantTxResult = await client.query(assistantTxQuery, [
          taskId,
          assistant.userId,
          assistant.amount,
        ]);
        transactionIds.push(assistantTxResult.rows[0].id);
      }

      // Record extra bounty if any (extra reward)
      if (distribution.extraBounty > 0) {
        const extraTxQuery = `
          INSERT INTO bounty_transactions (task_id, from_user_id, to_user_id, amount, type, description)
          VALUES ($1, NULL, $2, $3, 'extra_reward', 'Extra bounty reward')
          RETURNING id
        `;
        const extraTxResult = await client.query(extraTxQuery, [
          taskId,
          distribution.mainAssignee.userId,
          distribution.extraBounty,
        ]);
        transactionIds.push(extraTxResult.rows[0].id);
      }

      // Mark bounty as settled
      await client.query(
        'UPDATE tasks SET is_bounty_settled = true, updated_at = NOW() WHERE id = $1',
        [taskId]
      );

      await client.query('COMMIT');

      distribution.transactionIds = transactionIds;
      return distribution;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get bounty transactions for a task
   */
  async getTaskTransactions(taskId: string): Promise<BountyTransaction[]> {
    const query = `
      SELECT 
        id,
        task_id as "taskId",
        from_user_id as "fromUserId",
        to_user_id as "toUserId",
        amount,
        type as "transactionType",
        created_at as "createdAt"
      FROM bounty_transactions
      WHERE task_id = $1
      ORDER BY created_at ASC
    `;

    const result = await pool.query(query, [taskId]);
    return result.rows;
  }

  /**
   * Get bounty transactions for a user
   */
  async getUserTransactions(userId: string): Promise<BountyTransaction[]> {
    const query = `
      SELECT 
        id,
        task_id as "taskId",
        from_user_id as "fromUserId",
        to_user_id as "toUserId",
        amount,
        type as "transactionType",
        created_at as "createdAt"
      FROM bounty_transactions
      WHERE to_user_id = $1 OR from_user_id = $1
      ORDER BY created_at DESC
    `;

    const result = await pool.query(query, [userId]);
    return result.rows;
  }
}
