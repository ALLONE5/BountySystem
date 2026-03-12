/**
 * Centralized error logging utility
 * Reduces code duplication for error handling patterns
 */

import { logger } from '../config/logger.js';

/**
 * Log an error with context information
 * @param message - Error message describing what failed
 * @param error - The error object
 * @param context - Additional context (optional)
 */
export function logError(
  message: string,
  error: unknown,
  context?: Record<string, unknown>
): void {
  const errorObj = error instanceof Error ? error : new Error(String(error));
  
  if (context && Object.keys(context).length > 0) {
    logger.error(message, { error: errorObj, ...context });
  } else {
    logger.error(message, { error: errorObj });
  }
}

/**
 * Log a warning with context information
 * @param message - Warning message
 * @param context - Additional context (optional)
 */
export function logWarning(
  message: string,
  context?: Record<string, unknown>
): void {
  if (context && Object.keys(context).length > 0) {
    logger.warn(message, context);
  } else {
    logger.warn(message);
  }
}

/**
 * Log an info message with context
 * @param message - Info message
 * @param context - Additional context (optional)
 */
export function logInfo(
  message: string,
  context?: Record<string, unknown>
): void {
  if (context && Object.keys(context).length > 0) {
    logger.info(message, context);
  } else {
    logger.info(message);
  }
}

/**
 * Wrap async operations with error logging
 * @param operation - The async operation to execute
 * @param errorMessage - Error message if operation fails
 * @param context - Additional context for logging
 * @returns Result of the operation or undefined on error
 */
export async function withErrorLogging<T>(
  operation: () => Promise<T>,
  errorMessage: string,
  context?: Record<string, unknown>
): Promise<T | undefined> {
  try {
    return await operation();
  } catch (error) {
    logError(errorMessage, error, context);
    return undefined;
  }
}

/**
 * Execute operation with error logging and rethrow
 * @param operation - The async operation to execute
 * @param errorMessage - Error message if operation fails
 * @param context - Additional context for logging
 * @returns Result of the operation
 * @throws Re-throws the original error after logging
 */
export async function withErrorLoggingAndThrow<T>(
  operation: () => Promise<T>,
  errorMessage: string,
  context?: Record<string, unknown>
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    logError(errorMessage, error, context);
    throw error;
  }
}
