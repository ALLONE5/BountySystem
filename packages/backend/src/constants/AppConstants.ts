/**
 * Application Constants
 * Centralized configuration values to avoid hardcoded values throughout the codebase
 */

// Database Configuration
export const DATABASE_CONSTANTS = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  CONNECTION_TIMEOUT: 30000,
  QUERY_TIMEOUT: 10000,
} as const;

// Cache Configuration
export const CACHE_CONSTANTS = {
  DEFAULT_TTL: 3600, // 1 hour
  USER_PERMISSIONS_TTL: 1800, // 30 minutes
  TASK_STATUS_TTL: 300, // 5 minutes
  RANKING_TTL: 600, // 10 minutes
  SESSION_TTL: 86400, // 24 hours
} as const;

// Task Configuration
export const TASK_CONSTANTS = {
  MIN_TITLE_LENGTH: 3,
  MAX_TITLE_LENGTH: 200,
  MIN_DESCRIPTION_LENGTH: 10,
  MAX_DESCRIPTION_LENGTH: 5000,
  MIN_BOUNTY: 0,
  MAX_BOUNTY: 1000000,
  DEFAULT_PRIORITY: 'medium',
  MAX_SUBTASKS: 50,
} as const;

// User Configuration
export const USER_CONSTANTS = {
  MIN_USERNAME_LENGTH: 3,
  MAX_USERNAME_LENGTH: 50,
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 128,
  DEFAULT_AVATAR_SIZE: 100,
  MAX_BIO_LENGTH: 500,
} as const;

// Group Configuration
export const GROUP_CONSTANTS = {
  MIN_NAME_LENGTH: 3,
  MAX_NAME_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 1000,
  MAX_MEMBERS: 100,
  DEFAULT_VISIBILITY: 'public',
} as const;

// Position Configuration
export const POSITION_CONSTANTS = {
  MIN_TITLE_LENGTH: 3,
  MAX_TITLE_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 2000,
  MAX_REQUIREMENTS_LENGTH: 1000,
  DEFAULT_EXPERIENCE_LEVEL: 'intermediate',
} as const;

// API Configuration
export const API_CONSTANTS = {
  DEFAULT_TIMEOUT: 30000,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  RATE_LIMIT_WINDOW: 900000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: 100,
} as const;

// File Upload Configuration
export const UPLOAD_CONSTANTS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'text/plain', 'application/msword'],
  UPLOAD_PATH: 'uploads/',
  AVATAR_PATH: 'uploads/avatars/',
} as const;

// Notification Configuration
export const NOTIFICATION_CONSTANTS = {
  MAX_TITLE_LENGTH: 100,
  MAX_MESSAGE_LENGTH: 500,
  DEFAULT_PRIORITY: 'normal',
  BATCH_SIZE: 50,
  RETRY_ATTEMPTS: 3,
} as const;

// Security Configuration
export const SECURITY_CONSTANTS = {
  JWT_EXPIRY: '24h',
  REFRESH_TOKEN_EXPIRY: '7d',
  BCRYPT_ROUNDS: 12,
  SESSION_SECRET_LENGTH: 64,
  CSRF_TOKEN_LENGTH: 32,
} as const;

// Validation Patterns
export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  USERNAME: /^[a-zA-Z0-9_-]{3,50}$/,
  PHONE: /^\+?[\d\s-()]{10,20}$/,
  URL: /^https?:\/\/.+/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
  NOT_FOUND: 'Resource not found',
  VALIDATION_FAILED: 'Validation failed',
  INTERNAL_ERROR: 'Internal server error',
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded',
  INVALID_INPUT: 'Invalid input provided',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  CREATED: 'Resource created successfully',
  UPDATED: 'Resource updated successfully',
  DELETED: 'Resource deleted successfully',
  OPERATION_COMPLETED: 'Operation completed successfully',
} as const;

// Status Values
export const STATUS_VALUES = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

// Priority Values
export const PRIORITY_VALUES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
} as const;

// Visibility Values
export const VISIBILITY_VALUES = {
  PUBLIC: 'public',
  PRIVATE: 'private',
  INTERNAL: 'internal',
} as const;