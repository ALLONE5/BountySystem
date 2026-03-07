import { describe, it, expect, beforeEach, afterEach, afterAll, vi } from 'vitest';
import { pool } from '../config/database.js';
import { NotificationService } from './NotificationService.js';
import { UserService } from './UserService.js';
import { TaskService } from './TaskService.js';
import { NotificationType } from '../models/Notification.js';
import { UserRole } from '../models/User.js';
import { cleanupAllTestData } from '../test-utils/cleanup.js';

describe('NotificationService', () => {
  let notificationService: NotificationService;
  let userService: UserService;
  let taskService: TaskService;
  let testUserId: string;
  let testUserId2: string;
  let testTaskId: string;

  beforeEach(async () => {
    notificationService = new NotificationService();
    userService = new UserService(userRepository, permissionChecker);
    taskService = new TaskService();

    // Mock the push service methods to avoid Redis connection issues
    vi.spyOn(notificationService['pushService'], 'publishNotification').mockResolvedValue(undefined);
    vi.spyOn(notificationService['pushService'], 'publishBroadcast').mockResolvedValue(undefined);

    // Create test users with unique usernames
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    
    const user1 = await userService.createUser({
      username: `notifuser1_${timestamp}_${random}`,
      email: `notifuser1_${timestamp}_${random}@test.com`,
      password: 'Password123',
    });
    testUserId = user1.id;

    const user2 = await userService.createUser({
      username: `notifuser2_${timestamp}_${random}`,
      email: `notifuser2_${timestamp}_${random}@test.com`,
      password: 'Password123',
    });
    testUserId2 = user2.id;

    // Create a test task for task-related notifications
    const task = await taskService.createTask({
      name: `Test Task ${timestamp}`,
      description: 'Test task for notifications',
      publisherId: testUserId,
      visibility: 'public',
    });
    testTaskId = task.id;
  });

  afterEach(async () => {
    // Clean up test data using cleanup utility
    await cleanupAllTestData();
  });



  describe('createNotification', () => {
    it('should create a notification for a user', async () => {
      const notification = await notificationService.createNotification({
        userId: testUserId,
        type: NotificationType.TASK_ASSIGNED,
        title: 'New Task Assigned',
        message: 'You have been assigned a new task',
      });

      expect(notification).toBeDefined();
      expect(notification.id).toBeDefined();
      expect(notification.userId).toBe(testUserId);
      expect(notification.type).toBe(NotificationType.TASK_ASSIGNED);
      expect(notification.title).toBe('New Task Assigned');
      expect(notification.message).toBe('You have been assigned a new task');
      expect(notification.isRead).toBe(false);
      expect(notification.createdAt).toBeInstanceOf(Date);
    });

    it('should create a notification with related task ID', async () => {
      const notification = await notificationService.createNotification({
        userId: testUserId,
        type: NotificationType.STATUS_CHANGED,
        title: 'Task Status Changed',
        message: 'Task status has been updated',
        relatedTaskId: testTaskId, // Use the actual test task ID
      });

      expect(notification.relatedTaskId).toBe(testTaskId);
    });

    it('should create a broadcast notification with sender ID', async () => {
      const notification = await notificationService.createNotification({
        userId: null,
        type: NotificationType.BROADCAST,
        title: 'System Announcement',
        message: 'Maintenance scheduled for tonight',
        senderId: testUserId2,
      });

      expect(notification.userId).toBeNull();
      expect(notification.type).toBe(NotificationType.BROADCAST);
      expect(notification.senderId).toBe(testUserId2);
    });
  });

  describe('getUserNotifications', () => {
    beforeEach(async () => {
      // Create test notifications
      await notificationService.createNotification({
        userId: testUserId,
        type: NotificationType.TASK_ASSIGNED,
        title: 'Notification 1',
        message: 'Message 1',
      });

      await notificationService.createNotification({
        userId: testUserId,
        type: NotificationType.DEADLINE_REMINDER,
        title: 'Notification 2',
        message: 'Message 2',
      });

      await notificationService.createNotification({
        userId: testUserId2,
        type: NotificationType.TASK_ASSIGNED,
        title: 'Other User Notification',
        message: 'Message for other user',
      });
    });

    it('should get all notifications for a user', async () => {
      const notifications = await notificationService.getUserNotifications(testUserId);

      expect(notifications).toHaveLength(2);
      expect(notifications[0].userId).toBe(testUserId);
      expect(notifications[1].userId).toBe(testUserId);
    });

    it('should get only unread notifications when unreadOnly is true', async () => {
      // Mark one notification as read
      const allNotifications = await notificationService.getUserNotifications(testUserId);
      await notificationService.markAsRead(allNotifications[0].id);

      const unreadNotifications = await notificationService.getUserNotifications(
        testUserId,
        true
      );

      expect(unreadNotifications).toHaveLength(1);
      expect(unreadNotifications[0].isRead).toBe(false);
    });

    it('should return notifications in descending order by creation time', async () => {
      const notifications = await notificationService.getUserNotifications(testUserId);

      expect(notifications[0].createdAt.getTime()).toBeGreaterThanOrEqual(
        notifications[1].createdAt.getTime()
      );
    });
  });

  describe('markAsRead', () => {
    it('should mark a notification as read', async () => {
      const notification = await notificationService.createNotification({
        userId: testUserId,
        type: NotificationType.TASK_ASSIGNED,
        title: 'Test Notification',
        message: 'Test Message',
      });

      expect(notification.isRead).toBe(false);

      const updatedNotification = await notificationService.markAsRead(notification.id);

      expect(updatedNotification.isRead).toBe(true);
      expect(updatedNotification.id).toBe(notification.id);
    });

    it('should throw error when notification not found', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';

      await expect(notificationService.markAsRead(fakeId)).rejects.toThrow(
        'Notification not found'
      );
    });
  });

  describe('markAllAsRead', () => {
    beforeEach(async () => {
      // Create multiple unread notifications
      await notificationService.createNotification({
        userId: testUserId,
        type: NotificationType.TASK_ASSIGNED,
        title: 'Notification 1',
        message: 'Message 1',
      });

      await notificationService.createNotification({
        userId: testUserId,
        type: NotificationType.DEADLINE_REMINDER,
        title: 'Notification 2',
        message: 'Message 2',
      });

      await notificationService.createNotification({
        userId: testUserId,
        type: NotificationType.STATUS_CHANGED,
        title: 'Notification 3',
        message: 'Message 3',
      });
    });

    it('should mark all notifications as read for a user', async () => {
      await notificationService.markAllAsRead(testUserId);

      const notifications = await notificationService.getUserNotifications(testUserId);

      expect(notifications).toHaveLength(3);
      notifications.forEach((notification) => {
        expect(notification.isRead).toBe(true);
      });
    });

    it('should not affect other users notifications', async () => {
      await notificationService.createNotification({
        userId: testUserId2,
        type: NotificationType.TASK_ASSIGNED,
        title: 'Other User Notification',
        message: 'Message',
      });

      await notificationService.markAllAsRead(testUserId);

      const user2Notifications = await notificationService.getUserNotifications(testUserId2);
      expect(user2Notifications[0].isRead).toBe(false);
    });
  });

  describe('getUnreadCount', () => {
    beforeEach(async () => {
      // Create notifications
      await notificationService.createNotification({
        userId: testUserId,
        type: NotificationType.TASK_ASSIGNED,
        title: 'Notification 1',
        message: 'Message 1',
      });

      const notification2 = await notificationService.createNotification({
        userId: testUserId,
        type: NotificationType.DEADLINE_REMINDER,
        title: 'Notification 2',
        message: 'Message 2',
      });

      await notificationService.createNotification({
        userId: testUserId,
        type: NotificationType.STATUS_CHANGED,
        title: 'Notification 3',
        message: 'Message 3',
      });

      // Mark one as read
      await notificationService.markAsRead(notification2.id);
    });

    it('should return correct unread count', async () => {
      const count = await notificationService.getUnreadCount(testUserId);
      expect(count).toBe(2);
    });

    it('should return 0 when all notifications are read', async () => {
      await notificationService.markAllAsRead(testUserId);
      const count = await notificationService.getUnreadCount(testUserId);
      expect(count).toBe(0);
    });

    it('should return 0 when user has no notifications', async () => {
      const count = await notificationService.getUnreadCount(testUserId2);
      expect(count).toBe(0);
    });
  });

  describe('getNotificationById', () => {
    it('should get a notification by ID', async () => {
      const created = await notificationService.createNotification({
        userId: testUserId,
        type: NotificationType.TASK_ASSIGNED,
        title: 'Test Notification',
        message: 'Test Message',
      });

      const notification = await notificationService.getNotificationById(created.id);

      expect(notification).toBeDefined();
      expect(notification!.id).toBe(created.id);
      expect(notification!.title).toBe('Test Notification');
    });

    it('should return null when notification not found', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';
      const notification = await notificationService.getNotificationById(fakeId);
      expect(notification).toBeNull();
    });
  });

  describe('Task-related notifications', () => {
    const taskName = 'Test Task';

    describe('sendTaskAssignedNotification', () => {
      it('should send task assigned notification', async () => {
        const notification = await notificationService.sendTaskAssignedNotification(
          testUserId,
          testTaskId,
          taskName
        );

        expect(notification).toBeDefined();
        expect(notification.userId).toBe(testUserId);
        expect(notification.type).toBe(NotificationType.TASK_ASSIGNED);
        expect(notification.title).toBe('New Task Assigned');
        expect(notification.message).toContain(taskName);
        expect(notification.relatedTaskId).toBe(testTaskId);
      });
    });

    describe('sendDeadlineReminderNotification', () => {
      it('should send deadline reminder notification', async () => {
        const deadline = new Date('2024-12-31');
        const notification = await notificationService.sendDeadlineReminderNotification(
          testUserId,
          testTaskId,
          taskName,
          deadline
        );

        expect(notification).toBeDefined();
        expect(notification.userId).toBe(testUserId);
        expect(notification.type).toBe(NotificationType.DEADLINE_REMINDER);
        expect(notification.title).toBe('Task Deadline Approaching');
        expect(notification.message).toContain(taskName);
        expect(notification.message).toContain(deadline.toLocaleDateString());
        expect(notification.relatedTaskId).toBe(testTaskId);
      });
    });

    describe('sendStatusChangedNotification', () => {
      it('should send status changed notification', async () => {
        const notification = await notificationService.sendStatusChangedNotification(
          testUserId,
          testTaskId,
          taskName,
          'in_progress',
          'completed'
        );

        expect(notification).toBeDefined();
        expect(notification.userId).toBe(testUserId);
        expect(notification.type).toBe(NotificationType.STATUS_CHANGED);
        expect(notification.title).toBe('Task Status Updated');
        expect(notification.message).toContain(taskName);
        expect(notification.message).toContain('in_progress');
        expect(notification.message).toContain('completed');
        expect(notification.relatedTaskId).toBe(testTaskId);
      });
    });

    describe('scheduleDeadlineReminder', () => {
      it('should create reminder for deadline within 24 hours', async () => {
        const tomorrow = new Date();
        tomorrow.setHours(tomorrow.getHours() + 12); // 12 hours from now

        await notificationService.scheduleDeadlineReminder(
          testTaskId,
          taskName,
          testUserId,
          tomorrow
        );

        const notifications = await notificationService.getUserNotifications(testUserId);
        const reminderNotification = notifications.find(
          (n) => n.type === NotificationType.DEADLINE_REMINDER
        );

        expect(reminderNotification).toBeDefined();
        expect(reminderNotification!.relatedTaskId).toBe(testTaskId);
      });

      it('should not create reminder for deadline beyond 24 hours', async () => {
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);

        await notificationService.scheduleDeadlineReminder(
          testTaskId,
          taskName,
          testUserId,
          nextWeek
        );

        const notifications = await notificationService.getUserNotifications(testUserId);
        const reminderNotification = notifications.find(
          (n) => n.type === NotificationType.DEADLINE_REMINDER
        );

        expect(reminderNotification).toBeUndefined();
      });

      it('should not create reminder for past deadline', async () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        await notificationService.scheduleDeadlineReminder(
          testTaskId,
          taskName,
          testUserId,
          yesterday
        );

        const notifications = await notificationService.getUserNotifications(testUserId);
        const reminderNotification = notifications.find(
          (n) => n.type === NotificationType.DEADLINE_REMINDER
        );

        expect(reminderNotification).toBeUndefined();
      });
    });
  });

  describe('Dependency resolved notifications', () => {
    const taskName = 'Test Task';

    describe('sendDependencyResolvedNotification', () => {
      it('should send dependency resolved notification', async () => {
        const notification = await notificationService.sendDependencyResolvedNotification(
          testUserId,
          testTaskId,
          taskName
        );

        expect(notification).toBeDefined();
        expect(notification.userId).toBe(testUserId);
        expect(notification.type).toBe(NotificationType.DEPENDENCY_RESOLVED);
        expect(notification.title).toBe('Task Dependencies Resolved');
        expect(notification.message).toContain(taskName);
        expect(notification.message).toContain('available');
        expect(notification.relatedTaskId).toBe(testTaskId);
      });
    });

    describe('notifyDependencyResolved', () => {
      it('should send notifications to multiple users', async () => {
        const notifications = await notificationService.notifyDependencyResolved(
          testTaskId,
          taskName,
          [testUserId, testUserId2]
        );

        expect(notifications).toHaveLength(2);
        expect(notifications[0].userId).toBe(testUserId);
        expect(notifications[1].userId).toBe(testUserId2);
        expect(notifications[0].type).toBe(NotificationType.DEPENDENCY_RESOLVED);
        expect(notifications[1].type).toBe(NotificationType.DEPENDENCY_RESOLVED);
      });

      it('should handle empty user list', async () => {
        const notifications = await notificationService.notifyDependencyResolved(
          testTaskId,
          taskName,
          []
        );

        expect(notifications).toHaveLength(0);
      });
    });
  });

  describe('Broadcast notifications', () => {
    describe('broadcastNotification', () => {
      it('should send notification to all users', async () => {
        const count = await notificationService.broadcastNotification(
          testUserId2,
          'System Announcement',
          'Maintenance scheduled for tonight'
        );

        expect(count).toBeGreaterThanOrEqual(2); // At least our 2 test users

        // Verify both test users received the notification
        const user1Notifications = await notificationService.getUserNotifications(testUserId);
        const user2Notifications = await notificationService.getUserNotifications(testUserId2);

        const user1Broadcast = user1Notifications.find(
          (n) => n.type === NotificationType.BROADCAST && n.title === 'System Announcement'
        );
        const user2Broadcast = user2Notifications.find(
          (n) => n.type === NotificationType.BROADCAST && n.title === 'System Announcement'
        );

        expect(user1Broadcast).toBeDefined();
        expect(user2Broadcast).toBeDefined();
        expect(user1Broadcast!.senderId).toBe(testUserId2);
        expect(user2Broadcast!.senderId).toBe(testUserId2);
      });

      it('should mark broadcast notifications with correct type', async () => {
        await notificationService.broadcastNotification(
          testUserId,
          'Test Broadcast',
          'Test Message'
        );

        const notifications = await notificationService.getUserNotifications(testUserId2);
        const broadcast = notifications.find((n) => n.title === 'Test Broadcast');

        expect(broadcast).toBeDefined();
        expect(broadcast!.type).toBe(NotificationType.BROADCAST);
      });
    });

    describe('broadcastToUsers', () => {
      it('should send notification to specific users', async () => {
        const count = await notificationService.broadcastToUsers(
          testUserId,
          [testUserId2],
          'Targeted Announcement',
          'This is for specific users'
        );

        expect(count).toBe(1);

        const user2Notifications = await notificationService.getUserNotifications(testUserId2);
        const targeted = user2Notifications.find((n) => n.title === 'Targeted Announcement');

        expect(targeted).toBeDefined();
        expect(targeted!.senderId).toBe(testUserId);
      });

      it('should handle empty user list', async () => {
        const count = await notificationService.broadcastToUsers(
          testUserId,
          [],
          'Empty Broadcast',
          'Should not be sent'
        );

        expect(count).toBe(0);
      });

      it('should send to multiple specific users', async () => {
        const count = await notificationService.broadcastToUsers(
          testUserId,
          [testUserId, testUserId2],
          'Multi-User Announcement',
          'For multiple users'
        );

        expect(count).toBe(2);

        const user1Notifications = await notificationService.getUserNotifications(testUserId);
        const user2Notifications = await notificationService.getUserNotifications(testUserId2);

        const user1Multi = user1Notifications.find(
          (n) => n.title === 'Multi-User Announcement'
        );
        const user2Multi = user2Notifications.find(
          (n) => n.title === 'Multi-User Announcement'
        );

        expect(user1Multi).toBeDefined();
        expect(user2Multi).toBeDefined();
      });
    });
  });
});
