import { ValidationError } from './errors.js';

/**
 * Unified validation utility
 * Provides common validation methods to reduce code duplication
 */
export class Validator {
  /**
   * Validate required field
   */
  static required(value: any, fieldName: string): void {
    if (value === null || value === undefined || value === '') {
      throw new ValidationError(`${fieldName} is required`);
    }
  }

  /**
   * Validate value is a string
   */
  static string(value: any, fieldName: string): void {
    if (typeof value !== 'string') {
      throw new ValidationError(`${fieldName} must be a string`);
    }
  }

  /**
   * Validate value is a number
   */
  static number(value: any, fieldName: string): void {
    if (typeof value !== 'number' || isNaN(value)) {
      throw new ValidationError(`${fieldName} must be a valid number`);
    }
  }

  /**
   * Validate string is not empty after trimming
   */
  static notEmpty(value: string, fieldName: string): void {
    if (!value || value.trim().length === 0) {
      throw new ValidationError(`${fieldName} cannot be empty`);
    }
  }

  /**
   * Validate minimum length
   */
  static minLength(value: string, min: number, fieldName: string): void {
    if (value.length < min) {
      throw new ValidationError(`${fieldName} must be at least ${min} characters`);
    }
  }

  /**
   * Validate maximum length
   */
  static maxLength(value: string, max: number, fieldName: string): void {
    if (value.length > max) {
      throw new ValidationError(`${fieldName} must be at most ${max} characters`);
    }
  }

