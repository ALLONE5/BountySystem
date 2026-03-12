import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/Logger.js';
import { 
  ValidationError, 
  NotFoundError, 
  AuthorizationError, 
  ConflictError 
} from '../utils/errors.js';
import { ERROR_MESSAGES } from '../constants/AppConstants.js';

export interface ErrorResponse {
  error: string;
  type: string;
  details?: any;
  timestamp: string;
  path: string;
  method: string;
}

/**
 * Global error handling middleware
 * Provides consistent error responses and logging
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const timestamp = new Date().toISOString();
  const path = req.path;
  const method = req.method;

  // Log error with context
  logger.error('Request error occurred', {
    error: error.message,
    stack: error.stack,
    path,
    method,
    userId: req.user?.userId,
    body: req.body,
    query: req.query,
    params: req.params
  });

  let statusCode = 500;
  let errorResponse: ErrorResponse = {
    error: ERROR_MESSAGES.INTERNAL_ERROR,
    type: 'InternalServerError',
    timestamp,
    path,
    method
  };

  // Handle specific error types
  if (error instanceof ValidationError) {
    statusCode = 400;
    errorResponse = {
      error: error.message,
      type: 'ValidationError',
      details: error.details,
      timestamp,
      path,
      method
    };
  } else if (error instanceof NotFoundError) {
    statusCode = 404;
    errorResponse = {
      error: error.message,
      type: 'NotFoundError',
      timestamp,
      path,
      method
    };
  } else if (error instanceof AuthorizationError) {
    statusCode = 403;
    errorResponse = {
      error: error.message,
      type: 'AuthorizationError',
      timestamp,
      path,
      method
    };
  } else if (error instanceof ConflictError) {
    statusCode = 409;
    errorResponse = {
      error: error.message,
      type: 'ConflictError',
      timestamp,
      path,
      method
    };
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorResponse = {
      error: ERROR_MESSAGES.UNAUTHORIZED,
      type: 'AuthenticationError',
      timestamp,
      path,
      method
    };
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    errorResponse = {
      error: 'Token expired',
      type: 'TokenExpiredError',
      timestamp,
      path,
      method
    };
  } else if (error.name === 'SyntaxError' && 'body' in error) {
    statusCode = 400;
    errorResponse = {
      error: 'Invalid JSON in request body',
      type: 'SyntaxError',
      timestamp,
      path,
      method
    };
  }

  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    errorResponse.error = ERROR_MESSAGES.INTERNAL_ERROR;
    delete errorResponse.details;
  }

  res.status(statusCode).json(errorResponse);
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch and forward errors
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 404 handler for unmatched routes
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  const errorResponse: ErrorResponse = {
    error: `Route ${req.method} ${req.path} not found`,
    type: 'NotFoundError',
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  };

  logger.warn('Route not found', {
    path: req.path,
    method: req.method,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });

  res.status(404).json(errorResponse);
};

/**
 * Validation error handler for request validation
 */
export const validationErrorHandler = (
  errors: any[],
  req: Request,
  res: Response
): void => {
  const errorResponse: ErrorResponse = {
    error: ERROR_MESSAGES.VALIDATION_FAILED,
    type: 'ValidationError',
    details: errors,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  };

  logger.warn('Validation failed', {
    path: req.path,
    method: req.method,
    errors,
    body: req.body
  });

  res.status(400).json(errorResponse);
};