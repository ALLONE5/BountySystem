/**
 * Response helper utilities
 * Provides consistent response formats across the application
 */

import type { Response } from 'express';

/**
 * Send a success response
 * @param res - Express response object
 * @param data - Response data
 * @param statusCode - HTTP status code (default: 200)
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode: number = 200
): Response {
  return res.status(statusCode).json({
    success: true,
    data,
  });
}

/**
 * Send a success response with a message
 * @param res - Express response object
 * @param message - Success message
 * @param data - Optional response data
 * @param statusCode - HTTP status code (default: 200)
 */
export function sendSuccessWithMessage<T>(
  res: Response,
  message: string,
  data?: T,
  statusCode: number = 200
): Response {
  const response: any = {
    success: true,
    message,
  };
  
  if (data !== undefined) {
    response.data = data;
  }
  
  return res.status(statusCode).json(response);
}

/**
 * Send an error response
 * @param res - Express response object
 * @param error - Error message
 * @param statusCode - HTTP status code (default: 400)
 */
export function sendError(
  res: Response,
  error: string,
  statusCode: number = 400
): Response {
  return res.status(statusCode).json({
    success: false,
    error,
  });
}

/**
 * Send a validation error response
 * @param res - Express response object
 * @param error - Error message
 */
export function sendValidationError(
  res: Response,
  error: string
): Response {
  return sendError(res, error, 400);
}

/**
 * Send a not found error response
 * @param res - Express response object
 * @param resource - Resource name (e.g., 'User', 'Task')
 */
export function sendNotFound(
  res: Response,
  resource: string = 'Resource'
): Response {
  return sendError(res, `${resource} not found`, 404);
}

/**
 * Send an unauthorized error response
 * @param res - Express response object
 * @param message - Optional custom message
 */
export function sendUnauthorized(
  res: Response,
  message: string = 'Unauthorized'
): Response {
  return sendError(res, message, 401);
}

/**
 * Send a forbidden error response
 * @param res - Express response object
 * @param message - Optional custom message
 */
export function sendForbidden(
  res: Response,
  message: string = 'Forbidden'
): Response {
  return sendError(res, message, 403);
}

/**
 * Send a created response (201)
 * @param res - Express response object
 * @param data - Created resource data
 */
export function sendCreated<T>(
  res: Response,
  data: T
): Response {
  return sendSuccess(res, data, 201);
}

/**
 * Send a no content response (204)
 * @param res - Express response object
 */
export function sendNoContent(res: Response): Response {
  return res.status(204).send();
}

