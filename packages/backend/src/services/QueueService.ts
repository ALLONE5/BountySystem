/**
 * Queue Service
 * Implements message queue for asynchronous task processing using Redis
 * Handles notification sending, report generation, and other background tasks
 */

import { redisClient } from '../config/redis.js';
import { logger } from '../config/logger.js';

export enum QueueName {
  NOTIFICATIONS = 'queue:notifications',
  REPORTS = 'queue:reports',
  EMAILS = 'queue:emails',
  RANKINGS = 'queue:rankings',
  BOUNTY_CALCULATIONS = 'queue:bounty',
}

export interface QueueJob<T = any> {
  id: string;
  type: string;
  data: T;
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  processedAt?: Date;
  error?: string;
}

export interface NotificationJob {
  userId: string;
  type: string;
  title: string;
  message: string;
  relatedTaskId?: string;
}

export interface ReportJob {
  userId: string;
  reportType: 'daily' | 'weekly' | 'monthly' | 'total';
  startDate?: Date;
  endDate?: Date;
}

export interface EmailJob {
  to: string;
  subject: string;
  body: string;
  template?: string;
  data?: any;
}

export interface RankingJob {
  period: 'monthly' | 'quarterly' | 'all_time';
  year: number;
  month?: number;
  quarter?: number;
}

export interface BountyCalculationJob {
  taskId: string;
  recalculate: boolean;
}

export class QueueService {
  private static readonly MAX_ATTEMPTS = 3;
  private static readonly RETRY_DELAY = 5000; // 5 seconds

  /**
   * Add a job to the queue
   */
  static async enqueue<T>(
    queueName: QueueName,
    type: string,
    data: T,
    maxAttempts: number = this.MAX_ATTEMPTS
  ): Promise<string> {
    const job: QueueJob<T> = {
      id: this.generateJobId(),
      type,
      data,
      attempts: 0,
      maxAttempts,
      createdAt: new Date(),
    };

    try {
      await redisClient.rPush(queueName, JSON.stringify(job));
      logger.info('Job enqueued to queue', { jobId: job.id, queueName, type });
      return job.id;
    } catch (error) {
      logger.error('Error enqueueing job to queue', error as Error, { queueName, type });
      throw error;
    }
  }

  /**
   * Dequeue a job from the queue (blocking)
   */
  static async dequeue(queueName: QueueName, timeout: number = 0): Promise<QueueJob | null> {
    try {
      const result = await redisClient.blPop(queueName, timeout);
      if (!result) return null;

      const job: QueueJob = JSON.parse(result.element);
      job.attempts++;
      logger.info('Job dequeued from queue', { 
        jobId: job.id, 
        queueName, 
        attempt: job.attempts,
        maxAttempts: job.maxAttempts 
      });
      return job;
    } catch (error) {
      logger.error('Error dequeuing from queue', error as Error, { queueName });
      return null;
    }
  }

  /**
   * Re-queue a failed job for retry
   */
  static async retry(queueName: QueueName, job: QueueJob, error: string): Promise<void> {
    if (job.attempts >= job.maxAttempts) {
      logger.error('Job failed after maximum attempts', new Error(error), { 
        jobId: job.id, 
        attempts: job.attempts,
        maxAttempts: job.maxAttempts,
        queueName 
      });
      await this.moveToDeadLetterQueue(queueName, job, error);
      return;
    }

    job.error = error;
    
    // Add delay before retry
    setTimeout(async () => {
      try {
        await redisClient.rPush(queueName, JSON.stringify(job));
        logger.info('Job re-queued for retry', { 
          jobId: job.id, 
          queueName,
          nextAttempt: job.attempts + 1,
          maxAttempts: job.maxAttempts 
        });
      } catch (err) {
        logger.error('Error re-queuing job', err as Error, { jobId: job.id, queueName });
      }
    }, this.RETRY_DELAY);
  }

  /**
   * Move failed job to dead letter queue
   */
  static async moveToDeadLetterQueue(
    queueName: QueueName,
    job: QueueJob,
    error: string
  ): Promise<void> {
    const dlqName = `${queueName}:dlq`;
    job.error = error;
    job.processedAt = new Date();

    try {
      await redisClient.rPush(dlqName, JSON.stringify(job));
      logger.info('Job moved to dead letter queue', { 
        jobId: job.id, 
        queueName,
        dlqName,
        error 
      });
    } catch (err) {
      logger.error('Error moving job to DLQ', err as Error, { 
        jobId: job.id, 
        queueName,
        dlqName 
      });
    }
  }

  /**
   * Get queue length
   */
  static async getQueueLength(queueName: QueueName): Promise<number> {
    try {
      return await redisClient.lLen(queueName);
    } catch (error) {
      logger.error('Error getting queue length', error as Error, { queueName });
      return 0;
    }
  }

  /**
   * Clear queue
   */
  static async clearQueue(queueName: QueueName): Promise<void> {
    try {
      await redisClient.del(queueName);
      logger.info('Queue cleared', { queueName });
    } catch (error) {
      logger.error('Error clearing queue', error as Error, { queueName });
    }
  }

  // ============================================================================
  // Notification Queue Operations
  // ============================================================================

  /**
   * Enqueue notification for async sending
   */
  static async enqueueNotification(notification: NotificationJob): Promise<string> {
    return this.enqueue(QueueName.NOTIFICATIONS, 'send_notification', notification);
  }

  /**
   * Enqueue broadcast notification
   */
  static async enqueueBroadcastNotification(
    title: string,
    message: string,
    senderId: string
  ): Promise<string> {
    return this.enqueue(QueueName.NOTIFICATIONS, 'broadcast_notification', {
      title,
      message,
      senderId,
    });
  }

  // ============================================================================
  // Report Queue Operations
  // ============================================================================

  /**
   * Enqueue report generation
   */
  static async enqueueReportGeneration(report: ReportJob): Promise<string> {
    return this.enqueue(QueueName.REPORTS, 'generate_report', report);
  }

  // ============================================================================
  // Email Queue Operations
  // ============================================================================

  /**
   * Enqueue email sending
   */
  static async enqueueEmail(email: EmailJob): Promise<string> {
    return this.enqueue(QueueName.EMAILS, 'send_email', email);
  }

  // ============================================================================
  // Ranking Queue Operations
  // ============================================================================

  /**
   * Enqueue ranking calculation
   */
  static async enqueueRankingCalculation(ranking: RankingJob): Promise<string> {
    return this.enqueue(QueueName.RANKINGS, 'calculate_ranking', ranking);
  }

  // ============================================================================
  // Bounty Queue Operations
  // ============================================================================

  /**
   * Enqueue bounty calculation
   */
  static async enqueueBountyCalculation(bounty: BountyCalculationJob): Promise<string> {
    return this.enqueue(QueueName.BOUNTY_CALCULATIONS, 'calculate_bounty', bounty);
  }

  // ============================================================================
  // Queue Statistics
  // ============================================================================

  /**
   * Get statistics for all queues
   */
  static async getQueueStats(): Promise<Record<string, number>> {
    const stats: Record<string, number> = {};

    for (const queueName of Object.values(QueueName)) {
      stats[queueName] = await this.getQueueLength(queueName);
    }

    return stats;
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Generate unique job ID
   */
  private static generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
