import { createClient } from 'redis';
import { config } from './env.js';

const redisOptions: any = {
  socket: {
    host: config.redis.host,
    port: config.redis.port,
    ...(config.redis.tls && { tls: true }),
    reconnectStrategy: (retries: number) => {
      if (retries > config.redis.maxRetries) {
        console.error('Redis max retries reached');
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
  console.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  console.log('Redis client connected');
});

redisClient.on('ready', () => {
  console.log('Redis client ready');
});

redisSubscriber.on('error', (err) => {
  console.error('Redis Subscriber Error:', err);
});

redisSubscriber.on('connect', () => {
  console.log('Redis subscriber connected');
});

redisSubscriber.on('ready', () => {
  console.log('Redis subscriber ready');
});

export const connectRedis = async (): Promise<boolean> => {
  try {
    await redisClient.connect();
    await redisSubscriber.connect();
    return true;
  } catch (error) {
    console.error('Redis connection failed:', error);
    return false;
  }
};

export const disconnectRedis = async (): Promise<void> => {
  try {
    await redisClient.quit();
    await redisSubscriber.quit();
    console.log('Redis clients disconnected');
  } catch (error) {
    console.error('Redis disconnect error:', error);
  }
};

export const testRedisConnection = async (): Promise<boolean> => {
  try {
    await redisClient.ping();
    console.log('Redis connection successful');
    return true;
  } catch (error) {
    console.error('Redis connection test failed:', error);
    return false;
  }
};
