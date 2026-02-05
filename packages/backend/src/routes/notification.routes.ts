import { Router, Request, Response } from 'express';
import { NotificationService } from '../services/NotificationService.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
const notificationService = new NotificationService();

/**
 * Get user's notifications
 * GET /api/notifications?unreadOnly=true
 */
router.get('/', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const unreadOnly = req.query.unreadOnly === 'true';

  const notifications = await notificationService.getUserNotifications(
    userId,
    unreadOnly
  );

  res.json({
    success: true,
    data: notifications,
  });
}));

router.get('/unread-count', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const count = await notificationService.getUnreadCount(userId);

  res.json({
    success: true,
    data: { count },
  });
}));

router.patch('/:id/read', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.userId;

  // Verify the notification belongs to the user
  const notification = await notificationService.getNotificationById(id);
  
  if (!notification) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found',
    });
  }

  if (notification.userId !== userId) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to mark this notification as read',
    });
  }

  const updatedNotification = await notificationService.markAsRead(id);

  res.json({
    success: true,
    data: updatedNotification,
  });
}));

router.patch('/read-all', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  await notificationService.markAllAsRead(userId);

  res.json({
    success: true,
    message: 'All notifications marked as read',
  });
}));

router.post('/broadcast', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const adminId = req.user!.userId;
  const { title, message, userIds } = req.body;

  // Validate admin role
  const userRole = req.user!.role;
  if (userRole !== 'position_admin' && userRole !== 'super_admin') {
    return res.status(403).json({
      success: false,
      message: 'Only administrators can send broadcast notifications',
    });
  }

  // Validate input
  if (!title || !message) {
    return res.status(400).json({
      success: false,
      message: 'Title and message are required',
    });
  }

  let count: number;
  if (userIds && Array.isArray(userIds) && userIds.length > 0) {
    // Broadcast to specific users
    count = await notificationService.broadcastToUsers(adminId, userIds, title, message);
  } else {
    // Broadcast to all users
    count = await notificationService.broadcastNotification(adminId, title, message);
  }

  res.json({
    success: true,
    message: `Broadcast notification sent to ${count} users`,
    data: { count },
  });
}));

export default router;
