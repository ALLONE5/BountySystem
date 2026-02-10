/**
 * Start Queue Workers
 * Initializes and starts all background queue workers
 */

import { pool } from '../config/database.js';
import { connectRedis } from '../config/redis.js';
import { logger } from '../config/logger.js';
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
    logger.info('Workers already started');
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

    logger.info('Queue workers started successfully');
    return worker;
  } catch (error) {
    logger.error('Failed to start queue workers', error as Error);
    throw error;
  }
}

/**
 * Stop queue workers
 */
export async function stopWorkers(): Promise<void> {
  if (!worker) {
    logger.info('No workers to stop');
    return;
  }

  try {
    await worker.stop();
    worker = null;
    logger.info('Queue workers stopped successfully');
  } catch (error) {
    logger.error('Error stopping queue workers', error as Error);
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
  logger.info('SIGTERM received, stopping workers...');
  await stopWorkers();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, stopping workers...');
  await stopWorkers();
  process.exit(0);
});

// Start workers if this file is run directly
if (require.main === module) {
  startWorkers()
    .then(() => {
      logger.info('Workers running. Press Ctrl+C to stop.');
    })
    .catch((error) => {
      logger.error('Failed to start workers', error as Error);
      process.exit(1);
    });
}
