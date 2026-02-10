import type { Request, Response, NextFunction } from 'express';
import { redisClient } from '../config/redis.js';
import { AppError } from '../utils/errors.js';

/**
 * Rate limiting middleware using Redis
 * Implements sliding window rate limiting to prevent abuse
 */

export interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyPrefix?: string; // Redis key prefix
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
  handler?: (req: Request, res: Response) => void; // Custom handler when limit exceeded
}

/**
 * Create a rate limiter middleware
 */
export const createRateLimiter = (options: RateLimitOptions) => {
  const {
    windowMs,
    maxRequests,
    keyPrefix = 'ratelimit',
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    handler,
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get identifier (IP address or user ID)
      const identifier = req.user?.userId || req.ip || 'unknown';
      const key = `${keyPrefix}:${identifier}`;

      // Get current count
      const current = await redisClient.get(key);
      const count = current ? parseInt(current, 10) : 0;

      // Check if limit exceeded
      if (count >= maxRequests) {
        if (handler) {
          return handler(req, res);
        }

        throw new AppError(
          'RATE_LIMIT_EXCEEDED',
          'Too many requests, please try again later',
          429,
          {
            retryAfter: Math.ceil(windowMs / 1000),
          }
        );
      }

      // Increment counter
      const newCount = count + 1;
      
      if (count === 0) {
        // First request in window - set with expiry
        await redisClient.setEx(key, Math.ceil(windowMs / 1000), newCount.toString());
      } else {
        // Increment existing counter
        await redisClient.incr(key);
      }

      // Add rate limit headers
      res.setHeader('X-RateLimit-Limit', maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', (maxRequests - newCount).toString());
      res.setHeader('X-RateLimit-Reset', (Date.now() + windowMs).toString());

      // Handle skip options
      if (skipSuccessfulRequests || skipFailedRequests) {
        const originalSend = res.send;
        res.send = function (data: any) {
          const statusCode = res.statusCode;
          const shouldSkip =
            (skipSuccessfulRequests && statusCode < 400) ||
            (skipFailedRequests && statusCode >= 400);

          if (shouldSkip) {
            // Decrement counter
            redisClient.decr(key).catch(console.error);
          }

          return originalSend.call(this, data);
        };
      }

      next();
    } catch (error) {
      if (error instanceof AppError) {
        return next(error);
      }

      // If Redis is down, allow the request but log the error
      console.error('Rate limiter error:', error);
      next();
    }
  };
};

/**
 * Predefined rate limiters for common use cases
 */

// General API rate limiter - 100 requests per minute (relaxed in development)
export const apiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: process.env.NODE_ENV === 'production' ? 100 : 1000, // More lenient in dev
  keyPrefix: 'api',
});

// Strict rate limiter for sensitive operations - 10 requests per minute
export const strictRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10,
  keyPrefix: 'strict',
});

// Login rate limiter - 5 attempts per 15 minutes (relaxed in development)
export const loginRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: process.env.NODE_ENV === 'production' ? 5 : 50, // More lenient in dev
  keyPrefix: 'login',
  skipSuccessfulRequests: true, // Only count failed login attempts
});

// Registration rate limiter - 3 registrations per hour per IP
export const registrationRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 3,
  keyPrefix: 'register',
});

// Password reset rate limiter - 3 attempts per hour
export const passwordResetRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 3,
  keyPrefix: 'password-reset',
});

// Task creation rate limiter - 20 tasks per hour
export const taskCreationRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 20,
  keyPrefix: 'task-create',
});

// Notification rate limiter - 50 notifications per minute
export const notificationRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 50,
  keyPrefix: 'notification',
});

/**
 * IP-based rate limiter for unauthenticated requests
 * Very lenient in development, stricter in production
 */
export const ipRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: process.env.NODE_ENV === 'production' ? 60 : 10000, // Very lenient in dev
  keyPrefix: 'ip',
});

/**
 * Sliding window rate limiter with more precise tracking
 */
export const createSlidingWindowRateLimiter = (options: RateLimitOptions) => {
  const { windowMs, maxRequests, keyPrefix = 'sliding' } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const identifier = req.user?.userId || req.ip || 'unknown';
      const key = `${keyPrefix}:${identifier}`;
      const now = Date.now();
      const windowStart = now - windowMs;

      // Use Redis sorted set for sliding window
      const multi = redisClient.multi();

      // Remove old entries
      multi.zRemRangeByScore(key, 0, windowStart);

      // Count current requests in window
      multi.zCard(key);

      // Add current request
      multi.zAdd(key, { score: now, value: `${now}` });

      // Set expiry
      multi.expire(key, Math.ceil(windowMs / 1000));

      const results = await multi.exec();
      const count = results?.[1] as number || 0;

      if (count >= maxRequests) {
        throw new AppError(
          'RATE_LIMIT_EXCEEDED',
          'Too many requests, please try again later',
          429,
          {
            retryAfter: Math.ceil(windowMs / 1000),
          }
        );
      }

      // Add rate limit headers
      res.setHeader('X-RateLimit-Limit', maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', (maxRequests - count - 1).toString());

      next();
    } catch (error) {
      if (error instanceof AppError) {
        return next(error);
      }

      console.error('Sliding window rate limiter error:', error);
      next();
    }
  };
};
