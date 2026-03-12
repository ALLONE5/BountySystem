/**
 * Query parameter validation utilities
 * Provides reusable validation patterns for common query parameters
 */

import { z } from 'zod';

/**
 * Common validation schemas
 */
export const commonSchemas = {
  // UUID validation
  uuid: z.string().uuid(),
  
  // Optional UUID
  optionalUuid: z.string().uuid().optional(),
  
  // Pagination
  page: z.string().regex(/^\d+$/).optional(),
  pageSize: z.string().regex(/^\d+$/).optional(),
  
  // Boolean as string
  booleanString: z.enum(['true', 'false']).optional(),
  
  // Date/time
  datetime: z.string().datetime().optional(),
  
  // Search string
  search: z.string().min(1).max(200).optional(),
  
  // Limit
  limit: z.string().regex(/^\d+$/).optional(),
  
  // Sort order
  sortOrder: z.enum(['asc', 'desc']).optional(),
};

/**
 * Create a pagination query schema
 */
export function createPaginationSchema() {
  return z.object({
    page: commonSchemas.page,
    pageSize: commonSchemas.pageSize,
  });
}

/**
 * Create a search query schema
 */
export function createSearchSchema(additionalFields?: z.ZodRawShape) {
  return z.object({
    search: commonSchemas.search,
    page: commonSchemas.page,
    pageSize: commonSchemas.pageSize,
    ...additionalFields,
  });
}

/**
 * Create a date range query schema
 */
export function createDateRangeSchema(additionalFields?: z.ZodRawShape) {
  return z.object({
    startDate: commonSchemas.datetime,
    endDate: commonSchemas.datetime,
    ...additionalFields,
  });
}

/**
 * Create a filter query schema with pagination
 */
export function createFilterSchema(filterFields: z.ZodRawShape) {
  return z.object({
    ...filterFields,
    page: commonSchemas.page,
    pageSize: commonSchemas.pageSize,
  });
}

/**
 * Parse boolean string to boolean
 */
export function parseBooleanString(value?: string): boolean | undefined {
  if (value === undefined) return undefined;
  return value === 'true';
}

/**
 * Parse date string to Date object
 */
export function parseDateString(value?: string): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return isNaN(date.getTime()) ? undefined : date;
}

/**
 * Validate and parse UUID
 */
export function validateUuid(id: string, fieldName: string = 'ID'): void {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!id || !uuidRegex.test(id)) {
    throw new Error(`Invalid ${fieldName}`);
  }
}

/**
 * Common query parameter transformers
 */
export const queryTransformers = {
  /**
   * Transform string to integer with default value
   */
  toInt: (value: string | undefined, defaultValue: number): number => {
    if (!value) return defaultValue;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  },

  /**
   * Transform string to integer with min/max bounds
   */
  toIntBounded: (
    value: string | undefined,
    defaultValue: number,
    min: number,
    max: number
  ): number => {
    const parsed = queryTransformers.toInt(value, defaultValue);
    return Math.max(min, Math.min(max, parsed));
  },

  /**
   * Transform comma-separated string to array
   */
  toArray: (value: string | undefined): string[] => {
    if (!value) return [];
    return value.split(',').map(s => s.trim()).filter(Boolean);
  },

  /**
   * Transform string to boolean
   */
  toBoolean: (value: string | undefined): boolean | undefined => {
    return parseBooleanString(value);
  },

  /**
   * Transform string to Date
   */
  toDate: (value: string | undefined): Date | undefined => {
    return parseDateString(value);
  },
};
