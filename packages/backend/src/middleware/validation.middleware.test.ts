import { describe, it, expect, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import {
  validate,
  emailSchema,
  passwordSchema,
  usernameSchema,
  safeTextSchema,
  safeLongTextSchema,
  sqlSafeStringSchema,
  uuidSchema,
  sanitizeObject,
  escapeLikeString,
} from './validation.middleware.js';
import { z } from 'zod';

describe('Validation Middleware', () => {
  describe('validate middleware', () => {
    it('should validate valid body data', async () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });

      const req = {
        body: { name: 'John', age: 30 },
        query: {},
        params: {},
      } as Request;

      const res = {} as Response;
      const next = vi.fn();

      const middleware = validate({ body: schema });
      await middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.body).toEqual({ name: 'John', age: 30 });
    });

    it('should reject invalid body data', async () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });

      const req = {
        body: { name: 'John', age: 'invalid' },
        query: {},
        params: {},
      } as Request;

      const res = {} as Response;
      const next = vi.fn();

      const middleware = validate({ body: schema });
      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.status).toBe(400);
    });

    it('should validate query parameters', async () => {
      const schema = z.object({
        page: z.coerce.number(),
      });

      const req = {
        body: {},
        query: { page: '2' },
        params: {},
      } as any;

      const res = {} as Response;
      const next = vi.fn();

      const middleware = validate({ query: schema });
      await middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.query.page).toBe(2);
    });
  });

  describe('emailSchema', () => {
    it('should accept valid email', () => {
      const result = emailSchema.parse('test@example.com');
      expect(result).toBe('test@example.com');
    });

    it('should lowercase email', () => {
      const result = emailSchema.parse('Test@Example.COM');
      expect(result).toBe('test@example.com');
    });

    it('should reject invalid email', () => {
      expect(() => emailSchema.parse('invalid-email')).toThrow();
    });

    it('should trim whitespace', () => {
      const result = emailSchema.parse('  test@example.com  ');
      expect(result).toBe('test@example.com');
    });
  });

  describe('passwordSchema', () => {
    it('should accept valid password', () => {
      const result = passwordSchema.parse('Password123');
      expect(result).toBe('Password123');
    });

    it('should reject short password', () => {
      expect(() => passwordSchema.parse('Pass1')).toThrow();
    });

    it('should reject password without uppercase', () => {
      expect(() => passwordSchema.parse('password123')).toThrow();
    });

    it('should reject password without lowercase', () => {
      expect(() => passwordSchema.parse('PASSWORD123')).toThrow();
    });

    it('should reject password without number', () => {
      expect(() => passwordSchema.parse('PasswordABC')).toThrow();
    });
  });

  describe('usernameSchema', () => {
    it('should accept valid username', () => {
      const result = usernameSchema.parse('john_doe-123');
      expect(result).toBe('john_doe-123');
    });

    it('should reject short username', () => {
      expect(() => usernameSchema.parse('ab')).toThrow();
    });

    it('should reject username with special characters', () => {
      expect(() => usernameSchema.parse('john@doe')).toThrow();
    });

    it('should trim whitespace', () => {
      const result = usernameSchema.parse('  john_doe  ');
      expect(result).toBe('john_doe');
    });
  });

  describe('safeTextSchema', () => {
    it('should remove HTML tags', () => {
      const result = safeTextSchema.parse('Hello <script>alert("xss")</script> World');
      expect(result).toBe('Hello alert("xss") World');
    });

    it('should remove javascript protocol', () => {
      const result = safeTextSchema.parse('Click javascript:alert("xss")');
      expect(result).toBe('Click alert("xss")');
    });

    it('should trim whitespace', () => {
      const result = safeTextSchema.parse('  Hello World  ');
      expect(result).toBe('Hello World');
    });

    it('should reject empty string', () => {
      expect(() => safeTextSchema.parse('')).toThrow();
    });

    it('should reject too long string', () => {
      const longString = 'a'.repeat(256);
      expect(() => safeTextSchema.parse(longString)).toThrow();
    });
  });

  describe('safeLongTextSchema', () => {
    it('should accept longer text', () => {
      const longText = 'a'.repeat(1000);
      const result = safeLongTextSchema.parse(longText);
      expect(result).toBe(longText);
    });

    it('should remove HTML tags from long text', () => {
      const result = safeLongTextSchema.parse('<p>Paragraph</p> with <b>tags</b>');
      expect(result).toBe('Paragraph with tags');
    });

    it('should reject too long text', () => {
      const tooLong = 'a'.repeat(5001);
      expect(() => safeLongTextSchema.parse(tooLong)).toThrow();
    });
  });

  describe('sqlSafeStringSchema', () => {
    it('should accept safe string', () => {
      const result = sqlSafeStringSchema.parse('Hello World');
      expect(result).toBe('Hello World');
    });

    it('should reject SQL keywords', () => {
      expect(() => sqlSafeStringSchema.parse('SELECT * FROM users')).toThrow();
      expect(() => sqlSafeStringSchema.parse('DROP TABLE users')).toThrow();
      expect(() => sqlSafeStringSchema.parse('INSERT INTO users')).toThrow();
      expect(() => sqlSafeStringSchema.parse('DELETE FROM users')).toThrow();
    });
  });

  describe('uuidSchema', () => {
    it('should accept valid UUID', () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      const result = uuidSchema.parse(uuid);
      expect(result).toBe(uuid);
    });

    it('should reject invalid UUID', () => {
      expect(() => uuidSchema.parse('not-a-uuid')).toThrow();
      expect(() => uuidSchema.parse('12345')).toThrow();
    });
  });

  describe('sanitizeObject', () => {
    it('should remove null and undefined values', () => {
      const obj = {
        name: 'John',
        age: null,
        email: undefined,
        active: true,
      };

      const result = sanitizeObject(obj);
      expect(result).toEqual({
        name: 'John',
        active: true,
      });
    });

    it('should keep falsy values that are not null/undefined', () => {
      const obj = {
        count: 0,
        empty: '',
        flag: false,
      };

      const result = sanitizeObject(obj);
      expect(result).toEqual({
        count: 0,
        empty: '',
        flag: false,
      });
    });
  });

  describe('escapeLikeString', () => {
    it('should escape LIKE special characters', () => {
      expect(escapeLikeString('test%')).toBe('test\\%');
      expect(escapeLikeString('test_')).toBe('test\\_');
      expect(escapeLikeString('test\\')).toBe('test\\\\');
      expect(escapeLikeString('test%_\\')).toBe('test\\%\\_\\\\');
    });

    it('should not modify normal strings', () => {
      expect(escapeLikeString('normal text')).toBe('normal text');
    });
  });
});
