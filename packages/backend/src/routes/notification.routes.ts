import type { Request, Response } from 'express';
import { Router } from 'express';
import { NotificationService } from '../services/NotificationService.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { queryTransformers } from '../utils/queryValidation.js';

const router = Router();
const notificationService = new NotificationService();

/**
 * Get user's notifications
 * GET /api/notifications?unreadOnly=true
 */
router.get('/', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const unreadOnly = queryTransformers.toBoolean(req.query.unreadOnly as string) ?? false;

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
  const { title, message, targetType, targetValue } = req.body;

  // Validate admin role
  const userRole = req.user!.role;
  if (userRole !== 'position_admin' && userRole !== 'super_admin' && userRole !== 'developer') {
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
  
  switch (targetType) {
    case 'all':
      // Broadcast to all users
      count = await notificationService.broadcastNotification(adminId, title, message);
      break;
      
    case 'users':
      // Broadcast to specific users
      if (!targetValue || !Array.isArray(targetValue) || targetValue.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'User IDs array is required for user-specific broadcast',
        });
      }
      count = await notificationService.broadcastToUsers(adminId, targetValue, title, message);
      break;
      
    case 'role':
      // Broadcast to users with specific role
      if (!targetValue || typeof targetValue !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Role is required for role-specific broadcast',
        });
      }
      count = await notificationService.broadcastToRole(adminId, targetValue, title, message);
      break;
      
    case 'position':
      // Broadcast to users with specific position
      if (!targetValue || typeof targetValue !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Position ID is required for position-specific broadcast',
        });
      }
      count = await notificationService.broadcastToPosition(adminId, targetValue, title, message);
      break;
      
    default:
      return res.status(400).json({
        success: false,
        message: 'Invalid targetType. Must be one of: all, users, role, position',
      });
  }

  res.json({
    success: true,
    message: `Notification sent to ${count} users`,
    data: { count },
  });
}));

export default router;
