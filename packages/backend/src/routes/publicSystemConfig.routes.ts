import type { Request, Response } from 'express';
import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

/**
 * GET /api/system-config/public
 * Get public system configuration (no authentication required)
 */
router.get('/public', asyncHandler(async (req: Request, res: Response) => {
  // 返回公共配置信息
  const publicConfig = {
    siteName: '赏金猎人平台',
    siteDescription: '专业的任务管理和赏金系统',
    logoUrl: '/logo.png',
    isMaintenanceMode: false,
    isRegistrationAllowed: true,
    debugMode: process.env.NODE_ENV === 'development',
    defaultTheme: 'light',
    allowThemeSwitch: true,
    enableAnimations: true,
  };
  
  res.status(200).json(publicConfig);
}));

export default router;