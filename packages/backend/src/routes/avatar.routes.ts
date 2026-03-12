import type { Request, Response } from 'express';
import { Router } from 'express';
import type { Pool } from 'pg';
import { AvatarService } from '../services/AvatarService.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/errors.js';

export function createAvatarRouter(pool: Pool): Router {
  const router = Router();
  const avatarService = new AvatarService(pool);

  /**
   * GET /api/avatars
   * Get all avatars
   */
  router.get('/', authenticate, asyncHandler(async (req: Request, res: Response) => {
    const avatars = await avatarService.getAllAvatars();
    res.json(avatars);
  }));

  /**
   * GET /api/avatars/available/me
   * Get available avatars for current user
   */
  router.get('/available/me', authenticate, asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const avatars = await avatarService.getAvailableAvatarsForUser(user.userId);
    res.json(avatars);
  }));

  /**
   * GET /api/avatars/available/:userId
   * Get available avatars for a specific user
   */
  router.get('/available/:userId', authenticate, asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const avatars = await avatarService.getAvailableAvatarsForUser(userId);
    res.json(avatars);
  }));

  /**
   * GET /api/avatars/user/me
   * Get current user's avatar
   */
  router.get('/user/me', authenticate, asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const avatar = await avatarService.getUserAvatar(user.userId);

    // 返回 null 而不是 404，避免控制台错误
    res.json(avatar || null);
  }));

  /**
   * GET /api/avatars/:id
   * Get avatar by ID
   */
  router.get('/:id', authenticate, asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const avatar = await avatarService.getAvatarById(id);

    if (!avatar) {
      res.status(404).json({ error: 'Avatar not found' });
      return;
    }

    res.json(avatar);
  }));

  /**
   * POST /api/avatars
   * Create a new avatar (admin only)
   */
  router.post('/', authenticate, asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    
    // Only super admins can create avatars
    if (user.role !== 'super_admin') {
      throw new AppError('FORBIDDEN', 'Only super admins can create avatars', 403);
    }

    const { name, imageUrl, requiredRank } = req.body;

    if (!name || !imageUrl || requiredRank === undefined) {
      throw new AppError('VALIDATION_ERROR', 'Name, imageUrl, and requiredRank are required', 400);
    }

    const avatar = await avatarService.createAvatar({
      name,
      imageUrl,
      requiredRank,
    });

    res.status(201).json(avatar);
  }));

  /**
   * PUT /api/avatars/:id
   * Update an avatar (admin only)
   */
  router.put('/:id', authenticate, asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    
    // Only super admins can update avatars
    if (user.role !== 'super_admin') {
      throw new AppError('FORBIDDEN', 'Only super admins can update avatars', 403);
    }

    const { id } = req.params;
    const { name, imageUrl, requiredRank } = req.body;

    const avatar = await avatarService.updateAvatar(id, {
      name,
      imageUrl,
      requiredRank,
    });

    res.json(avatar);
  }));

  /**
   * DELETE /api/avatars/:id
   * Delete an avatar (admin only)
   */
  router.delete('/:id', authenticate, asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    
    // Only super admins can delete avatars
    if (user.role !== 'super_admin') {
      throw new AppError('FORBIDDEN', 'Only super admins can delete avatars', 403);
    }

    const { id } = req.params;
    await avatarService.deleteAvatar(id);

    res.json({ message: 'Avatar deleted successfully' });
  }));

  /**
   * POST /api/avatars/select/:avatarId
   * Select an avatar for current user
   */
  router.post('/select/:avatarId', authenticate, asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const { avatarId } = req.params;

    await avatarService.selectAvatarForUser(user.userId, avatarId);

    res.json({ message: 'Avatar selected successfully' });
  }));

  /**
   * POST /api/avatars/update-unlock-permissions
   * Update avatar unlock permissions based on last month's rankings (admin only)
   */
  router.post('/update-unlock-permissions', authenticate, asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    
    // Only super admins can trigger permission updates
    if (user.role !== 'super_admin') {
      throw new AppError('FORBIDDEN', 'Only super admins can update unlock permissions', 403);
    }

    await avatarService.updateAvatarUnlockPermissions();

    res.json({ message: 'Avatar unlock permissions updated successfully' });
  }));

  return router;
}
