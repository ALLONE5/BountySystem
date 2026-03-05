import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { config } from './config/env.js';
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
import auditLogRoutes from './routes/auditLog.routes.js';
import devAuditLogRoutes from './routes/devAuditLog.routes.js';
import schedulerRoutes from './routes/scheduler.routes.js';
import metricsRoutes from './routes/metrics.routes.js';
import publicRoutes from './routes/public.routes.js';
import { createRankingRouter } from './routes/ranking.routes.js';
import { createAvatarRouter } from './routes/avatar.routes.js';
import { createProjectGroupRouter } from './routes/projectGroup.routes.js';
import { createBountyHistoryRouter } from './routes/bountyHistory.routes.js';
import { pool } from './config/database.js';
import { AppError } from './utils/errors.js';
import { WebSocketService } from './services/WebSocketService.js';
import { ipRateLimiter } from './middleware/rateLimit.middleware.js';

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

// Audit log routes
app.use('/api/admin/audit', auditLogRoutes);

// Developer audit log routes
app.use('/api/dev/audit', devAuditLogRoutes);

// Upload routes
app.use('/api/upload', uploadRoutes);

// Scheduler routes
app.use('/api/scheduler', schedulerRoutes);

// Metrics routes
app.use('/api/metrics', metricsRoutes);

// Ranking routes
app.use('/api/rankings', createRankingRouter(pool));

// Avatar routes
app.use('/api/avatars', createAvatarRouter(pool));

// Project Group routes
app.use('/api/project-groups', createProjectGroupRouter(pool));

// Bounty History routes
app.use('/api/bounty-history', createBountyHistoryRouter(pool));

// 404 handler
app.use((req, res) => {
  console.log(`404 Not Found: ${req.method} ${req.url}`);
  res.status(404).json({
    code: 'NOT_FOUND',
    message: 'Route not found',
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);

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
      console.warn('⚠️  Redis connection failed - running without Redis (缓存和速率限制功能将受限)');
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
    console.log('WebSocket service initialized');

    // Start listening
    httpServer.listen(config.server.port, () => {
      console.log(`Server running on port ${config.server.port}`);
      console.log(`Environment: ${config.server.nodeEnv}`);
      console.log('WebSocket server ready');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export { app, wsService };
