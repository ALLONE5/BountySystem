/**
 * Async Notification Service
 * Wrapper around NotificationService that uses queue for async processing
 */

import { QueueService, NotificationJob } from './QueueService';
import { NotificationCreateDTO, NotificationType } from '../models/Notification';

export class AsyncNotificationService {
  /**
   * Send notification asynchronously via queue
   */
  static async sendNotificationAsync(data: NotificationCreateDTO): Promise<string> {
    const job: NotificationJob = {
      userId: data.userId || '',
      type: data.type,
      title: data.title,
      message: data.message,
      relatedTaskId: data.relatedTaskId || undefined,
    };

    return QueueService.enqueueNotification(job);
  }

  /**
   * Send task assignment notification
   */
  static async notifyTaskAssignment(
    userId: string,
    taskId: string,
    taskName: string
  ): Promise<string> {
    return this.sendNotificationAsync({
      userId,
      type: NotificationType.TASK_ASSIGNED,
      title: 'New Task Assigned',
      message: `You have been assigned to task: ${taskName}`,
      relatedTaskId: taskId,
    });
  }

  /**
   * Send deadline reminder notification
   */
  static async notifyDeadlineReminder(
    userId: string,
    taskId: string,
    taskName: string,
    deadline: Date
  ): Promise<string> {
    return this.sendNotificationAsync({
      userId,
      type: NotificationType.DEADLINE_REMINDER,
      title: 'Task Deadline Approaching',
      message: `Task "${taskName}" is due on ${deadline.toLocaleDateString()}`,
      relatedTaskId: taskId,
    });
  }

  /**
   * Send dependency resolved notification
   */
  static async notifyDependencyResolved(
    userId: string,
    taskId: string,
    taskName: string
  ): Promise<string> {
    return this.sendNotificationAsync({
      userId,
      type: NotificationType.DEPENDENCY_RESOLVED,
      title: 'Task Now Available',
      message: `Task "${taskName}" is now available for assignment`,
      relatedTaskId: taskId,
    });
  }

  /**
   * Send status change notification
   */
  static async notifyStatusChange(
    userId: string,
    taskId: string,
    taskName: string,
    newStatus: string
  ): Promise<string> {
    return this.sendNotificationAsync({
      userId,
      type: NotificationType.STATUS_CHANGED,
      title: 'Task Status Updated',
      message: `Task "${taskName}" status changed to: ${newStatus}`,
      relatedTaskId: taskId,
    });
  }

  /**
   * Send position application approved notification
   */
  static async notifyPositionApproved(
    userId: string,
    positionName: string
  ): Promise<string> {
    return this.sendNotificationAsync({
      userId,
      type: NotificationType.POSITION_APPROVED,
      title: 'Position Application Approved',
      message: `Your application for ${positionName} has been approved`,
    });
  }

  /**
   * Send position application rejected notification
   */
  static async notifyPositionRejected(
    userId: string,
    positionName: string,
    reason?: string
  ): Promise<string> {
    const message = reason
      ? `Your application for ${positionName} was rejected. Reason: ${reason}`
      : `Your application for ${positionName} was rejected`;

    return this.sendNotificationAsync({
      userId,
      type: NotificationType.POSITION_REJECTED,
      title: 'Position Application Rejected',
      message,
    });
  }

  /**
   * Send broadcast notification to all users
   */
  static async sendBroadcastAsync(
    senderId: string,
    title: string,
    message: string
  ): Promise<string> {
    return QueueService.enqueueBroadcastNotification(title, message, senderId);
  }

  /**
   * Batch send notifications
   */
  static async sendBatchNotifications(
    notifications: NotificationCreateDTO[]
  ): Promise<string[]> {
    const jobIds: string[] = [];

    for (const notification of notifications) {
      const jobId = await this.sendNotificationAsync(notification);
      jobIds.push(jobId);
    }

    return jobIds;
  }
}
