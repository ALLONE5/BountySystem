import { NotFoundError } from './errors.js';
import { Task } from '../models/Task.js';
import { User } from '../models/User.js';
import { TaskGroup } from '../models/TaskGroup.js';
import { Position } from '../models/Position.js';

/**
 * Service Helper Utilities
 * Provides common helper methods to reduce code duplication across services
 */
export class ServiceHelpers {
  /**
   * Get task or throw NotFoundError if not found
   * Reduces repetitive null checking in TaskService
   */
  static getTaskOrThrow(task: Task | null, taskId: string): Task {
    if (!task) {
      throw new NotFoundError(`Task with ID ${taskId} not found`);
    }
    return task;
  }

  /**
   * Get user or throw NotFoundError if not found
   * Reduces repetitive null checking across services
   */
  static getUserOrThrow(user: User | null, userId: string): User {
    if (!user) {
      throw new NotFoundError(`User with ID ${userId} not found`);
    }
    return user;
  }

  /**
   * Get group or throw NotFoundError if not found
   * Reduces repetitive null checking in GroupService
   */
  static getGroupOrThrow(group: TaskGroup | null, groupId: string): TaskGroup {
    if (!group) {
      throw new NotFoundError(`Group with ID ${groupId} not found`);
    }
    return group;
  }

  /**
   * Get position or throw NotFoundError if not found
   * Reduces repetitive null checking in PositionService
   */
  static getPositionOrThrow(position: Position | null, positionId: string): Position {
    if (!position) {
      throw new NotFoundError(`Position with ID ${positionId} not found`);
    }
    return position;
  }

  /**
   * Get user or return null (for optional user checks)
   * Used in permission checking where null is acceptable
   */
  static getUserOrNull(user: User | null): User | null {
    return user;
  }

  /**
   * Validate required fields are present
   * Reduces repetitive validation code
   */
  static validateRequiredFields(data: Record<string, any>, requiredFields: string[]): void {
    const missingFields = requiredFields.filter(field => 
      data[field] === undefined || data[field] === null || data[field] === ''
    );
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
  }

  /**
   * Safe array access with default value
   * Prevents undefined errors when accessing array elements
   */
  static safeArrayAccess<T>(array: T[] | undefined | null, index: number, defaultValue: T): T {
    if (!array || index < 0 || index >= array.length) {
      return defaultValue;
    }
    return array[index];
  }

  /**
   * Safe object property access with default value
   * Prevents undefined errors when accessing nested properties
   */
  static safePropertyAccess<T>(obj: any, path: string, defaultValue: T): T {
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
      if (current === null || current === undefined || !(key in current)) {
        return defaultValue;
      }
      current = current[key];
    }
    
    return current !== undefined ? current : defaultValue;
  }
}