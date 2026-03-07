import dotenv from 'dotenv';
import { logger } from './logger.js';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  // Server
  PORT: z.string().default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Database
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.string().default('5432'),
  DB_NAME: z.string().default('bounty_hunter'),
  DB_USER: z.string().default('postgres'),
  DB_PASSWORD: z.string().default('postgres'),
  DB_SSL: z.string().default('false'),
  DB_POOL_MIN: z.string().default('2'),
  DB_POOL_MAX: z.string().default('20'),
  DB_IDLE_TIMEOUT: z.string().default('30000'),
  DB_CONNECTION_TIMEOUT: z.string().default('2000'),
  
  // Redis
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().default('6379'),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.string().default('0'),
  REDIS_MAX_RETRIES: z.string().default('3'),
  REDIS_TLS: z.string().default('false'),
  
  // JWT
  JWT_SECRET: z.string().min(1),
  JWT_EXPIRES_IN: z.string().default('24h'),
  JWT_REFRESH_SECRET: z.string().optional(),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  
  // Admin
  ADMIN_MONTHLY_BUDGET: z.string().default('10000'),
  
  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FILE_PATH: z.string().default('./logs'),
  LOG_MAX_FILES: z.string().default('14'),
  LOG_MAX_SIZE: z.string().default('20m'),
  LOG_TO_CONSOLE: z.string().default('true'),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().default('60000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100'),
  RATE_LIMIT_IP_MAX_REQUESTS: z.string().default('1000'),
  
  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  CORS_CREDENTIALS: z.string().default('true'),
  
  // Security
  BCRYPT_ROUNDS: z.string().default('10'),
  SESSION_SECRET: z.string().optional(),
  
  // Performance
  ENABLE_COMPRESSION: z.string().default('true'),
  ENABLE_CACHE: z.string().default('true'),
  CACHE_TTL: z.string().default('300'),
  
  // Monitoring
  HEALTH_CHECK_ENABLED: z.string().default('true'),
  METRICS_ENABLED: z.string().default('false'),
  
  // Email (optional)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_SECURE: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  
  // URLs
  API_BASE_URL: z.string().optional(),
  FRONTEND_URL: z.string().optional(),
  
  // Worker
  WORKER_CONCURRENCY: z.string().default('5'),
  QUEUE_RETRY_ATTEMPTS: z.string().default('3'),
  QUEUE_RETRY_DELAY: z.string().default('5000'),
});

const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    logger.error('Environment validation failed:', error);
    throw new Error('Invalid environment configuration');
  }
};

export const env = parseEnv();

export const config = {
  server: {
    port: parseInt(env.PORT, 10),
    nodeEnv: env.NODE_ENV,
  },
  database: {
    host: env.DB_HOST,
    port: parseInt(env.DB_PORT, 10),
    database: env.DB_NAME,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    ssl: env.DB_SSL === 'true',
    poolMin: parseInt(env.DB_POOL_MIN, 10),
    poolMax: parseInt(env.DB_POOL_MAX, 10),
    idleTimeout: parseInt(env.DB_IDLE_TIMEOUT, 10),
    connectionTimeout: parseInt(env.DB_CONNECTION_TIMEOUT, 10),
  },
  redis: {
    host: env.REDIS_HOST,
    port: parseInt(env.REDIS_PORT, 10),
    password: env.REDIS_PASSWORD,
    db: parseInt(env.REDIS_DB, 10),
    maxRetries: parseInt(env.REDIS_MAX_RETRIES, 10),
    tls: env.REDIS_TLS === 'true',
  },
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
    refreshSecret: env.JWT_REFRESH_SECRET || env.JWT_SECRET,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
  },
  admin: {
    monthlyBudget: parseInt(env.ADMIN_MONTHLY_BUDGET, 10),
  },
  logging: {
    level: env.LOG_LEVEL,
    filePath: env.LOG_FILE_PATH,
    maxFiles: parseInt(env.LOG_MAX_FILES, 10),
    maxSize: env.LOG_MAX_SIZE,
    toConsole: env.LOG_TO_CONSOLE === 'true',
  },
  rateLimit: {
    windowMs: parseInt(env.RATE_LIMIT_WINDOW_MS, 10),
    maxRequests: parseInt(env.RATE_LIMIT_MAX_REQUESTS, 10),
    ipMaxRequests: parseInt(env.RATE_LIMIT_IP_MAX_REQUESTS, 10),
  },
  cors: {
    origin: env.CORS_ORIGIN,
    credentials: env.CORS_CREDENTIALS === 'true',
  },
  security: {
    bcryptRounds: parseInt(env.BCRYPT_ROUNDS, 10),
    sessionSecret: env.SESSION_SECRET || env.JWT_SECRET,
  },
  performance: {
    enableCompression: env.ENABLE_COMPRESSION === 'true',
    enableCache: env.ENABLE_CACHE === 'true',
    cacheTTL: parseInt(env.CACHE_TTL, 10),
  },
  monitoring: {
    healthCheckEnabled: env.HEALTH_CHECK_ENABLED === 'true',
    metricsEnabled: env.METRICS_ENABLED === 'true',
  },
  email: {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT ? parseInt(env.SMTP_PORT, 10) : undefined,
    secure: env.SMTP_SECURE === 'true',
    user: env.SMTP_USER,
    password: env.SMTP_PASSWORD,
    from: env.SMTP_FROM,
  },
  urls: {
    apiBaseUrl: env.API_BASE_URL,
    frontendUrl: env.FRONTEND_URL,
  },
  worker: {
    concurrency: parseInt(env.WORKER_CONCURRENCY, 10),
    retryAttempts: parseInt(env.QUEUE_RETRY_ATTEMPTS, 10),
    retryDelay: parseInt(env.QUEUE_RETRY_DELAY, 10),
  },
};
