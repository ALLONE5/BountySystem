import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { createRateLimiter } from './rateLimit.middleware.js';
import { redisClient } from '../config/redis.js';

// Mock Redis client
vi.mock('../config/redis.js', () => ({
  redisClient: {
    get: vi.fn(),
    setEx: vi.fn(),
    incr: vi.fn(),
    decr: vi.fn(),
    multi: vi.fn(() => ({
      zRemRangeByScore: vi.fn().mockReturnThis(),
      zCard: vi.fn().mockReturnThis(),
      zAdd: vi.fn().mockReturnThis(),
      expire: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([null, 0, null, null]),
    })),
  },
}));

describe('Rate Limit Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createRateLimiter', () => {
    it('should allow requests within limit', async () => {
      const rateLimiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 5,
        keyPrefix: 'test',
      });

      vi.mocked(redisClient.get).mockResolvedValue('2');

      const req = {
        ip: '127.0.0.1',
        user: undefined,
      } as Request;

      const res = {
        setHeader: vi.fn(),
      } as unknown as Response;

      const next = vi.fn();

      await rateLimiter(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', '5');
      expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', '2');
    });

    it('should block requests exceeding limit', async () => {
      const rateLimiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 5,
        keyPrefix: 'test',
      });

      vi.mocked(redisClient.get).mockResolvedValue('5');

      const req = {
        ip: '127.0.0.1',
        user: undefined,
      } as Request;

      const res = {
        setHeader: vi.fn(),
      } as unknown as Response;

      const next = vi.fn();

      await rateLimiter(req, res, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(error.status).toBe(429);
    });

    it('should use user ID if authenticated', async () => {
      const rateLimiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 5,
        keyPrefix: 'test',
      });

      vi.mocked(redisClient.get).mockResolvedValue('1');

      const req = {
        ip: '127.0.0.1',
        user: { id: 'user-123' },
      } as any;

      const res = {
        setHeader: vi.fn(),
      } as unknown as Response;

      const next = vi.fn();

      await rateLimiter(req, res, next);

      expect(redisClient.get).toHaveBeenCalledWith('test:user-123');
      expect(next).toHaveBeenCalledWith();
    });

    it('should create new counter for first request', async () => {
      const rateLimiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 5,
        keyPrefix: 'test',
      });

      vi.mocked(redisClient.get).mockResolvedValue(null);

      const req = {
        ip: '127.0.0.1',
        user: undefined,
      } as Request;

      const res = {
        setHeader: vi.fn(),
      } as unknown as Response;

      const next = vi.fn();

      await rateLimiter(req, res, next);

      expect(redisClient.setEx).toHaveBeenCalledWith('test:127.0.0.1', 60, '1');
      expect(next).toHaveBeenCalledWith();
    });

    it('should increment existing counter', async () => {
      const rateLimiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 5,
        keyPrefix: 'test',
      });

      vi.mocked(redisClient.get).mockResolvedValue('3');

      const req = {
        ip: '127.0.0.1',
        user: undefined,
      } as Request;

      const res = {
        setHeader: vi.fn(),
      } as unknown as Response;

      const next = vi.fn();

      await rateLimiter(req, res, next);

      expect(redisClient.incr).toHaveBeenCalledWith('test:127.0.0.1');
      expect(next).toHaveBeenCalledWith();
    });

    it('should use custom handler when provided', async () => {
      const customHandler = vi.fn();
      const rateLimiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 5,
        keyPrefix: 'test',
        handler: customHandler,
      });

      vi.mocked(redisClient.get).mockResolvedValue('5');

      const req = {
        ip: '127.0.0.1',
        user: undefined,
      } as Request;

      const res = {
        setHeader: vi.fn(),
      } as unknown as Response;

      const next = vi.fn();

      await rateLimiter(req, res, next);

      expect(customHandler).toHaveBeenCalledWith(req, res);
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle Redis errors gracefully', async () => {
      const rateLimiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 5,
        keyPrefix: 'test',
      });

      vi.mocked(redisClient.get).mockRejectedValue(new Error('Redis error'));

      const req = {
        ip: '127.0.0.1',
        user: undefined,
      } as Request;

      const res = {
        setHeader: vi.fn(),
      } as unknown as Response;

      const next = vi.fn();

      await rateLimiter(req, res, next);

      // Should allow request when Redis is down
      expect(next).toHaveBeenCalledWith();
    });

    it('should set correct rate limit headers', async () => {
      const rateLimiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 10,
        keyPrefix: 'test',
      });

      vi.mocked(redisClient.get).mockResolvedValue('3');

      const req = {
        ip: '127.0.0.1',
        user: undefined,
      } as Request;

      const res = {
        setHeader: vi.fn(),
      } as unknown as Response;

      const next = vi.fn();

      await rateLimiter(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', '10');
      expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', '6');
      expect(res.setHeader).toHaveBeenCalledWith(
        'X-RateLimit-Reset',
        expect.any(String)
      );
    });
  });

  describe('Rate limiter with skip options', () => {
    it('should skip successful requests when configured', async () => {
      const rateLimiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 5,
        keyPrefix: 'test',
        skipSuccessfulRequests: true,
      });

      vi.mocked(redisClient.get).mockResolvedValue('2');
      vi.mocked(redisClient.decr).mockResolvedValue(1);

      const req = {
        ip: '127.0.0.1',
        user: undefined,
      } as Request;

      const res = {
        setHeader: vi.fn(),
        statusCode: 200,
        send: vi.fn(),
      } as unknown as Response;

      const next = vi.fn();

      await rateLimiter(req, res, next);

      // Simulate successful response
      res.send('success');

      expect(redisClient.decr).toHaveBeenCalledWith('test:127.0.0.1');
    });

    it('should skip failed requests when configured', async () => {
      const rateLimiter = createRateLimiter({
        windowMs: 60000,
        maxRequests: 5,
        keyPrefix: 'test',
        skipFailedRequests: true,
      });

      vi.mocked(redisClient.get).mockResolvedValue('2');
      vi.mocked(redisClient.decr).mockResolvedValue(1);

      const req = {
        ip: '127.0.0.1',
        user: undefined,
      } as Request;

      const res = {
        setHeader: vi.fn(),
        statusCode: 400,
        send: vi.fn(),
      } as unknown as Response;

      const next = vi.fn();

      await rateLimiter(req, res, next);

      // Simulate failed response
      res.send('error');

      expect(redisClient.decr).toHaveBeenCalledWith('test:127.0.0.1');
    });
  });
});
