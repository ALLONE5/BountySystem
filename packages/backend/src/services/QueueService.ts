/**
 * Queue Service
 * Implements message queue for asynchronous task processing using Redis
 * Handles notification sending, report generation, and other background tasks
 */

import { redisClient } from '../config/redis.js';

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
      console.log(`Job ${job.id} enqueued to ${queueName}`);
      return job.id;
    } catch (error) {
      console.error(`Error enqueueing job to ${queueName}:`, error);
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
      console.log(`Job ${job.id} dequeued from ${queueName} (attempt ${job.attempts})`);
      return job;
    } catch (error) {
      console.error(`Error dequeuing from ${queueName}:`, error);
      return null;
    }
  }

  /**
   * Re-queue a failed job for retry
   */
  static async retry(queueName: QueueName, job: QueueJob, error: string): Promise<void> {
    if (job.attempts >= job.maxAttempts) {
      console.error(`Job ${job.id} failed after ${job.attempts} attempts:`, error);
      await this.moveToDeadLetterQueue(queueName, job, error);
      return;
    }

    job.error = error;
    
    // Add delay before retry
    setTimeout(async () => {
      try {
        await redisClient.rPush(queueName, JSON.stringify(job));
        console.log(`Job ${job.id} re-queued for retry (attempt ${job.attempts + 1})`);
      } catch (err) {
        console.error(`Error re-queuing job ${job.id}:`, err);
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
      console.log(`Job ${job.id} moved to dead letter queue: ${dlqName}`);
    } catch (err) {
      console.error(`Error moving job ${job.id} to DLQ:`, err);
    }
  }

  /**
   * Get queue length
   */
  static async getQueueLength(queueName: QueueName): Promise<number> {
    try {
      return await redisClient.lLen(queueName);
    } catch (error) {
      console.error(`Error getting queue length for ${queueName}:`, error);
      return 0;
    }
  }

  /**
   * Clear queue
   */
  static async clearQueue(queueName: QueueName): Promise<void> {
    try {
      await redisClient.del(queueName);
      console.log(`Queue ${queueName} cleared`);
    } catch (error) {
      console.error(`Error clearing queue ${queueName}:`, error);
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
