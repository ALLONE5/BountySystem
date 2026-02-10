/**
 * Queue Worker
 * Processes jobs from message queues
 */

import type { Pool } from 'pg';
import { logger } from '../config/logger.js';
import type { QueueName, QueueJob } from '../services/QueueService';
import { QueueService } from '../services/QueueService';
import { NotificationService } from '../services/NotificationService';
import { RankingService } from '../services/RankingService';
import { BountyService } from '../services/BountyService';
import { NotificationPushService } from '../services/NotificationPushService';

export class QueueWorker {
  private running: boolean = false;
  private workers: Map<QueueName, Promise<void>> = new Map();

  constructor(
    private pool: Pool,
    private notificationService: NotificationService,
    private rankingService: RankingService,
    private bountyService: BountyService,
    private notificationPushService: NotificationPushService
  ) {}

  /**
   * Start all queue workers
   */
  async start(): Promise<void> {
    if (this.running) {
      logger.warn('Queue workers already running');
      return;
    }

    this.running = true;
    logger.info('Starting queue workers...');

    // Start workers for each queue
    this.workers.set(
      QueueName.NOTIFICATIONS,
      this.startWorker(QueueName.NOTIFICATIONS, this.processNotificationJob.bind(this))
    );

    this.workers.set(
      QueueName.REPORTS,
      this.startWorker(QueueName.REPORTS, this.processReportJob.bind(this))
    );

    this.workers.set(
      QueueName.EMAILS,
      this.startWorker(QueueName.EMAILS, this.processEmailJob.bind(this))
    );

    this.workers.set(
      QueueName.RANKINGS,
      this.startWorker(QueueName.RANKINGS, this.processRankingJob.bind(this))
    );

    this.workers.set(
      QueueName.BOUNTY_CALCULATIONS,
      this.startWorker(QueueName.BOUNTY_CALCULATIONS, this.processBountyJob.bind(this))
    );

    logger.info('All queue workers started');
  }

  /**
   * Stop all queue workers
   */
  async stop(): Promise<void> {
    if (!this.running) {
      logger.warn('Queue workers not running');
      return;
    }

    this.running = false;
    logger.info('Stopping queue workers...');

    // Wait for all workers to finish current jobs
    await Promise.all(this.workers.values());
    this.workers.clear();

    logger.info('All queue workers stopped');
  }

  /**
   * Start a worker for a specific queue
   */
  private async startWorker(
    queueName: QueueName,
    processor: (job: QueueJob) => Promise<void>
  ): Promise<void> {
    logger.info('Worker started for queue', { queueName });

    while (this.running) {
      try {
        // Blocking pop with 5 second timeout
        const job = await QueueService.dequeue(queueName, 5);

        if (!job) continue;

        try {
          await processor(job);
          logger.info('Job processed successfully', { jobId: job.id, queueName });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          logger.error('Error processing job', error as Error, { jobId: job.id, queueName });
          await QueueService.retry(queueName, job, errorMessage);
        }
      } catch (error) {
        logger.error('Worker error', error as Error, { queueName });
        // Wait before retrying to avoid tight loop on persistent errors
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }

    logger.info('Worker stopped for queue', { queueName });
  }

  // ============================================================================
  // Job Processors
  // ============================================================================

  /**
   * Process notification job
   */
  private async processNotificationJob(job: QueueJob): Promise<void> {
    const { type, data } = job;

    if (type === 'send_notification') {
      // Send individual notification
      const notification = await this.notificationService.createNotification({
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        relatedTaskId: data.relatedTaskId,
      });

      // Push notification via WebSocket
      await this.notificationPushService.publishNotification(notification);
    } else if (type === 'broadcast_notification') {
      // Send broadcast notification to all users
      await this.notificationService.broadcastNotification(
        data.senderId,
        data.title,
        data.message
      );
    } else {
      throw new Error(`Unknown notification job type: ${type}`);
    }
  }

  /**
   * Process report generation job
   */
  private async processReportJob(job: QueueJob): Promise<void> {
    const { type, data } = job;

    if (type === 'generate_report') {
      logger.info('Generating report', { reportType: data.reportType, userId: data.userId });
      
      // TODO: [Future Enhancement] Implement actual report generation logic
      // Context: Currently a placeholder. Full implementation requires:
      // 1. Query tasks for the specified period
      // 2. Calculate statistics (completion rates, bounty totals, etc.)
      // 3. Generate report document (PDF/CSV format)
      // 4. Store report in file storage or database
      // 5. Notify user that report is ready via notification system
      // Dependencies: Requires report template system and file storage service

      // Placeholder implementation - simulates processing time
      await new Promise((resolve) => setTimeout(resolve, 1000));
      logger.info('Report generated (placeholder)', { userId: data.userId });
    } else {
      throw new Error(`Unknown report job type: ${type}`);
    }
  }

  /**
   * Process email job
   */
  private async processEmailJob(job: QueueJob): Promise<void> {
    const { type, data } = job;

    if (type === 'send_email') {
      logger.info('Sending email', { to: data.to, subject: data.subject });
      
      // TODO: [Future Enhancement] Implement actual email sending logic
      // Context: Currently a placeholder. Full implementation requires:
      // 1. Connect to email service provider (SendGrid, AWS SES, Mailgun, etc.)
      // 2. Render email template with provided data if template ID is specified
      // 3. Send email with proper error handling and retry logic
      // 4. Handle delivery status callbacks and track email metrics
      // Dependencies: Requires email service configuration and template system

      // Placeholder implementation - simulates email sending time
      await new Promise((resolve) => setTimeout(resolve, 500));
      logger.info('Email sent (placeholder)', { to: data.to });
    } else {
      throw new Error(`Unknown email job type: ${type}`);
    }
  }

  /**
   * Process ranking calculation job
   */
  private async processRankingJob(job: QueueJob): Promise<void> {
    const { type, data } = job;

    if (type === 'calculate_ranking') {
      logger.info('Calculating rankings', { period: data.period, year: data.year });
      
      await this.rankingService.calculateRankings(
        data.period,
        data.year,
        data.month,
        data.quarter
      );

      logger.info('Rankings calculated', { period: data.period });
    } else {
      throw new Error(`Unknown ranking job type: ${type}`);
    }
  }

  /**
   * Process bounty calculation job
   */
  private async processBountyJob(job: QueueJob): Promise<void> {
    const { type, data } = job;

    if (type === 'calculate_bounty') {
      logger.info('Calculating bounty for task', { taskId: data.taskId });
      
      // Get task details
      const taskResult = await this.pool.query(
        'SELECT * FROM tasks WHERE id = $1',
        [data.taskId]
      );

      if (taskResult.rows.length === 0) {
        throw new Error(`Task ${data.taskId} not found`);
      }

      const task = taskResult.rows[0];

      // Calculate bounty
      const bountyAmount = await this.bountyService.calculateBounty(task);

      // Update task with new bounty
      await this.pool.query(
        'UPDATE tasks SET bounty_amount = $1, updated_at = NOW() WHERE id = $2',
        [bountyAmount, data.taskId]
      );

      logger.info('Bounty calculated for task', { taskId: data.taskId, bountyAmount });
    } else {
      throw new Error(`Unknown bounty job type: ${type}`);
    }
  }

  /**
   * Get worker status
   */
  getStatus(): { running: boolean; activeWorkers: number } {
    return {
      running: this.running,
      activeWorkers: this.workers.size,
    };
  }
}
