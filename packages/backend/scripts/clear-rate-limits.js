#!/usr/bin/env node

/**
 * Clear rate limit keys from Redis
 * Useful during development when you hit rate limits
 */

import { createClient } from 'redis';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env' });

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

async function clearRateLimits() {
  const client = createClient({
    url: REDIS_URL,
  });

  try {
    console.log('Connecting to Redis...');
    await client.connect();
    console.log('Connected to Redis');

    // Get all rate limit keys
    const patterns = [
      'ratelimit:*',
      'api:*',
      'strict:*',
      'login:*',
      'register:*',
      'password-reset:*',
      'task-create:*',
      'notification:*',
      'ip:*',
      'sliding:*',
    ];

    let totalDeleted = 0;

    for (const pattern of patterns) {
      console.log(`\nSearching for keys matching: ${pattern}`);
      const keys = await client.keys(pattern);
      
      if (keys.length > 0) {
        console.log(`Found ${keys.length} keys`);
        for (const key of keys) {
          await client.del(key);
          totalDeleted++;
        }
        console.log(`Deleted ${keys.length} keys`);
      } else {
        console.log('No keys found');
      }
    }

    console.log(`\n✅ Total keys deleted: ${totalDeleted}`);
    console.log('Rate limits have been cleared!');
  } catch (error) {
    console.error('❌ Error clearing rate limits:', error);
    process.exit(1);
  } finally {
    await client.quit();
  }
}

clearRateLimits();
