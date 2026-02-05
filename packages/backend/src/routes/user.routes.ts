import { Router, Request, Response, NextFunction } from 'express';
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

export default router;
