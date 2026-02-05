import { Router, Request, Response } from 'express';
import { PositionService } from '../services/PositionService.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/permission.middleware.js';
import { UserRole } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { resolve } from '../config/container.js';

const router = Router();
// Use DI container to get properly configured PositionService
const positionService = resolve<PositionService>('positionService');

/**
 * Get all positions
 * Public endpoint
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const positions = await positionService.getAllPositions();
  res.json(positions);
}));

/**
 * Get position by ID
 */
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const position = await positionService.getPositionById(req.params.id);
  
  if (!position) {
    return res.status(404).json({ error: 'Position not found' });
  }
  
  res.json(position);
}));

/**
 * Create a new position
 * Requires admin role
 */
router.post(
  '/',
  authenticate,
  requireRole([UserRole.SUPER_ADMIN]),
  asyncHandler(async (req: Request, res: Response) => {
    const { name, description, requiredSkills } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Position name is required' });
    }

    const position = await positionService.createPosition({
      name,
      description,
      requiredSkills,
    });

    res.status(201).json(position);
  })
);

/**
 * Update a position
 * Requires admin role
 */
router.put(
  '/:id',
  authenticate,
  requireRole([UserRole.SUPER_ADMIN]),
  asyncHandler(async (req: Request, res: Response) => {
    const { name, description, requiredSkills } = req.body;

    const position = await positionService.updatePosition(req.params.id, {
      name,
      description,
      requiredSkills,
    });

    res.json(position);
  })
);

/**
 * Delete a position
 * Requires admin role
 */
router.delete(
  '/:id',
  authenticate,
  requireRole([UserRole.SUPER_ADMIN]),
  asyncHandler(async (req: Request, res: Response) => {
    await positionService.deletePosition(req.params.id);
    res.status(204).send();
  })
);

/**
 * Apply for a position
 * Requires authentication
 */
router.post('/applications', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { positionId, reason } = req.body;
  const userId = req.user!.userId;

  if (!positionId) {
    return res.status(400).json({ error: 'Position ID is required' });
  }

  const application = await positionService.applyForPosition({
    userId,
    positionId,
    reason,
  });

  res.status(201).json(application);
}));

/**
 * Request position replacement (remove old, add new)
 * Requires authentication
 */
router.post('/applications/replacement', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { positionsToRemove, positionsToAdd } = req.body;
  const userId = req.user!.userId;

  if (!Array.isArray(positionsToRemove) || !Array.isArray(positionsToAdd)) {
    return res.status(400).json({ 
      error: 'positionsToRemove and positionsToAdd must be arrays' 
    });
  }

  // Allow removal-only operations (no new positions to add)
  if (positionsToRemove.length === 0 && positionsToAdd.length === 0) {
    return res.status(400).json({ 
      error: 'At least one position change is required' 
    });
  }

  const applications = await positionService.requestPositionReplacement(
    userId,
    positionsToRemove,
    positionsToAdd
  );

  res.status(201).json(applications);
}));

/**
 * Get user's position applications
 * Requires authentication
 */
router.get('/applications/my', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const applications = await positionService.getUserApplications(userId);
  res.json(applications);
}));

/**
 * Get pending applications for a position
 * Requires position admin or super admin role
 */
router.get(
  '/:id/applications/pending',
  authenticate,
  requireRole([UserRole.POSITION_ADMIN, UserRole.SUPER_ADMIN]),
  asyncHandler(async (req: Request, res: Response) => {
    const positionId = req.params.id;
    const applications = await positionService.getPendingApplicationsForPosition(positionId);
    res.json(applications);
  })
);

/**
 * Review a position application (approve or reject)
 * Requires position admin or super admin role
 */
router.post(
  '/applications/:id/review',
  authenticate,
  requireRole([UserRole.POSITION_ADMIN, UserRole.SUPER_ADMIN]),
  asyncHandler(async (req: Request, res: Response) => {
    const applicationId = req.params.id;
    const { approved, reviewComment } = req.body;
    const reviewerId = req.user!.userId;

    if (typeof approved !== 'boolean') {
      return res.status(400).json({ error: 'Approved field is required and must be a boolean' });
    }

    const application = await positionService.reviewApplication({
      applicationId,
      reviewerId,
      approved,
      reviewComment,
    });

    res.json(application);
  })
);

/**
 * Get user's positions
 * Requires authentication
 */
router.get('/users/:userId/positions', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.params.userId;
  
  // Users can only view their own positions unless they're admin
  if (req.user!.userId !== userId && req.user!.role === UserRole.USER) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const positions = await positionService.getUserPositions(userId);
  res.json(positions);
}));

/**
 * Grant position to user directly
 * Requires admin role
 */
router.post(
  '/users/:userId/positions/:positionId',
  authenticate,
  requireRole([UserRole.SUPER_ADMIN]),
  asyncHandler(async (req: Request, res: Response) => {
    const { userId, positionId } = req.params;

    const userPosition = await positionService.grantPosition(userId, positionId);
    res.status(201).json(userPosition);
  })
);

/**
 * Revoke position from user
 * Requires admin role
 */
router.delete(
  '/users/:userId/positions/:positionId',
  authenticate,
  requireRole([UserRole.SUPER_ADMIN]),
  asyncHandler(async (req: Request, res: Response) => {
    const { userId, positionId } = req.params;

    await positionService.revokePosition(userId, positionId);
    res.status(204).send();
  })
);

export default router;
