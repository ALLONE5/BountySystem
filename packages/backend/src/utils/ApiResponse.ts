import { Response } from 'express';
import { logger } from './Logger.js';

/**
 * Standard API Response Format
 * Provides consistent response structure across all endpoints
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: any[];
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    timestamp: string;
    requestId?: string;
  };
}

/**
 * API Response Builder
 * Utility class for building consistent API responses
 */
export class ApiResponseBuilder {
  /**
   * Send success response with data
   */
  static success<T>(
    res: Response,
    data: T,
    message?: string,
    statusCode: number = 200,
    meta?: ApiResponse<T>['meta']
  ): void {
    const response: ApiResponse<T> = {
      success: true,
      data,
      message,
      meta: {
        timestamp: new Date().toISOString(),
        ...meta
      }
    };

    res.status(statusCode).json(response);
  }

  /**
   * Send success response without data
   */
  static successMessage(
    res: Response,
    message: string,
    statusCode: number = 200
  ): void {
    const response: ApiResponse = {
      success: true,
      message,
      meta: {
        timestamp: new Date().toISOString()
      }
    };

    res.status(statusCode).json(response);
  }

  /**
   * Send paginated success response
   */
  static successPaginated<T>(
    res: Response,
    data: T[],
    pagination: {
      page: number;
      limit: number;
      total: number;
    },
    message?: string
  ): void {
    const totalPages = Math.ceil(pagination.total / pagination.limit);
    
    const response: ApiResponse<T[]> = {
      success: true,
      data,
      message,
      meta: {
        pagination: {
          ...pagination,
          totalPages
        },
        timestamp: new Date().toISOString()
      }
    };

    res.status(200).json(response);
  }

  /**
   * Send error response
   */
  static error(
    res: Response,
    error: string,
    statusCode: number = 500,
    details?: any
  ): void {
    const response: ApiResponse = {
      success: false,
      error,
      meta: {
        timestamp: new Date().toISOString()
      }
    };

    if (details) {
      response.errors = Array.isArray(details) ? details : [details];
    }

    // Log error for monitoring
    logger.error('API Error Response', {
      error,
      statusCode,
      details,
      path: res.req?.path,
      method: res.req?.method
    });

    res.status(statusCode).json(response);
  }

  /**
   * Send validation error response
   */
  static validationError(
    res: Response,
    errors: any[],
    message: string = 'Validation failed'
  ): void {
    const response: ApiResponse = {
      success: false,
      error: message,
      errors,
      meta: {
        timestamp: new Date().toISOString()
      }
    };

    logger.warn('Validation Error', {
      errors,
      path: res.req?.path,
      method: res.req?.method
    });

    res.status(400).json(response);
  }

  /**
   * Send not found error response
   */
  static notFound(
    res: Response,
    resource: string = 'Resource'
  ): void {
    ApiResponseBuilder.error(res, `${resource} not found`, 404);
  }

  /**
   * Send unauthorized error response
   */
  static unauthorized(
    res: Response,
    message: string = 'Unauthorized access'
  ): void {
    ApiResponseBuilder.error(res, message, 401);
  }

  /**
   * Send forbidden error response
   */
  static forbidden(
    res: Response,
    message: string = 'Access forbidden'
  ): void {
    ApiResponseBuilder.error(res, message, 403);
  }

  /**
   * Send conflict error response
   */
  static conflict(
    res: Response,
    message: string = 'Resource conflict'
  ): void {
    ApiResponseBuilder.error(res, message, 409);
  }

  /**
   * Send rate limit error response
   */
  static rateLimitExceeded(
    res: Response,
    message: string = 'Rate limit exceeded'
  ): void {
    ApiResponseBuilder.error(res, message, 429);
  }

  /**
   * Send internal server error response
   */
  static internalError(
    res: Response,
    message: string = 'Internal server error'
  ): void {
    ApiResponseBuilder.error(res, message, 500);
  }
}

/**
 * Express middleware to add response helpers to res object
 */
export const addResponseHelpers = (req: any, res: any, next: any) => {
  res.apiSuccess = (data: any, message?: string, statusCode?: number, meta?: any) => {
    ApiResponseBuilder.success(res, data, message, statusCode, meta);
  };

  res.apiSuccessMessage = (message: string, statusCode?: number) => {
    ApiResponseBuilder.successMessage(res, message, statusCode);
  };

  res.apiSuccessPaginated = (data: any[], pagination: any, message?: string) => {
    ApiResponseBuilder.successPaginated(res, data, pagination, message);
  };

  res.apiError = (error: string, statusCode?: number, details?: any) => {
    ApiResponseBuilder.error(res, error, statusCode, details);
  };

  res.apiValidationError = (errors: any[], message?: string) => {
    ApiResponseBuilder.validationError(res, errors, message);
  };

  res.apiNotFound = (resource?: string) => {
    ApiResponseBuilder.notFound(res, resource);
  };

  res.apiUnauthorized = (message?: string) => {
    ApiResponseBuilder.unauthorized(res, message);
  };

  res.apiForbidden = (message?: string) => {
    ApiResponseBuilder.forbidden(res, message);
  };

  res.apiConflict = (message?: string) => {
    ApiResponseBuilder.conflict(res, message);
  };

  res.apiRateLimitExceeded = (message?: string) => {
    ApiResponseBuilder.rateLimitExceeded(res, message);
  };

  res.apiInternalError = (message?: string) => {
    ApiResponseBuilder.internalError(res, message);
  };

  next();
};