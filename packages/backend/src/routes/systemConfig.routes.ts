import type { Request, Response } from 'express';
import { Router } from 'express';
import { z } from 'zod';
import { SystemConfigService } from '../services/SystemConfigService.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireDeveloper } from '../middleware/permission.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ValidationError } from '../utils/errors.js';
import { auditSystemConfigUpdate } from '../middleware/audit.middleware.js';

const router = Router();
const systemConfigService = new SystemConfigService();

// Validation schema for system config updates
const updateSystemConfigSchema = z.object({
  siteName: z.string().min(1).max(255).optional(),
  siteDescription: z.string().max(1000).optional(),
  logoUrl: z.string().max(500).optional(),
  allowRegistration: z.boolean().optional(),
  maintenanceMode: z.boolean().optional(),
  debugMode: z.boolean().optional(),
  maxFileSize: z.number().min(1).max(100).optional(),
  defaultUserRole: z.enum(['user', 'position_admin', 'super_admin']).optional(),
  emailEnabled: z.boolean().optional(),
  smtpHost: z.string().max(255).optional(),
  smtpPort: z.number().min(1).max(65535).optional(),
  smtpUser: z.string().max(255).optional(),
  smtpPassword: z.string().max(255).optional(),
  smtpSecure: z.boolean().optional(),
  // UI Theme fields
  defaultTheme: z.enum(['light', 'dark']).optional(),
  allowThemeSwitch: z.boolean().optional(),
  animationStyle: z.enum(['none', 'minimal', 'scanline', 'particles', 'hexagon', 'datastream', 'hologram', 'ripple', 'matrix']).optional(),
  enableAnimations: z.boolean().optional(),
  reducedMotion: z.boolean().optional(),
});

// Apply authentication and developer permission to all routes
router.use(authenticate);
router.use(requireDeveloper);

/**
 * GET /api/admin/system/config
 * Get current system configuration
 */
router.get('/config', asyncHandler(async (req: Request, res: Response) => {
  const config = await systemConfigService.getConfig();
  
  res.status(200).json({
    success: true,
    data: config,
  });
}));

/**
 * PUT /api/admin/system/config
 * Update system configuration
 */
router.put('/config', auditSystemConfigUpdate, asyncHandler(async (req: Request, res: Response) => {
  try {
    const validatedData = updateSystemConfigSchema.parse(req.body);
    const updatedConfig = await systemConfigService.updateConfig(validatedData);
    
    res.status(200).json({
      success: true,
      message: 'System configuration updated successfully',
      data: updatedConfig,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid system configuration data', error.errors);
    }
    throw error;
  }
}));

/**
 * GET /api/admin/system/maintenance
 * Check if system is in maintenance mode
 */
router.get('/maintenance', asyncHandler(async (req: Request, res: Response) => {
  const isMaintenanceMode = await systemConfigService.isMaintenanceMode();
  
  res.status(200).json({
    success: true,
    data: {
      maintenanceMode: isMaintenanceMode,
    },
  });
}));

/**
 * GET /api/admin/system/registration
 * Check if user registration is allowed
 */
router.get('/registration', asyncHandler(async (req: Request, res: Response) => {
  const isRegistrationAllowed = await systemConfigService.isRegistrationAllowed();
  
  res.status(200).json({
    success: true,
    data: {
      allowRegistration: isRegistrationAllowed,
    },
  });
}));

/**
 * GET /api/admin/system/file-size
 * Get maximum file upload size
 */
router.get('/file-size', asyncHandler(async (req: Request, res: Response) => {
  const maxFileSize = await systemConfigService.getMaxFileSize();
  
  res.status(200).json({
    success: true,
    data: {
      maxFileSize,
    },
  });
}));

export default router;