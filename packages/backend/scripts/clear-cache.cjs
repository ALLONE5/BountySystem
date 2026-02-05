
const { createClient } = require('redis');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const client = createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
  password: process.env.REDIS_PASSWORD || undefined,
});

client.on('error', (err) => console.log('Redis Client Error', err));

async function clearCache() {
  try {
    await client.connect();
    console.log('Connected to Redis');
    await client.flushAll();
    console.log('Redis cache cleared');
  } catch (error) {
    console.error('Error clearing cache:', error);
  } finally {
    await client.disconnect();
  }
}

clearCache();
