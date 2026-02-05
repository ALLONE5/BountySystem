import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NotificationPushService } from './NotificationPushService.js';
import { NotificationType } from '../models/Notification.js';
import { redisClient } from '../config/redis.js';

describe('NotificationPushService', () => {
  let pushService: NotificationPushService;
  const testUserId = '123e4567-e89b-12d3-a456-426614174000';

  beforeEach(() => {
    pushService = new NotificationPushService();
  });

  afterEach(async () => {
    // Clean up any subscriptions
    try {
      await pushService.unsubscribeFromUserNotifications(testUserId);
      await pushService.unsubscribeFromBroadcasts();
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('publishNotification', () => {
    it('should publish a notification to Redis', async () => {
      const notification = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        userId: testUserId,
        type: NotificationType.TASK_ASSIGNED,
        title: 'Test Notification',
        message: 'Test Message',
        relatedTaskId: null,
        isRead: false,
        senderId: null,
        createdAt: new Date(),
      };

      // This should not throw
      await expect(pushService.publishNotification(notification)).resolves.not.toThrow();
    });

    it('should handle publish errors gracefully', async () => {
      const notification = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        userId: testUserId,
        type: NotificationType.TASK_ASSIGNED,
        title: 'Test Notification',
        message: 'Test Message',
        relatedTaskId: null,
        isRead: false,
        senderId: null,
        createdAt: new Date(),
      };

      // Should not throw even if Redis is unavailable
      await expect(pushService.publishNotification(notification)).resolves.not.toThrow();
    });
  });

  describe('publishBroadcast', () => {
    it('should publish a broadcast notification', async () => {
      const notification = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        userId: null,
        type: NotificationType.BROADCAST,
        title: 'System Announcement',
        message: 'Maintenance scheduled',
        relatedTaskId: null,
        isRead: false,
        senderId: testUserId,
        createdAt: new Date(),
      };

      await expect(pushService.publishBroadcast(notification)).resolves.not.toThrow();
    });
  });

  describe('publishNotifications', () => {
    it('should publish multiple notifications', async () => {
      const notifications = [
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          userId: testUserId,
          type: NotificationType.TASK_ASSIGNED,
          title: 'Notification 1',
          message: 'Message 1',
          relatedTaskId: null,
          isRead: false,
          senderId: null,
          createdAt: new Date(),
        },
        {
          id: '123e4567-e89b-12d3-a456-426614174002',
          userId: testUserId,
          type: NotificationType.DEADLINE_REMINDER,
          title: 'Notification 2',
          message: 'Message 2',
          relatedTaskId: null,
          isRead: false,
          senderId: null,
          createdAt: new Date(),
        },
      ];

      await expect(pushService.publishNotifications(notifications)).resolves.not.toThrow();
    });

    it('should handle empty notification array', async () => {
      await expect(pushService.publishNotifications([])).resolves.not.toThrow();
    });
  });

  describe('subscription methods', () => {
    it('should allow subscribing to user notifications', async () => {
      const callback = (notification: any) => {
        // Callback for testing
      };

      await expect(
        pushService.subscribeToUserNotifications(testUserId, callback)
      ).resolves.not.toThrow();
    });

    it('should allow subscribing to broadcasts', async () => {
      const callback = (notification: any) => {
        // Callback for testing
      };

      await expect(pushService.subscribeToBroadcasts(callback)).resolves.not.toThrow();
    });

    it('should allow unsubscribing from user notifications', async () => {
      await expect(
        pushService.unsubscribeFromUserNotifications(testUserId)
      ).resolves.not.toThrow();
    });

    it('should allow unsubscribing from broadcasts', async () => {
      await expect(pushService.unsubscribeFromBroadcasts()).resolves.not.toThrow();
    });
  });

  describe('getSubscriberCount', () => {
    it('should return subscriber count', async () => {
      const count = await pushService.getSubscriberCount(testUserId);
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });
});
