import { redisClient, redisSubscriber } from '../config/redis.js';
import { logger } from '../config/logger.js';
import { Notification } from '../models/Notification.js';
/**
 * NotificationPushService handles real-time notification delivery using Redis Pub/Sub
 * This service can be extended to support WebSocket connections in the future
 */
export class NotificationPushService {
  private static readonly NOTIFICATION_CHANNEL = 'notifications';

  /**
   * Publish a notification to Redis for real-time delivery
   * In a production system, this would be consumed by WebSocket servers
   */
  async publishNotification(notification: Notification): Promise<void> {
    try {
      const message = JSON.stringify({
        type: 'notification',
        data: notification,
        timestamp: new Date().toISOString(),
      });

      await redisClient.publish(
        `${NotificationPushService.NOTIFICATION_CHANNEL}:${notification.userId}`,
        message
      );
    } catch (error) {
      logger.error('Error publishing notification:', error);
      // Don't throw - notification is already saved in database
    }
  }

  /**
   * Publish multiple notifications (e.g., for broadcast)
   */
  async publishNotifications(notifications: Notification[]): Promise<void> {
    const promises = notifications.map((notification) =>
      this.publishNotification(notification)
    );
    await Promise.all(promises);
  }

  /**
   * Publish a broadcast notification to all users
   */
  async publishBroadcast(notification: Notification): Promise<void> {
    try {
      const message = JSON.stringify({
        type: 'broadcast',
        data: notification,
        timestamp: new Date().toISOString(),
      });

      await redisClient.publish(NotificationPushService.NOTIFICATION_CHANNEL, message);
    } catch (error) {
      logger.error('Error publishing broadcast:', error);
    }
  }

  /**
   * Subscribe to notifications for a specific user
   * This would typically be called by a WebSocket connection handler
   */
  async subscribeToUserNotifications(
    userId: string,
    callback: (notification: Notification) => void
  ): Promise<void> {
    const channel = `${NotificationPushService.NOTIFICATION_CHANNEL}:${userId}`;

    await redisSubscriber.subscribe(channel, (message: string) => {
      try {
        const parsed = JSON.parse(message);
        if (parsed.type === 'notification' && parsed.data) {
          callback(parsed.data);
        }
      } catch (error) {
        logger.error('Error parsing notification message:', error);
      }
    });
  }

  /**
   * Subscribe to broadcast notifications
   */
  async subscribeToBroadcasts(callback: (notification: Notification) => void): Promise<void> {
    await redisSubscriber.subscribe(
      NotificationPushService.NOTIFICATION_CHANNEL,
      (message: string) => {
        try {
          const parsed = JSON.parse(message);
          if (parsed.type === 'broadcast' && parsed.data) {
            callback(parsed.data);
          }
        } catch (error) {
          logger.error('Error parsing broadcast message:', error);
        }
      }
    );
  }

  /**
   * Unsubscribe from user notifications
   */
  async unsubscribeFromUserNotifications(userId: string): Promise<void> {
    const channel = `${NotificationPushService.NOTIFICATION_CHANNEL}:${userId}`;
    await redisSubscriber.unsubscribe(channel);
  }

  /**
   * Unsubscribe from broadcasts
   */
  async unsubscribeFromBroadcasts(): Promise<void> {
    await redisSubscriber.unsubscribe(NotificationPushService.NOTIFICATION_CHANNEL);
  }

  /**
   * Get the number of active subscribers for a user's notifications
   */
  async getSubscriberCount(userId: string): Promise<number> {
    try {
      const channel = `${NotificationPushService.NOTIFICATION_CHANNEL}:${userId}`;
      const count = await redisClient.pubSubNumSub(channel);
      return count[channel] || 0;
    } catch (error) {
      logger.error('Error getting subscriber count:', error);
      return 0;
    }
  }
}
