import type { Request, Response } from 'express';
import { Router } from 'express';
import { SystemConfigService } from '../services/SystemConfigService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
const systemConfigService = new SystemConfigService();

/**
 * GET /api/public/config
 * Get public system configuration (no authentication required)
 */
router.get('/config', asyncHandler(async (req: Request, res: Response) => {
  const config = await systemConfigService.getPublicConfig();
  
  res.status(200).json({
    success: true,
    data: config,
  });
}));

export default router;