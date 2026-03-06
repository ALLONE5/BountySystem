import type { Request, Response } from 'express';
import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { UserRole } from '../models/User.js';
import { SystemMonitorService } from '../services/SystemMonitorService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
const systemMonitorService = new SystemMonitorService();

/**
 * Middleware to verify admin access
 */
const requireAdmin = asyncHandler(async (req: Request, res: Response, next) => {
  const userRole = (req as any).user?.role;

  if (!userRole) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  // Check if user has admin role
  if (userRole !== UserRole.POSITION_ADMIN && userRole !== UserRole.SUPER_ADMIN && userRole !== UserRole.DEVELOPER) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
});

// Apply authentication and admin middleware to all routes
router.use(authenticate);
router.use(requireAdmin);

/**
 * Get system statistics for admin dashboard
 * GET /api/system-monitor/stats
 */
router.get('/stats', asyncHandler(async (req: Request, res: Response) => {
  const stats = await systemMonitorService.getSystemStats();
  res.json(stats);
}));

/**
 * Get online users list
 * GET /api/system-monitor/online-users
 */
router.get('/online-users', asyncHandler(async (req: Request, res: Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
  const onlineUsers = await systemMonitorService.getOnlineUsers(limit);
  res.json({ users: onlineUsers, count: onlineUsers.length });
}));

/**
 * Get system performance metrics
 * GET /api/system-monitor/performance
 */
router.get('/performance', asyncHandler(async (req: Request, res: Response) => {
  const performance = await systemMonitorService.getSystemPerformance();
  res.json(performance);
}));

/**
 * Get recent activity logs
 * GET /api/system-monitor/activity
 */
router.get('/activity', asyncHandler(async (req: Request, res: Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
  const activities = await systemMonitorService.getActivityLogs(limit);
  res.json({ activities, count: activities.length });
}));

/**
 * Get database connection count
 * GET /api/system-monitor/database
 */
router.get('/database', asyncHandler(async (req: Request, res: Response) => {
  const connections = await systemMonitorService.getDatabaseConnections();
  const responseTime = await systemMonitorService.getApiResponseTime();
  
  res.json({
    connections,
    responseTime,
    status: 'healthy'
  });
}));

/**
 * Get comprehensive dashboard data
 * GET /api/system-monitor/dashboard
 */
router.get('/dashboard', asyncHandler(async (req: Request, res: Response) => {
  const [stats, onlineUsers, performance, activities] = await Promise.all([
    systemMonitorService.getSystemStats(),
    systemMonitorService.getOnlineUsers(5),
    systemMonitorService.getSystemPerformance(),
    systemMonitorService.getActivityLogs(5)
  ]);

  res.json({
    stats,
    onlineUsers,
    performance,
    activities
  });
}));

export default router;