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
}