  /**
   * Validate email format
   */
  static email(value: string, fieldName: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      throw new ValidationError(`${fieldName} must be a valid email address`);
    }
  }

  /**
   * Validate UUID format
   */
  static uuid(value: string, fieldName: string): void {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(value)) {
      throw new ValidationError(`${fieldName} must be a valid UUID`);
    }
  }

  /**
   * Validate minimum value for numbers
   */
  static min(value: number, min: number, fieldName: string): void {
    if (value < min) {
      throw new ValidationError(`${fieldName} must be at least ${min}`);
    }
  }

  /**
   * Validate maximum value for numbers
   */
  static max(value: number, max: number, fieldName: string): void {
    if (value > max) {
      throw new ValidationError(`${fieldName} must be at most ${max}`);
    }
  }

  /**
   * Validate number range
   */
  static range(value: number, min: number, max: number, fieldName: string): void {
    if (value < min || value > max) {
      throw new ValidationError(`${fieldName} must be between ${min} and ${max}`);
    }
  }

  /**
   * Validate positive number
   */
  static positive(value: number, fieldName: string): void {
    if (value <= 0) {
      throw new ValidationError(`${fieldName} must be a positive number`);
    }
  }

  /**
   * Validate non-negative number
   */
  static nonNegative(value: number, fieldName: string): void {
    if (value < 0) {
      throw new ValidationError(`${fieldName} must be non-negative`);
    }
  }

  /**
   * Validate enum value
   */
  static enum<T>(value: T, allowedValues: T[], fieldName: string): void {
    if (!allowedValues.includes(value)) {
      throw new ValidationError(
        `${fieldName} must be one of: ${allowedValues.join(', ')}`
      );
    }
  }

  /**
   * Validate value is a valid date
   */
  static date(value: any, fieldName: string): void {
    const date = value instanceof Date ? value : new Date(value);
    if (isNaN(date.getTime())) {
      throw new ValidationError(`${fieldName} must be a valid date`);
    }
  }

  /**
   * Validate array not empty
   */
  static arrayNotEmpty<T>(value: T[], fieldName: string): void {
    if (!Array.isArray(value) || value.length === 0) {
      throw new ValidationError(`${fieldName} must be a non-empty array`);
    }
  }

  /**
   * Validate date is in the future
   */
  static futureDate(value: Date, fieldName: string): void {
    if (value <= new Date()) {
      throw new ValidationError(`${fieldName} must be a future date`);
    }
  }

  /**
   * Validate date is in the past
   */
  static pastDate(value: Date, fieldName: string): void {
    if (value >= new Date()) {
      throw new ValidationError(`${fieldName} must be a past date`);
    }
  }

  /**
   * Validate date range (start before end)
   */
  static dateRange(start: Date, end: Date, startFieldName: string, endFieldName: string): void {
    if (start >= end) {
      throw new ValidationError(`${startFieldName} must be before ${endFieldName}`);
    }
  }

  /**
   * Validate object has required keys
   */
  static hasKeys(obj: any, keys: string[], objectName: string): void {
    const missingKeys = keys.filter(key => !(key in obj));
    if (missingKeys.length > 0) {
      throw new ValidationError(
        `${objectName} is missing required keys: ${missingKeys.join(', ')}`
      );
    }
  }

  /**
   * Validate URL format
   */
  static url(value: string, fieldName: string): void {
    try {
      new URL(value);
    } catch {
      throw new ValidationError(`${fieldName} must be a valid URL`);
    }
  }

  /**
   * Validate phone number (basic format)
   */
  static phone(value: string, fieldName: string): void {
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (!phoneRegex.test(value) || value.replace(/\D/g, '').length < 10) {
      throw new ValidationError(`${fieldName} must be a valid phone number`);
    }
  }

  /**
   * Custom validation with predicate
   */
  static custom(
    value: any,
    predicate: (val: any) => boolean,
    fieldName: string,
    errorMessage?: string
  ): void {
    if (!predicate(value)) {
      throw new ValidationError(
        errorMessage || `${fieldName} failed custom validation`
      );
    }
  }

  // ========================================
  // Task-specific validation methods
  // ========================================

  /**
   * Validate task status is one of the allowed values
   * Consolidates duplicate status validation across services
   */
  static taskStatus(status: string, fieldName: string = 'Task status'): void {
    const validStatuses = [
      'not_started',
      'available',
      'pending_acceptance',
      'in_progress',
      'completed',
      'abandoned'
    ];
    
    if (!validStatuses.includes(status)) {
      throw new ValidationError(
        `${fieldName} must be one of: ${validStatuses.join(', ')}`
      );
    }
  }

  /**
   * Validate bounty amount is non-negative
   * Consolidates duplicate bounty validation across services
   */
  static bountyAmount(amount: number, fieldName: string = 'Bounty amount'): void {
    if (typeof amount !== 'number' || isNaN(amount)) {
      throw new ValidationError(`${fieldName} must be a valid number`);
    }
    
    if (amount < 0) {
      throw new ValidationError(`${fieldName} must be non-negative`);
    }
  }

  /**
   * Validate task rating (1-5 scale)
   * Consolidates rating validation from TaskReviewService
   */
  static taskRating(rating: number, fieldName: string = 'Rating'): void {
    if (typeof rating !== 'number' || isNaN(rating)) {
      throw new ValidationError(`${fieldName} must be a valid number`);
    }
    
    if (rating < 1 || rating > 5) {
      throw new ValidationError(`${fieldName} must be between 1 and 5`);
    }
  }

  /**
   * Validate task title meets length requirements
   * Consolidates title validation patterns
   */
  static taskTitle(title: string, fieldName: string = 'Task title'): void {
    this.required(title, fieldName);
    this.string(title, fieldName);
    this.notEmpty(title, fieldName);
    
    const trimmedTitle = title.trim();
    if (trimmedTitle.length < 3) {
      throw new ValidationError(`${fieldName} must be at least 3 characters`);
    }
    
    if (trimmedTitle.length > 200) {
      throw new ValidationError(`${fieldName} must be at most 200 characters`);
    }
  }

  // ========================================
  // Permission validation methods
  // ========================================

  /**
   * Validate user is admin (SUPER_ADMIN, DEVELOPER, or POSITION_ADMIN)
   * Consolidates admin check patterns across services
   */
  static isAdmin(userRole: string): boolean {
    return userRole === 'super_admin' || userRole === 'developer' || userRole === 'position_admin';
  }

  /**
   * Validate user is super admin or developer
   * Consolidates super admin check patterns
   */
  static isSuperAdmin(userRole: string): boolean {
    return userRole === 'super_admin' || userRole === 'developer';
  }

  /**
   * Validate user has permission (is owner or admin)
   * Consolidates ownership/admin check patterns
   */
  static hasPermission(userId: string, ownerId: string, userRole: string): boolean {
    return userId === ownerId || this.isAdmin(userRole);
  }

  /**
   * Validate user is one of multiple possible owners or admin
   * Consolidates multi-owner permission patterns
   */
  static hasAnyPermission(
    userId: string,
    ownerIds: (string | null | undefined)[],
    userRole: string
  ): boolean {
    const validOwnerIds = ownerIds.filter((id): id is string => id !== null && id !== undefined);
    return validOwnerIds.includes(userId) || this.isAdmin(userRole);
  }
}
