import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { config } from './config/env.js';
import { logger } from './config/logger.js';
import { testConnection } from './config/database.js';
import { connectRedis, testRedisConnection } from './config/redis.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import positionRoutes from './routes/position.routes.js';
import dependencyRoutes from './routes/dependency.routes.js';
import taskRoutes from './routes/task.routes.js';
import bountyRoutes from './routes/bounty.routes.js';
import groupRoutes from './routes/group.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import adminRoutes from './routes/admin.routes.js';
import systemConfigRoutes from './routes/systemConfig.routes.js';
import publicSystemConfigRoutes from './routes/publicSystemConfig.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import { adminRouter as auditLogAdminRoutes, devRouter as auditLogDevRoutes } from './routes/auditLog.routes.js';
import devUserRoutes from './routes/devUser.routes.js';
import schedulerRoutes from './routes/scheduler.routes.js';
import metricsRoutes from './routes/metrics.routes.js';
import systemMonitorRoutes from './routes/systemMonitor.routes.js';
import publicRoutes from './routes/public.routes.js';
import { createRankingRouter } from './routes/ranking.routes.js';
import { createAvatarRouter } from './routes/avatar.routes.js';
import { createProjectGroupRouter } from './routes/projectGroup.routes.js';
import { createBountyHistoryRouter } from './routes/bountyHistory.routes.js';
import { pool } from './config/database.js';
import { AppError } from './utils/errors.js';
import { WebSocketService } from './services/WebSocketService.js';
import { ipRateLimiter } from './middleware/rateLimit.middleware.js';
import { trackPerformance } from './middleware/performance.middleware.js';
import { systemMetricsCollector } from './utils/SystemMetricsCollector.js';
import { CacheService } from './services/CacheService.js';
import { CacheWarmupService } from './services/CacheWarmup.js';
import { CacheInvalidationService } from './services/CacheInvalidation.js';
import { CacheMonitorService } from './services/CacheMonitor.js';
import { RealTimeMetricsService } from './services/RealTimeMetrics.js';
import { PerformanceAlertService } from './services/PerformanceAlert.js';
import { PerformanceReportService } from './services/PerformanceReport.js';
import { SystemConfigService } from './services/SystemConfigService.js';
import { PositionService } from './services/PositionService.js';
import { UserService } from './services/UserService.js';
import { TaskService } from './services/TaskService.js';
import performanceRoutes from './routes/performance.routes.js';

const app = express();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Security headers middleware
app.use((req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Strict transport security (HTTPS only)
  if (config.server.nodeEnv === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  // Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
  );
  
  next();
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Limit payload size
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Performance monitoring middleware
app.use(trackPerformance);

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Apply IP-based rate limiting to all routes (only if Redis is available)
// Temporarily disabled due to Redis connection issues
// app.use(ipRateLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.server.nodeEnv,
  });
});

// API routes
app.get('/api', (req, res) => {
  res.json({
    message: 'Bounty Hunter Platform API',
    version: '1.0.0',
  });
});

// Authentication routes
app.use('/api/auth', authRoutes);

// Public routes (no authentication required)
app.use('/api/public', publicRoutes);

// User routes
app.use('/api/users', userRoutes);

// Position routes
app.use('/api/positions', positionRoutes);

// Dependency routes
app.use('/api/dependencies', dependencyRoutes);

// Task routes
app.use('/api/tasks', taskRoutes);

// Bounty routes
app.use('/api/bounty', bountyRoutes);

// Group routes
app.use('/api/groups', groupRoutes);

// Notification routes
app.use('/api/notifications', notificationRoutes);

// Admin routes
app.use('/api/admin', adminRoutes);

// System configuration routes
app.use('/api/admin/system', systemConfigRoutes);

// Public system configuration routes (no auth required)
app.use('/api/system-config', publicSystemConfigRoutes);

// Audit log routes (Admin and Developer)
app.use('/api/admin/audit', auditLogAdminRoutes);
app.use('/api/dev/audit', auditLogDevRoutes);

// Developer user management routes
app.use('/api/dev/users', devUserRoutes);

// Upload routes
app.use('/api/upload', uploadRoutes);

// Scheduler routes
app.use('/api/scheduler', schedulerRoutes);

// Metrics routes
app.use('/api/metrics', metricsRoutes);

// System monitor routes
app.use('/api/system-monitor', systemMonitorRoutes);

// Ranking routes
app.use('/api/rankings', createRankingRouter(pool));

// Avatar routes
app.use('/api/avatars', createAvatarRouter(pool));

// Project Group routes
app.use('/api/project-groups', createProjectGroupRouter(pool));

// Bounty History routes
app.use('/api/bounty-history', createBountyHistoryRouter(pool));

// Performance monitoring routes (requires developer permission)
app.use('/api/performance', performanceRoutes);

