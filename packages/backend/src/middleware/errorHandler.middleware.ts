import { Request, Response, NextFunction } from 'express';
import { ValidationError, NotFoundError, UnauthorizedError, ForbiddenError } from '../utils/errors.js';
import logger from '../config/logger.js';

/**
 * 全局错误处理中间件
 * 统一处理所有路由中抛出的错误
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // 记录错误日志
  logger.error('Error occurred:', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    query: req.query,
    params: req.params,
  });

  // 验证错误 (400)
  if (error instanceof ValidationError) {
    return res.status(400).json({
      error: error.message,
      type: 'ValidationError',
    });
  }

  // 未找到错误 (404)
  if (error instanceof NotFoundError) {
    return res.status(404).json({
      error: error.message,
      type: 'NotFoundError',
    });
  }

  // 未授权错误 (401)
  if (error instanceof UnauthorizedError) {
    return res.status(401).json({
      error: error.message,
      type: 'UnauthorizedError',
    });
  }

  // 禁止访问错误 (403)
  if (error instanceof ForbiddenError) {
    return res.status(403).json({
      error: error.message,
      type: 'ForbiddenError',
    });
  }

  // JWT错误
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid token',
      type: 'AuthenticationError',
    });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expired',
      type: 'AuthenticationError',
    });
  }

  // 数据库错误
  if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      error: 'Database validation error',
      type: 'DatabaseError',
    });
  }

  // 默认服务器错误 (500)
  res.status(500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message,
    type: 'InternalServerError',
    ...(process.env.NODE_ENV !== 'production' && { stack: error.stack }),
  });
};

/**
 * 404错误处理中间件
 * 处理未匹配到任何路由的请求
 */
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    error: `Route ${req.method} ${req.path} not found`,
    type: 'NotFoundError',
  });
};
