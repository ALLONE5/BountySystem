import { createClient } from 'redis';
import { logger } from './logger.js';
import { config } from './env.js';

const redisOptions: any = {
  socket: {
    host: config.redis.host,
    port: config.redis.port,
    ...(config.redis.tls && { tls: true }),
    reconnectStrategy: (retries: number) => {
      if (retries > config.redis.maxRetries) {
        logger.error('Redis max retries reached');
        return new Error('Redis max retries reached');
      }
      // Exponential backoff: 50ms, 100ms, 200ms, etc.
      return Math.min(retries * 50, 3000);
    },
  },
  password: config.redis.password || undefined,
  database: config.redis.db,
};

export const redisClient = createClient(redisOptions);

// Create a separate client for pub/sub subscriptions
export const redisSubscriber = createClient(redisOptions);

redisClient.on('error', (err) => {
  logger.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  logger.info('Redis client connected');
});

redisClient.on('ready', () => {
  logger.info('Redis client ready');
});

redisSubscriber.on('error', (err) => {
  logger.error('Redis Subscriber Error:', err);
});

redisSubscriber.on('connect', () => {
  logger.info('Redis subscriber connected');
});

redisSubscriber.on('ready', () => {
  logger.info('Redis subscriber ready');
});

export const connectRedis = async (): Promise<boolean> => {
  try {
    await redisClient.connect();
    await redisSubscriber.connect();
    return true;
  } catch (error) {
    logger.error('Redis connection failed:', error);
    return false;
  }
};

export const disconnectRedis = async (): Promise<void> => {
  try {
    await redisClient.quit();
    await redisSubscriber.quit();
    logger.info('Redis clients disconnected');
  } catch (error) {
    logger.error('Redis disconnect error:', error);
  }
};

export const testRedisConnection = async (): Promise<boolean> => {
  try {
    await redisClient.ping();
    logger.info('Redis connection successful');
    return true;
  } catch (error) {
    logger.error('Redis connection test failed:', error);
    return false;
  }
};
