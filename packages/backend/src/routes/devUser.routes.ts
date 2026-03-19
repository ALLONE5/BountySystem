import type { Request, Response } from 'express';
import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { UserService } from '../services/UserService.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireDeveloper } from '../middleware/permission.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ValidationError } from '../utils/errors.js';
import { UserRole } from '../models/User.js';
import { resolve } from '../config/container.js';
import { pool } from '../config/database.js';

const router = Router();
const userService = resolve<UserService>('userService');

router.use(authenticate);
router.use(requireDeveloper);

const updateUserSchema = z.object({
  username: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: z.nativeEnum(UserRole).optional(),
  positionIds: z.array(z.string().uuid()).optional(),
  managedPositionIds: z.array(z.string().uuid()).optional(),
});

const resetPasswordSchema = z.object({
  newPassword: z.string().min(6),
});

const createUserSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.nativeEnum(UserRole).default(UserRole.USER),
});

/**
 * GET /api/dev/users
 * Get all users — developer has unrestricted access
 */
router.get('/', asyncHandler(async (_req: Request, res: Response) => {
  const users = await userService.getAllUsers();
  const userResponses = users.map((u) => userService.toUserResponse(u));
  res.status(200).json({ users: userResponses, count: userResponses.length });
}));

/**
 * POST /api/dev/users
 * Create a new user with any role
 */
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const data = createUserSchema.parse(req.body);
  const user = await userService.createUser(data);
  res.status(201).json({ message: 'User created successfully', user: userService.toUserResponse(user) });
}));

/**
 * GET /api/dev/users/:userId
 * Get user details with positions
 */
router.get('/:userId', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const user = await userService.getUserWithPositions(userId);
  res.status(200).json({
    user: {
      ...userService.toUserResponse(user),
      positions: user.positions,
    },
  });
}));

/**
 * PUT /api/dev/users/:userId
 * Update user — developer can change any field including role
 */
router.put('/:userId', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const validatedData = updateUserSchema.parse(req.body);

  const updatedUser = await userService.updateUserByAdmin(userId, validatedData);

  if (validatedData.positionIds !== undefined) {
    await userService.updateUserPositions(userId, validatedData.positionIds);
  }

  if (validatedData.managedPositionIds !== undefined) {
    await userService.updateUserManagedPositions(userId, validatedData.managedPositionIds);
  }

  res.status(200).json({ message: 'User updated successfully', user: userService.toUserResponse(updatedUser) });
}));

/**
 * DELETE /api/dev/users/:userId
 * Delete user — developer has full delete access
 */
router.delete('/:userId', asyncHandler(async (req: Request, res: Response) => {
  const requestingUserId = (req as any).user?.userId;
  const { userId } = req.params;

  if (requestingUserId === userId) {
    throw new ValidationError('Cannot delete your own account');
  }

  await userService.deleteUser(userId);
  res.status(200).json({ message: 'User deleted successfully' });
}));

/**
 * POST /api/dev/users/:userId/reset-password
 * Force reset user password without requiring current password
 */
router.post('/:userId/reset-password', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { newPassword } = resetPasswordSchema.parse(req.body);

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await pool.query(
    `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
    [passwordHash, userId]
  );

  res.status(200).json({ message: 'Password reset successfully' });
}));

export default router;
