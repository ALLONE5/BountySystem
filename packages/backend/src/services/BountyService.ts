import { pool } from '../config/database.js';
import { BountyAlgorithm, BountyAlgorithmCreateDTO, BountyCalculationInput } from '../models/BountyAlgorithm.js';
import { Task } from '../models/Task.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';
import { Validator } from '../utils/Validator.js';

export class BountyService {
  /**
   * Calculate bounty for a task based on the current algorithm
   * Requirements 19.1, 19.2: Automatic bounty calculation using algorithm parameters
   * 
   * Formula: baseAmount + (urgency * urgencyWeight) + (importance * importanceWeight) + (duration * durationWeight) + (remainingDays * remainingDaysWeight)
   * - urgency: calculated from time until deadline (higher = more urgent)
   * - importance: task priority (1-5)
   * - duration: estimated hours
   * - remainingDays: days remaining until deadline (automatically calculated)
   */
  async calculateBounty(input: BountyCalculationInput): Promise<{ amount: number; algorithmVersion: string }> {
    // Get the current active algorithm
    const algorithm = await this.getCurrentAlgorithm();
    
    if (!algorithm) {
      throw new ValidationError('No active bounty algorithm found');
    }

    // Convert algorithm fields to numbers (they come as strings from PostgreSQL)
    const baseAmount = parseFloat(algorithm.baseAmount as any);
    const urgencyWeight = parseFloat(algorithm.urgencyWeight as any);
    const importanceWeight = parseFloat(algorithm.importanceWeight as any);
    const durationWeight = parseFloat(algorithm.durationWeight as any);
    const remainingDaysWeight = parseFloat(algorithm.remainingDaysWeight as any);

    // Extract parameters with defaults
    const estimatedHours = input.estimatedHours || 0;
    const priority = input.priority || 1;
    
    // Calculate urgency and remaining days based on deadline
    let urgency = 1; // default urgency
    let remainingDays = 0; // days remaining until deadline
    
    if (input.plannedStartDate && input.plannedEndDate) {
      const now = new Date();
      const deadline = new Date(input.plannedEndDate);
      const start = new Date(input.plannedStartDate);
      
      // Calculate days until deadline (can be negative if overdue)
      const daysUntilDeadline = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      remainingDays = Math.max(0, Math.round(daysUntilDeadline)); // Round to nearest day, minimum 0
      
      const totalDuration = Math.max(1, (deadline.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      
      // Urgency increases as deadline approaches
      // Scale from 1 (far away) to 5 (very urgent)
      if (daysUntilDeadline <= 1) {
        urgency = 5;
      } else if (daysUntilDeadline <= 3) {
        urgency = 4;
      } else if (daysUntilDeadline <= 7) {
        urgency = 3;
      } else if (daysUntilDeadline <= 14) {
        urgency = 2;
      } else {
        urgency = 1;
      }
    }

    // Calculate bounty using the algorithm formula
    // New formula includes remaining days as a dimension
    const bountyAmount = 
      baseAmount +
      (urgency * urgencyWeight) +
      (priority * importanceWeight) +
      (estimatedHours * durationWeight) +
      (remainingDays * remainingDaysWeight);

    // Ensure bounty is non-negative
    const finalAmount = Math.max(0, bountyAmount);

    return {
      amount: parseFloat(finalAmount.toFixed(2)),
      algorithmVersion: algorithm.version,
    };
  }

  /**
   * Get the current active bounty algorithm
   * Returns the most recent algorithm based on effective_from date
   */
  async getCurrentAlgorithm(): Promise<BountyAlgorithm | null> {
    const query = `
      SELECT 
        id, version, base_amount as "baseAmount",
        urgency_weight as "urgencyWeight", importance_weight as "importanceWeight",
        duration_weight as "durationWeight", remaining_days_weight as "remainingDaysWeight",
        formula, effective_from as "effectiveFrom", created_by as "createdBy",
        created_at as "createdAt"
      FROM bounty_algorithms
      WHERE effective_from <= NOW()
      ORDER BY effective_from DESC
      LIMIT 1
    `;

    const result = await pool.query(query);
    return result.rows[0] || null;
  }

  /**
   * Get a specific bounty algorithm by version
   */
  async getAlgorithmByVersion(version: string): Promise<BountyAlgorithm | null> {
    const query = `
      SELECT 
        id, version, base_amount as "baseAmount",
        urgency_weight as "urgencyWeight", importance_weight as "importanceWeight",
        duration_weight as "durationWeight", remaining_days_weight as "remainingDaysWeight",
        formula, effective_from as "effectiveFrom", created_by as "createdBy",
        created_at as "createdAt"
      FROM bounty_algorithms
      WHERE version = $1
    `;

    const result = await pool.query(query, [version]);
    return result.rows[0] || null;
  }

  /**
   * Create a new bounty algorithm
   * Requirements 20.1, 20.2, 20.3: Algorithm management and versioning
   */
  async createAlgorithm(algorithmData: BountyAlgorithmCreateDTO): Promise<BountyAlgorithm> {
    const {
      version,
      baseAmount,
      urgencyWeight,
      importanceWeight,
      durationWeight,
      remainingDaysWeight,
      formula,
      effectiveFrom = new Date(),
      createdBy,
    } = algorithmData;

    // Validate weights are non-negative
    Validator.nonNegative(urgencyWeight, 'Urgency weight');
    Validator.nonNegative(importanceWeight, 'Importance weight');
    Validator.nonNegative(durationWeight, 'Duration weight');
    Validator.nonNegative(remainingDaysWeight, 'Remaining days weight');

    // Validate base amount is non-negative
    Validator.bountyAmount(baseAmount, 'Base amount');

    const query = `
      INSERT INTO bounty_algorithms (
        version, base_amount, urgency_weight, importance_weight,
        duration_weight, remaining_days_weight, formula, effective_from, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING 
        id, version, base_amount as "baseAmount",
        urgency_weight as "urgencyWeight", importance_weight as "importanceWeight",
        duration_weight as "durationWeight", remaining_days_weight as "remainingDaysWeight",
        formula, effective_from as "effectiveFrom", created_by as "createdBy",
        created_at as "createdAt"
    `;

    const values = [
      version,
      baseAmount,
      urgencyWeight,
      importanceWeight,
      durationWeight,
      remainingDaysWeight,
      formula,
      effectiveFrom,
      createdBy,
    ];

    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error: any) {
      if (error.code === '23505') { // Unique violation
        throw new ValidationError('Algorithm version already exists');
      }
      throw error;
    }
  }

  /**
   * Get all bounty algorithms ordered by effective date
   */
  async getAllAlgorithms(): Promise<BountyAlgorithm[]> {
    const query = `
      SELECT 
        id, version, base_amount as "baseAmount",
        urgency_weight as "urgencyWeight", importance_weight as "importanceWeight",
        duration_weight as "durationWeight", remaining_days_weight as "remainingDaysWeight",
        formula, effective_from as "effectiveFrom", created_by as "createdBy",
        created_at as "createdAt"
      FROM bounty_algorithms
      ORDER BY effective_from DESC
    `;

    const result = await pool.query(query);
    return result.rows;
  }

  /**
   * Recalculate bounty for an unsettled task
   * Requirement 19.3: Recalculate bounty when task attributes change
   * Requirement 19.5: Only recalculate for unsettled tasks
   */
  async recalculateBounty(task: Task): Promise<{ amount: number; algorithmVersion: string }> {
    // Check if task bounty is already settled
    if (task.isBountySettled) {
      throw new ValidationError('Cannot recalculate bounty for settled tasks');
    }

    // Calculate new bounty using current algorithm
    const calculationInput: BountyCalculationInput = {
      estimatedHours: task.estimatedHours,
      complexity: task.complexity,
      priority: task.priority,
      plannedStartDate: task.plannedStartDate,
      plannedEndDate: task.plannedEndDate,
    };

    return this.calculateBounty(calculationInput);
  }

  /**
   * Update task bounty in database
   * Used internally after bounty calculation or recalculation
   */
  async updateTaskBounty(taskId: string, amount: number, algorithmVersion: string): Promise<void> {
    const query = `
      UPDATE tasks
      SET 
        bounty_amount = $1,
        bounty_algorithm_version = $2,
        updated_at = NOW()
      WHERE id = $3
    `;

    await pool.query(query, [amount, algorithmVersion, taskId]);
  }

  /**
   * Settle task bounty (mark as settled, preventing further recalculation)
   * Called when task is completed and bounty is distributed
   */
  async settleBounty(taskId: string): Promise<void> {
    const query = `
      UPDATE tasks
      SET 
        is_bounty_settled = true,
        updated_at = NOW()
      WHERE id = $1
    `;

    await pool.query(query, [taskId]);
  }
}
