/**
 * Start Queue Workers
 * Initializes and starts all background queue workers
 */

import { pool } from '../config/database.js';
import { connectRedis } from '../config/redis.js';
import { QueueWorker } from './QueueWorker';
import { NotificationService } from '../services/NotificationService';
import { RankingService } from '../services/RankingService';
import { BountyService } from '../services/BountyService';
import { NotificationPushService } from '../services/NotificationPushService';

let worker: QueueWorker | null = null;

/**
 * Initialize and start queue workers
 */
export async function startWorkers(): Promise<QueueWorker> {
  if (worker) {
    console.log('Workers already started');
    return worker;
  }

  try {
    // Ensure Redis is connected
    await connectRedis();

    // Initialize services
    const notificationService = new NotificationService();
    const rankingService = new RankingService(pool);
    const bountyService = new BountyService();
    const notificationPushService = new NotificationPushService();

    // Create and start worker
    worker = new QueueWorker(
      pool,
      notificationService,
      rankingService,
      bountyService,
      notificationPushService
    );

    await worker.start();

    console.log('✓ Queue workers started successfully');
    return worker;
  } catch (error) {
    console.error('Failed to start queue workers:', error);
    throw error;
  }
}

/**
 * Stop queue workers
 */
export async function stopWorkers(): Promise<void> {
  if (!worker) {
    console.log('No workers to stop');
    return;
  }

  try {
    await worker.stop();
    worker = null;
    console.log('✓ Queue workers stopped successfully');
  } catch (error) {
    console.error('Error stopping queue workers:', error);
    throw error;
  }
}

/**
 * Get worker status
 */
export function getWorkerStatus(): any {
  if (!worker) {
    return { running: false, activeWorkers: 0 };
  }
  return worker.getStatus();
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, stopping workers...');
  await stopWorkers();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, stopping workers...');
  await stopWorkers();
  process.exit(0);
});

// Start workers if this file is run directly
if (require.main === module) {
  startWorkers()
    .then(() => {
      console.log('Workers running. Press Ctrl+C to stop.');
    })
    .catch((error) => {
      console.error('Failed to start workers:', error);
      process.exit(1);
    });
}
