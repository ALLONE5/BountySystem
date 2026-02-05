/**
 * Queue Worker
 * Processes jobs from message queues
 */

import { Pool } from 'pg';
import { QueueService, QueueName, QueueJob } from '../services/QueueService';
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
      console.log('Queue workers already running');
      return;
    }

    this.running = true;
    console.log('Starting queue workers...');

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

    console.log('All queue workers started');
  }

  /**
   * Stop all queue workers
   */
  async stop(): Promise<void> {
    if (!this.running) {
      console.log('Queue workers not running');
      return;
    }

    this.running = false;
    console.log('Stopping queue workers...');

    // Wait for all workers to finish current jobs
    await Promise.all(this.workers.values());
    this.workers.clear();

    console.log('All queue workers stopped');
  }

  /**
   * Start a worker for a specific queue
   */
  private async startWorker(
    queueName: QueueName,
    processor: (job: QueueJob) => Promise<void>
  ): Promise<void> {
    console.log(`Worker started for queue: ${queueName}`);

    while (this.running) {
      try {
        // Blocking pop with 5 second timeout
        const job = await QueueService.dequeue(queueName, 5);

        if (!job) continue;

        try {
          await processor(job);
          console.log(`Job ${job.id} processed successfully`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error(`Error processing job ${job.id}:`, errorMessage);
          await QueueService.retry(queueName, job, errorMessage);
        }
      } catch (error) {
        console.error(`Worker error for ${queueName}:`, error);
        // Wait before retrying to avoid tight loop on persistent errors
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }

    console.log(`Worker stopped for queue: ${queueName}`);
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
      console.log(`Generating ${data.reportType} report for user ${data.userId}`);
      
      // TODO: Implement actual report generation logic
      // This would involve:
      // 1. Query tasks for the specified period
      // 2. Calculate statistics
      // 3. Generate report document (PDF/CSV)
      // 4. Store report or send to user
      // 5. Notify user that report is ready

      // Placeholder implementation
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log(`Report generated for user ${data.userId}`);
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
      console.log(`Sending email to ${data.to}: ${data.subject}`);
      
      // TODO: Implement actual email sending logic
      // This would involve:
      // 1. Connect to email service (SendGrid, AWS SES, etc.)
      // 2. Render email template if provided
      // 3. Send email
      // 4. Handle delivery status

      // Placeholder implementation
      await new Promise((resolve) => setTimeout(resolve, 500));
      console.log(`Email sent to ${data.to}`);
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
      console.log(`Calculating ${data.period} rankings for ${data.year}`);
      
      await this.rankingService.calculateRankings(
        data.period,
        data.year,
        data.month,
        data.quarter
      );

      console.log(`Rankings calculated for ${data.period}`);
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
      console.log(`Calculating bounty for task ${data.taskId}`);
      
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

      console.log(`Bounty calculated for task ${data.taskId}: ${bountyAmount}`);
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
