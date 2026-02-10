import type { Request, Response, NextFunction } from 'express';
import { Router } from 'express';
import { z } from 'zod';
import { UserService } from '../services/UserService.js';
import { ValidationError, AuthenticationError } from '../utils/errors.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { resolve } from '../config/container.js';

const router = Router();
// Use DI container to get properly configured UserService
const userService = resolve<UserService>('userService');

// Apply authentication middleware to all routes
router.use(authenticate);

// Validation schemas
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

const updateEmailSchema = z.object({
  newEmail: z.string().email(),
});

const updateProfileSchema = z.object({
  username: z.string().min(3).max(50).optional(),
});

const batchUsersSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
});

router.get('/search', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { q } = req.query;
  if (!q || typeof q !== 'string') {
    return res.status(400).json({ error: 'Query parameter q is required' });
  }
  const users = await userService.searchUsers(q);
  res.json(users.map(u => userService.toUserResponse(u)));
}));

router.get('/:id', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = await userService.findById(id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(userService.toUserResponse(user));
}));

router.post('/batch', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { ids } = batchUsersSchema.parse(req.body);
  const users = await userService.findByIds(ids);
  const map = Object.fromEntries(users.map((u) => [u.id, userService.toUserResponse(u)]));
  res.json(map);
}));

router.put('/me', asyncHandler(async (req: Request, res: Response) => {
  // Get user from request (set by auth middleware)
  const userId = (req as any).user?.userId;

  if (!userId) {
    throw new AuthenticationError('Not authenticated');
  }

  // Validate input
  const validatedData = updateProfileSchema.parse(req.body);

  // Update profile
  const updatedUser = await userService.updateUser(userId, userId, validatedData);

  res.status(200).json({
    message: 'Profile updated successfully',
    user: updatedUser,
  });
}));

router.put('/me/password', asyncHandler(async (req: Request, res: Response) => {
  // Get user from request (set by auth middleware)
  const userId = (req as any).user?.userId;

  if (!userId) {
    throw new AuthenticationError('Not authenticated');
  }

  // Validate input
  const validatedData = changePasswordSchema.parse(req.body);

  // Change password
  await userService.changePassword(
    userId,
    validatedData.currentPassword,
    validatedData.newPassword
  );

  res.status(200).json({ message: 'Password changed successfully' });
}));

router.put('/me/email', asyncHandler(async (req: Request, res: Response) => {
  // Get user from request (set by auth middleware)
  const userId = (req as any).user?.userId;

  if (!userId) {
    throw new AuthenticationError('Not authenticated');
  }

  // Validate input
  const validatedData = updateEmailSchema.parse(req.body);

  // Update email
  const updatedUser = await userService.updateEmail(userId, validatedData.newEmail);

  res.status(200).json({
    message: 'Email updated successfully',
    user: userService.toUserResponse(updatedUser),
  });
}));

router.post('/me/email/request', asyncHandler(async (req: Request, res: Response) => {
  // Get user from request (set by auth middleware)
  const userId = (req as any).user?.userId;

  if (!userId) {
    throw new AuthenticationError('Not authenticated');
  }

  // Validate input
  const validatedData = updateEmailSchema.parse(req.body);

  // Request email change
  await userService.requestEmailChange(userId, validatedData.newEmail);

  res.status(200).json({
    message: 'Email change requested. Please check your email for verification.',
  });
}));

// Notification preferences validation schema
const notificationPreferencesSchema = z.object({
  taskAssigned: z.boolean(),
  taskCompleted: z.boolean(),
  taskAbandoned: z.boolean(),
  bountyReceived: z.boolean(),
  systemNotifications: z.boolean(),
});

/**
 * GET /api/users/me/notifications
 * Get current user's notification preferences
 */
router.get('/me/notifications', asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  if (!userId) {
    throw new AuthenticationError('Not authenticated');
  }

  const preferences = await userService.getNotificationPreferences(userId);
  res.status(200).json({ preferences });
}));

/**
 * PUT /api/users/me/notifications
 * Update current user's notification preferences
 */
router.put('/me/notifications', asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  if (!userId) {
    throw new AuthenticationError('Not authenticated');
  }

  try {
    const validatedData = notificationPreferencesSchema.parse(req.body);
    const updatedUser = await userService.updateNotificationPreferences(userId, validatedData);
    
    res.status(200).json({
      message: 'Notification preferences updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid notification preferences data', error.errors);
    }
    throw error;
  }
}));

export default router;
