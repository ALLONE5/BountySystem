import { Request, Response, NextFunction } from 'express';
import { z, ZodError, ZodSchema } from 'zod';
import { AppError } from '../utils/errors.js';

/**
 * Input validation and sanitization middleware
 * Validates request body, query, and params against Zod schemas
 * Prevents SQL injection and XSS attacks through strict validation
 */

export interface ValidationSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

/**
 * Middleware factory for validating requests
 */
export const validate = (schemas: ValidationSchemas) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate body
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }

      // Validate query parameters
      if (schemas.query) {
        req.query = await schemas.query.parseAsync(req.query);
      }

      // Validate route parameters
      if (schemas.params) {
        req.params = await schemas.params.parseAsync(req.params);
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        return next(
          new AppError(
            'VALIDATION_ERROR',
            'Invalid input data',
            400,
            formattedErrors
          )
        );
      }

      next(error);
    }
  };
};

/**
 * Common validation schemas for reuse
 */

// UUID validation
export const uuidSchema = z.string().uuid('Invalid UUID format');

// Pagination schemas
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// ID parameter schema
export const idParamSchema = z.object({
  id: uuidSchema,
});

// String sanitization - removes potential XSS vectors
export const sanitizedStringSchema = z
  .string()
  .trim()
  .transform((val) => {
    // Remove HTML tags
    return val.replace(/<[^>]*>/g, '');
  });

// Safe text input (for names, titles, etc.)
export const safeTextSchema = z
  .string()
  .trim()
  .min(1, 'Field cannot be empty')
  .max(255, 'Field is too long')
  .transform((val) => {
    // Remove HTML tags and script content
    return val.replace(/<[^>]*>/g, '').replace(/javascript:/gi, '');
  });

// Safe long text (for descriptions, comments, etc.)
export const safeLongTextSchema = z
  .string()
  .trim()
  .min(1, 'Field cannot be empty')
  .max(5000, 'Field is too long')
  .transform((val) => {
    // Remove HTML tags and script content
    return val.replace(/<[^>]*>/g, '').replace(/javascript:/gi, '');
  });

// Email validation with sanitization
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('Invalid email format')
  .max(255);

// Password validation
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Password must contain at least one uppercase letter, one lowercase letter, and one number'
  );

// Username validation
export const usernameSchema = z
  .string()
  .trim()
  .min(3, 'Username must be at least 3 characters')
  .max(50, 'Username is too long')
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    'Username can only contain letters, numbers, underscores, and hyphens'
  );

// Date validation
export const dateSchema = z.coerce.date();

// Positive number validation
export const positiveNumberSchema = z.coerce.number().positive();

// Non-negative number validation
export const nonNegativeNumberSchema = z.coerce.number().nonnegative();

// Integer validation
export const integerSchema = z.coerce.number().int();

// Positive integer validation
export const positiveIntegerSchema = z.coerce.number().int().positive();

// Enum validation helper
export const createEnumSchema = <T extends string>(values: readonly T[]) => {
  return z.enum(values as [T, ...T[]]);
};

// Array validation with max length
export const createArraySchema = <T extends ZodSchema>(
  itemSchema: T,
  maxLength = 100
) => {
  return z.array(itemSchema).max(maxLength, `Array is too long (max ${maxLength})`);
};

// SQL injection prevention - validates that strings don't contain SQL keywords
export const sqlSafeStringSchema = z
  .string()
  .trim()
  .refine(
    (val) => {
      const sqlKeywords = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|DECLARE)\b)/gi;
      return !sqlKeywords.test(val);
    },
    { message: 'Input contains invalid characters' }
  );

/**
 * Sanitize object by removing undefined and null values
 */
export const sanitizeObject = <T extends Record<string, any>>(obj: T): Partial<T> => {
  const sanitized: Partial<T> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined && value !== null) {
      sanitized[key as keyof T] = value;
    }
  }
  
  return sanitized;
};

/**
 * Escape special characters for SQL LIKE queries
 */
export const escapeLikeString = (str: string): string => {
  return str.replace(/[%_\\]/g, '\\$&');
};
