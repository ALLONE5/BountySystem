import type { PoolClient } from 'pg';
import { pool } from '../config/database.js';
import { OwnershipError, NotFoundError } from './errors.js';

/**
 * Ownership Validator Utility
 * Centralizes resource ownership checking logic across all services
 * 
 * Requirements: 10.2, 10.5
 * 
 * All methods throw OwnershipError when validation fails, providing
 * consistent error responses across the application.
 */
export class OwnershipValidator {
  /**
   * Validate task ownership
   * Verifies that the specified user is the publisher (owner) of the task
   * 
   * @param taskId - Task ID to validate
   * @param userId - User ID to check ownership against
   * @param client - Optional database client for transaction support
   * @throws NotFoundError if task doesn't exist
   * @throws OwnershipError if user is not the task owner
   * 
   * Requirement 10.2: Correctly determine ownership based on database relationships
   * Requirement 10.5: Return consistent error responses
   */
  static async validateTaskOwnership(
    taskId: string,
    userId: string,
    client?: PoolClient
  ): Promise<void> {
    const query = `
      SELECT id, publisher_id as "publisherId"
      FROM tasks
      WHERE id = $1
    `;

    const dbClient = client || pool;
    const result = await dbClient.query(query, [taskId]);

    if (result.rows.length === 0) {
      throw new NotFoundError('Task not found');
    }

    const task = result.rows[0];

    if (task.publisherId !== userId) {
      throw new OwnershipError(
        'You do not own this task',
        userId,
        'task',
        taskId
      );
    }
  }

  /**
   * Validate group ownership
   * Verifies that the specified user is the creator (owner) of the group
   * 
   * @param groupId - Group ID to validate
   * @param userId - User ID to check ownership against
   * @param client - Optional database client for transaction support
   * @throws NotFoundError if group doesn't exist
   * @throws OwnershipError if user is not the group creator
   * 
   * Requirement 10.2: Correctly determine ownership based on database relationships
   * Requirement 10.5: Return consistent error responses
   */
  static async validateGroupOwnership(
    groupId: string,
    userId: string,
    client?: PoolClient
  ): Promise<void> {
    const query = `
      SELECT id, creator_id as "creatorId"
      FROM task_groups
      WHERE id = $1
    `;

    const dbClient = client || pool;
    const result = await dbClient.query(query, [groupId]);

    if (result.rows.length === 0) {
      throw new NotFoundError('Group not found');
    }

    const group = result.rows[0];

    if (group.creatorId !== userId) {
      throw new OwnershipError(
        'You do not own this group',
        userId,
        'group',
        groupId
      );
    }
  }

  /**
   * Validate position ownership
   * Verifies that the specified user has been granted the position
   * Note: Positions don't have a traditional "owner" - instead we check
   * if the user has been granted the position via user_positions table
   * 
   * @param positionId - Position ID to validate
   * @param userId - User ID to check ownership against
   * @param client - Optional database client for transaction support
   * @throws NotFoundError if position doesn't exist
   * @throws OwnershipError if user doesn't have the position
   * 
   * Requirement 10.2: Correctly determine ownership based on database relationships
   * Requirement 10.5: Return consistent error responses
   */
  static async validatePositionOwnership(
    positionId: string,
    userId: string,
    client?: PoolClient
  ): Promise<void> {
    // First check if position exists
    const positionQuery = `
      SELECT id
      FROM positions
      WHERE id = $1
    `;

    const dbClient = client || pool;
    const positionResult = await dbClient.query(positionQuery, [positionId]);

    if (positionResult.rows.length === 0) {
      throw new NotFoundError('Position not found');
    }

    // Check if user has been granted this position
    const userPositionQuery = `
      SELECT id
      FROM user_positions
      WHERE user_id = $1 AND position_id = $2
    `;

    const userPositionResult = await dbClient.query(userPositionQuery, [userId, positionId]);

    if (userPositionResult.rows.length === 0) {
      throw new OwnershipError(
        'You do not have this position',
        userId,
        'position',
        positionId
      );
    }
  }

  /**
   * Validate resource ownership (generic method)
   * Routes to the appropriate specific validation method based on resource type
   * 
   * @param resourceType - Type of resource ('task', 'group', or 'position')
   * @param resourceId - Resource ID to validate
   * @param userId - User ID to check ownership against
   * @param client - Optional database client for transaction support
   * @throws NotFoundError if resource doesn't exist
   * @throws OwnershipError if user doesn't own the resource
   * @throws Error if resourceType is invalid
   * 
   * Requirement 10.2: Support task ownership, group ownership, and position ownership checks
   * Requirement 10.5: Return consistent error responses
   */
  static async validateResourceOwnership(
    resourceType: 'task' | 'group' | 'position',
    resourceId: string,
    userId: string,
    client?: PoolClient
  ): Promise<void> {
    switch (resourceType) {
      case 'task':
        return this.validateTaskOwnership(resourceId, userId, client);
      case 'group':
        return this.validateGroupOwnership(resourceId, userId, client);
      case 'position':
        return this.validatePositionOwnership(resourceId, userId, client);
      default:
        throw new Error(`Invalid resource type: ${resourceType}`);
    }
  }
}