// 404 handler
app.use((req, res) => {
  logger.warn('Route not found', { method: req.method, url: req.url });
  res.status(404).json({
    code: 'NOT_FOUND',
    message: 'Route not found',
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Error:', err);

  // Handle AppError instances
  if (err instanceof AppError) {
    return res.status(err.status).json({
      code: err.code,
      message: err.message,
      details: err.details,
      timestamp: new Date().toISOString(),
    });
  }

  // Handle other errors
  res.status(err.status || 500).json({
    code: err.code || 'INTERNAL_ERROR',
    message: err.message || 'Internal server error',
    timestamp: new Date().toISOString(),
  });
});

// Create HTTP server
const httpServer = createServer(app);

// Initialize WebSocket service
let wsService: WebSocketService;

// Initialize cache and monitoring services
let cacheService: CacheService;
let cacheMonitor: CacheMonitorService;
let warmupService: CacheWarmupService;
let invalidationService: CacheInvalidationService;
let metricsService: RealTimeMetricsService;
let alertService: PerformanceAlertService;
let reportService: PerformanceReportService;

// Start server
const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      throw new Error('Failed to connect to database');
    }

    // Connect to Redis
    const redisConnected = await connectRedis();
    if (!redisConnected) {
      logger.warn('⚠️  Redis connection failed - running without Redis (缓存和速率限制功能将受限)');
      // 在开发环境中允许继续运行
      if (config.server.nodeEnv === 'production') {
        throw new Error('Failed to connect to Redis');
      }
    } else {
      // Test Redis connection
      await testRedisConnection();
    }

    // Initialize WebSocket service
    wsService = new WebSocketService(httpServer);
    logger.info('WebSocket service initialized');

    // Initialize cache and monitoring services
    await initializeCacheAndMonitoring();

    // Start listening
    httpServer.listen(config.server.port, () => {
      logger.info(`Server running on port ${config.server.port}`);
      logger.info(`Environment: ${config.server.nodeEnv}`);
      logger.info('WebSocket server ready');
      
      // Start system metrics collection
      metricsInterval = systemMetricsCollector.startMetricsCollection(30000); // Collect every 30 seconds
      logger.info('System metrics collection started');
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Initialize cache and monitoring services
async function initializeCacheAndMonitoring(): Promise<void> {
  try {
    logger.info('Initializing cache and monitoring services...');

    // Initialize cache service
    cacheService = new CacheService();
    cacheMonitor = CacheMonitorService.getInstance(cacheService);

    // Initialize system metrics collector
    const systemMetrics = systemMetricsCollector;

    // Initialize real-time metrics service
    metricsService = RealTimeMetricsService.getInstance(cacheMonitor, systemMetrics);

    // Initialize alert service
    alertService = PerformanceAlertService.getInstance();

    // Initialize report service
    reportService = PerformanceReportService.getInstance(
      metricsService,
      cacheMonitor,
      alertService
    );

    // Store services in app.locals for middleware and routes
    app.locals.cacheService = cacheService;
    app.locals.metricsService = metricsService;
    app.locals.alertService = alertService;
    app.locals.reportService = reportService;

    // Initialize cache warmup service (requires other services)
    const systemConfigService = new SystemConfigService();
    const positionService = new PositionService();
    const userService = new UserService(
      new (await import('./repositories/UserRepository.js')).UserRepository(),
      new (await import('./utils/PermissionChecker.js')).PermissionChecker(
        new (await import('./repositories/UserRepository.js')).UserRepository(),
        new (await import('./repositories/TaskRepository.js')).TaskRepository(),
        new (await import('./repositories/GroupRepository.js')).GroupRepository(),
        new (await import('./repositories/PositionRepository.js')).PositionRepository()
      )
    );
    const taskService = new TaskService();

    warmupService = CacheWarmupService.getInstance(
      cacheService,
      systemConfigService,
      positionService,
      userService,
      taskService
    );

    // Initialize cache invalidation service
    invalidationService = CacheInvalidationService.getInstance(cacheService);

    // Start real-time monitoring
    metricsService.start();

    // Set up alert listeners
    alertService.on('alert', (alert) => {
      logger.warn('Performance alert:', alert);
      // TODO: Send email/SMS/Slack notifications
    });

    alertService.on('alert-resolved', (alert) => {
      logger.info('Alert resolved:', alert);
    });

    // Start scheduled reports
    reportService.scheduleReports();

    // Perform initial cache warmup
    await warmupService.warmupAll();

    // Start periodic cache warmup (every 30 minutes)
    warmupService.startPeriodicWarmup(30);

    logger.info('✅ Cache and monitoring services initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize cache and monitoring services:', error);
    // Don't fail the entire application, just log the error
  }
}

// Graceful shutdown handling
let metricsInterval: NodeJS.Timeout | null = null;

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  if (metricsInterval) {
    systemMetricsCollector.stopMetricsCollection(metricsInterval);
  }
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  if (metricsInterval) {
    systemMetricsCollector.stopMetricsCollection(metricsInterval);
  }
  process.exit(0);
});

export { app, wsService };
