/**
 * Pagination utilities
 * Provides consistent pagination handling across the application
 */

export interface PaginationParams {
  page?: string | number;
  pageSize?: string | number;
  maxPageSize?: number;
}

export interface PaginationResult {
  page: number;
  pageSize: number;
  offset: number;
  limit: number;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Parse and validate pagination parameters
 * @param params - Raw pagination parameters
 * @returns Validated pagination result
 */
export function parsePagination(params: PaginationParams): PaginationResult {
  const maxPageSize = params.maxPageSize || 100;
  const defaultPageSize = 20;

  // Parse page number (default: 1, min: 1)
  const page = Math.max(1, parseInt(String(params.page || '1'), 10) || 1);

  // Parse page size (default: 20, max: maxPageSize)
  const pageSize = Math.min(
    maxPageSize,
    Math.max(1, parseInt(String(params.pageSize || String(defaultPageSize)), 10) || defaultPageSize)
  );

  // Calculate offset
  const offset = (page - 1) * pageSize;

  return {
    page,
    pageSize,
    offset,
    limit: pageSize,
  };
}

/**
 * Create pagination metadata for response
 * @param page - Current page number
 * @param pageSize - Items per page
 * @param total - Total number of items
 * @returns Pagination metadata
 */
export function createPaginationMeta(
  page: number,
  pageSize: number,
  total: number
): PaginationMeta {
  const totalPages = Math.ceil(total / pageSize);

  return {
    page,
    pageSize,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

/**
 * Create a paginated response
 * @param data - Array of items
 * @param page - Current page number
 * @param pageSize - Items per page
 * @param total - Total number of items
 * @returns Paginated response object
 */
export function createPaginatedResponse<T>(
  data: T[],
  page: number,
  pageSize: number,
  total: number
) {
  return {
    data,
    pagination: createPaginationMeta(page, pageSize, total),
  };
}

/**
 * Default pagination constants
 */
export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;
