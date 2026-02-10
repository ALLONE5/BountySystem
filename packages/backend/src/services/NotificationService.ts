import { pool } from '../config/database.js';
import {
  Notification,
  NotificationCreateDTO,
  NotificationResponse,
  NotificationType,
} from '../models/Notification.js';
import { NotificationPushService } from './NotificationPushService.js';

export class NotificationService {
  private pushService: NotificationPushService;

  constructor() {
    this.pushService = new NotificationPushService();
  }
  /**
   * Create a new notification
   */
  async createNotification(data: NotificationCreateDTO): Promise<Notification> {
    const {
      userId = null,
      type,
      title,
      message,
      relatedTaskId = null,
      senderId = null,
    } = data;

    const query = `
      INSERT INTO notifications (user_id, type, title, message, related_task_id, sender_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING 
        id,
        user_id as "userId",
        type,
        title,
        message,
        related_task_id as "relatedTaskId",
        is_read as "isRead",
        sender_id as "senderId",
        created_at as "createdAt"
    `;

    const result = await pool.query(query, [
      userId,
      type,
      title,
      message,
      relatedTaskId,
      senderId,
    ]);

    const notification = result.rows[0];

    // Push notification in real-time
    if (notification.userId) {
      await this.pushService.publishNotification(notification);
    } else if (type === NotificationType.BROADCAST) {
      await this.pushService.publishBroadcast(notification);
    }

    return notification;
  }

