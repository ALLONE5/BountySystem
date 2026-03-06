import { TaskAssistant } from '../../models/TaskAssistant.js';

export class TaskAssistantMapper {
  /**
   * Map database row to TaskAssistant model
   */
  static mapRowToTaskAssistant(row: any): TaskAssistant {
    if (!row) return null;

    return {
      id: row.id,
      taskId: row.task_id,
      userId: row.user_id,
      allocationType: row.allocation_type,
      allocationValue: parseFloat(row.allocation_value),
      addedAt: row.added_at,
      user: row.username ? {
        id: row.user_id,
        username: row.username,
        email: row.email,
        avatarUrl: row.avatar_url
      } : undefined
    };
  }

  /**
   * Map TaskAssistant model to database row
   */
  static mapTaskAssistantToRow(assistant: Partial<TaskAssistant>): any {
    const row: any = {};

    if (assistant.id !== undefined) row.id = assistant.id;
    if (assistant.taskId !== undefined) row.task_id = assistant.taskId;
    if (assistant.userId !== undefined) row.user_id = assistant.userId;
    if (assistant.allocationType !== undefined) row.allocation_type = assistant.allocationType;
    if (assistant.allocationValue !== undefined) row.allocation_value = assistant.allocationValue;
    if (assistant.addedAt !== undefined) row.added_at = assistant.addedAt;

    return row;
  }

  /**
   * Map array of database rows to TaskAssistant models
   */
  static mapRowsToTaskAssistants(rows: any[]): TaskAssistant[] {
    return rows.map(row => this.mapRowToTaskAssistant(row)).filter(assistant => assistant !== null);
  }

  /**
   * Calculate bounty allocation for assistant
   */
  static calculateBountyAllocation(
    assistant: TaskAssistant,
    totalBounty: number,
    totalFixedAllocations: number = 0
  ): number {
    if (assistant.allocationType === 'fixed') {
      return assistant.allocationValue;
    } else if (assistant.allocationType === 'percentage') {
      // For percentage, calculate from remaining bounty after fixed allocations
      const remainingBounty = Math.max(0, totalBounty - totalFixedAllocations);
      return (remainingBounty * assistant.allocationValue) / 100;
    }
    return 0;
  }

  /**
   * Validate allocation constraints
   */
  static validateAllocation(
    assistants: TaskAssistant[],
    totalBounty: number
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    let totalPercentage = 0;
    let totalFixed = 0;

    assistants.forEach(assistant => {
      if (assistant.allocationType === 'percentage') {
        totalPercentage += assistant.allocationValue;
      } else if (assistant.allocationType === 'fixed') {
        totalFixed += assistant.allocationValue;
      }
    });

    // Check if fixed allocations exceed total bounty
    if (totalFixed > totalBounty) {
      errors.push(`Fixed allocations (${totalFixed}) exceed total bounty (${totalBounty})`);
    }

    // Check if percentage allocations exceed 100%
    if (totalPercentage > 100) {
      errors.push(`Percentage allocations (${totalPercentage}%) exceed 100%`);
    }

    // Check if total allocations exceed bounty
    const remainingBountyForPercentage = Math.max(0, totalBounty - totalFixed);
    const percentageAmount = (remainingBountyForPercentage * totalPercentage) / 100;
    const totalAllocated = totalFixed + percentageAmount;

    if (totalAllocated > totalBounty) {
      errors.push(`Total allocations (${totalAllocated}) exceed total bounty (${totalBounty})`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Format allocation for display
   */
  static formatAllocation(assistant: TaskAssistant): string {
    if (assistant.allocationType === 'percentage') {
      return `${assistant.allocationValue}%`;
    } else if (assistant.allocationType === 'fixed') {
      return `$${assistant.allocationValue.toFixed(2)}`;
    }
    return 'Unknown';
  }
}