  /**
   * Get notifications for a specific user
   */
  async getUserNotifications(
    userId: string,
    unreadOnly: boolean = false
  ): Promise<Notification[]> {
    let query = `
      SELECT 
        id,
        user_id as "userId",
        type,
        title,
        message,
        related_task_id as "relatedTaskId",
        is_read as "isRead",
        sender_id as "senderId",
        created_at as "createdAt"
      FROM notifications
      WHERE user_id = $1
    `;

    if (unreadOnly) {
      query += ' AND is_read = FALSE';
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string): Promise<Notification> {
    const query = `
      UPDATE notifications
      SET is_read = TRUE
      WHERE id = $1
      RETURNING 
        id,
        user_id as "userId",
        type,
        title,
        message,
        related_task_id as "relatedTaskId",
        is_read as "isRead",
        sender_id as "senderId",
        created_at as "createdAt"
    `;

    const result = await pool.query(query, [notificationId]);
    
    if (result.rows.length === 0) {
      throw new Error('Notification not found');
    }

    return result.rows[0];
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    const query = `
      UPDATE notifications
      SET is_read = TRUE
      WHERE user_id = $1 AND is_read = FALSE
    `;

    await pool.query(query, [userId]);
  }

  /**
   * Get notification by ID
   */
  async getNotificationById(notificationId: string): Promise<Notification | null> {
    const query = `
      SELECT 
        id,
        user_id as "userId",
        type,
        title,
        message,
        related_task_id as "relatedTaskId",
        is_read as "isRead",
        sender_id as "senderId",
        created_at as "createdAt"
      FROM notifications
      WHERE id = $1
    `;

    const result = await pool.query(query, [notificationId]);
    return result.rows[0] || null;
  }

  /**
   * Delete old notifications (cleanup utility)
   */
  async deleteOldNotifications(daysOld: number = 90): Promise<number> {
    const query = `
      DELETE FROM notifications
      WHERE created_at < NOW() - INTERVAL '${daysOld} days'
    `;

    const result = await pool.query(query);
    return result.rowCount || 0;
  }

  /**
   * Get unread notification count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    const query = `
      SELECT COUNT(*) as count
      FROM notifications
      WHERE user_id = $1 AND is_read = FALSE
    `;

    const result = await pool.query(query, [userId]);
    return parseInt(result.rows[0].count, 10);
  }

  /**
   * Send task assigned notification
   */
  async sendTaskAssignedNotification(
    userId: string,
    taskId: string,
    taskName: string
  ): Promise<Notification> {
    return this.createNotification({
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
  async sendDeadlineReminderNotification(
    userId: string,
    taskId: string,
    taskName: string,
    deadline: Date
  ): Promise<Notification> {
    const deadlineStr = deadline.toLocaleDateString();
    return this.createNotification({
      userId,
      type: NotificationType.DEADLINE_REMINDER,
      title: 'Task Deadline Approaching',
      message: `Task "${taskName}" is due on ${deadlineStr}`,
      relatedTaskId: taskId,
    });
  }

  /**
   * Send task status changed notification
   */
  async sendStatusChangedNotification(
    userId: string,
    taskId: string,
    taskName: string,
    oldStatus: string,
    newStatus: string
  ): Promise<Notification> {
    return this.createNotification({
      userId,
      type: NotificationType.STATUS_CHANGED,
      title: 'Task Status Updated',
      message: `Task "${taskName}" status changed from ${oldStatus} to ${newStatus}`,
      relatedTaskId: taskId,
    });
  }

  /**
   * Schedule deadline reminder for a task
   * This would typically be called by a scheduler service
   */
  async scheduleDeadlineReminder(
    taskId: string,
    taskName: string,
    assigneeId: string,
    deadline: Date
  ): Promise<void> {
    // In a real implementation, this would schedule a job using a task queue
    // For now, we'll just create the notification if the deadline is within 24 hours
    const now = new Date();
    const timeUntilDeadline = deadline.getTime() - now.getTime();
    const hoursUntilDeadline = timeUntilDeadline / (1000 * 60 * 60);

    if (hoursUntilDeadline > 0 && hoursUntilDeadline <= 24) {
      await this.sendDeadlineReminderNotification(
        assigneeId,
        taskId,
        taskName,
        deadline
      );
    }
  }

  /**
   * Send dependency resolved notification
   * Notifies users that a task's dependencies have been resolved and it's now available
   */
  async sendDependencyResolvedNotification(
    userId: string,
    taskId: string,
    taskName: string
  ): Promise<Notification> {
    return this.createNotification({
      userId,
      type: NotificationType.DEPENDENCY_RESOLVED,
      title: 'Task Dependencies Resolved',
      message: `Task "${taskName}" is now available - all dependencies have been completed`,
      relatedTaskId: taskId,
    });
  }

  /**
   * Notify users about resolved dependencies for multiple tasks
   * This is typically called after a task is completed to notify about downstream tasks
   */
  async notifyDependencyResolved(
    taskId: string,
    taskName: string,
    userIds: string[]
  ): Promise<Notification[]> {
    const notifications: Notification[] = [];

    for (const userId of userIds) {
      const notification = await this.sendDependencyResolvedNotification(
        userId,
        taskId,
        taskName
      );
      notifications.push(notification);
    }

    return notifications;
  }

  /**
   * Send broadcast notification to all users
   * This is typically used by administrators to send system-wide announcements
   */
  async broadcastNotification(
    adminId: string,
    title: string,
    message: string
  ): Promise<number> {
    // Get all user IDs
    const userQuery = 'SELECT id FROM users';
    const userResult = await pool.query(userQuery);
    const userIds = userResult.rows.map((row) => row.id);

    // Create notification for each user
    const insertQuery = `
      INSERT INTO notifications (user_id, type, title, message, sender_id)
      SELECT unnest($1::uuid[]), $2, $3, $4, $5
    `;

    await pool.query(insertQuery, [
      userIds,
      NotificationType.BROADCAST,
      title,
      message,
      adminId,
    ]);

    return userIds.length;
  }

  /**
   * Send broadcast notification to specific users
   * Useful for targeted announcements
   */
  async broadcastToUsers(
    adminId: string,
    userIds: string[],
    title: string,
    message: string
  ): Promise<number> {
    if (userIds.length === 0) {
      return 0;
    }

    const insertQuery = `
      INSERT INTO notifications (user_id, type, title, message, sender_id)
      SELECT unnest($1::uuid[]), $2, $3, $4, $5
    `;

    await pool.query(insertQuery, [
      userIds,
      NotificationType.ADMIN_ANNOUNCEMENT,
      title,
      message,
      adminId,
    ]);

    return userIds.length;
  }

  /**
   * Send broadcast notification to users by role
   * Useful for role-specific announcements
   */
  async broadcastToRole(
    adminId: string,
    role: string,
    title: string,
    message: string
  ): Promise<number> {
    // Get all user IDs with the specified role
    const userQuery = 'SELECT id FROM users WHERE role = $1';
    const userResult = await pool.query(userQuery, [role]);
    const userIds = userResult.rows.map((row) => row.id);

    if (userIds.length === 0) {
      return 0;
    }

    const insertQuery = `
      INSERT INTO notifications (user_id, type, title, message, sender_id)
      SELECT unnest($1::uuid[]), $2, $3, $4, $5
    `;

    await pool.query(insertQuery, [
      userIds,
      NotificationType.ADMIN_ANNOUNCEMENT,
      title,
      message,
      adminId,
    ]);

    return userIds.length;
  }

  /**
   * Send broadcast notification to users by position
   * Useful for position-specific announcements
   */
  async broadcastToPosition(
    adminId: string,
    positionId: string,
    title: string,
    message: string
  ): Promise<number> {
    // Get all user IDs with the specified position
    const userQuery = `
      SELECT DISTINCT u.id 
      FROM users u
      INNER JOIN user_positions up ON u.id = up.user_id
      WHERE up.position_id = $1 AND up.status = 'approved'
    `;
    const userResult = await pool.query(userQuery, [positionId]);
    const userIds = userResult.rows.map((row) => row.id);

    if (userIds.length === 0) {
      return 0;
    }

    const insertQuery = `
      INSERT INTO notifications (user_id, type, title, message, sender_id)
      SELECT unnest($1::uuid[]), $2, $3, $4, $5
    `;

    await pool.query(insertQuery, [
      userIds,
      NotificationType.ADMIN_ANNOUNCEMENT,
      title,
      message,
      adminId,
    ]);

    return userIds.length;
  }

  /**
   * Notify admins that a review action is required (e.g., new position application)
   */
  async notifyAdminsReviewRequired(
    adminIds: string[],
    title: string,
    message: string
  ): Promise<void> {
    if (adminIds.length === 0) return;

    for (const adminId of adminIds) {
      await this.createNotification({
        userId: adminId,
        type: NotificationType.REVIEW_REQUIRED,
        title,
        message,
      });
    }
  }

  /**
   * Notify user that their position application was approved
   */
  async notifyPositionApproved(userId: string, positionName: string): Promise<Notification> {
    return this.createNotification({
      userId,
      type: NotificationType.POSITION_APPROVED,
      title: '岗位申请已通过',
      message: `恭喜！您申请的岗位 "${positionName}" 已通过审核。`,
    });
  }

  /**
   * Notify user that their position application was rejected
   */
  async notifyPositionRejected(userId: string, positionName: string, reason?: string): Promise<Notification> {
    return this.createNotification({
      userId,
      type: NotificationType.POSITION_REJECTED,
      title: '岗位申请未通过',
      message: `很遗憾，您申请的岗位 "${positionName}" 未通过审核。${reason ? `原因: ${reason}` : ''}`,
    });
  }

  /**
   * Notify user that their account information has been updated by admin
   */
  async notifyAccountUpdated(userId: string, changes: string[]): Promise<Notification> {
    return this.createNotification({
      userId,
      type: NotificationType.ACCOUNT_UPDATED,
      title: '账户信息变更',
      message: `您的账户信息已被管理员修改。变更内容: ${changes.join(', ')}`,
    });
  }

  /**
   * Convert Notification to NotificationResponse
   */
  toNotificationResponse(notification: Notification): NotificationResponse {
    return {
      id: notification.id,
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      relatedTaskId: notification.relatedTaskId,
      isRead: notification.isRead,
      senderId: notification.senderId,
      createdAt: notification.createdAt,
    };
  }
}
