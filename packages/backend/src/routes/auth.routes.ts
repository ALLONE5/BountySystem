import type { Request, Response, NextFunction } from 'express';
import { Router } from 'express';
import { z } from 'zod';
import { UserService } from '../services/UserService.js';
import { SystemConfigService } from '../services/SystemConfigService.js';
import { JWTService } from '../utils/jwt.js';
import { ValidationError, AuthenticationError, ConflictError } from '../utils/errors.js';
import { auditLogin } from '../middleware/audit.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { AuthResponse } from '../models/User.js';
import {
  loginRateLimiter,
  registrationRateLimiter,
} from '../middleware/rateLimit.middleware.js';
import {
  validate,
  emailSchema,
  passwordSchema,
  usernameSchema,
} from '../middleware/validation.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { resolve } from '../config/container.js';
import { sendSuccess, sendCreated } from '../utils/responseHelpers.js';

const router = Router();
// Use DI container to get properly configured UserService
const userService = resolve<UserService>('userService');

// Validation schemas with enhanced security
const registerSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
});

const loginSchema = z.object({
  username: z.string().min(1, 'Username or email is required'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post(
  '/register',
  registrationRateLimiter,
  validate({ body: registerSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    // Data is already validated by middleware
    const validatedData = req.body;

    // Check if registration is allowed
    const systemConfigService = new SystemConfigService();
    const isMaintenanceMode = await systemConfigService.isMaintenanceMode();
    const isRegistrationAllowed = await systemConfigService.isRegistrationAllowed();

    if (isMaintenanceMode) {
      throw new ValidationError('系统正在维护中，暂时无法注册');
    }

    if (!isRegistrationAllowed) {
      throw new ValidationError('系统暂时不允许新用户注册');
    }

    // Check if user already exists
    const existingUserByEmail = await userService.findByEmail(validatedData.email);
    if (existingUserByEmail) {
      throw new ConflictError('Email already registered');
    }

    const existingUserByUsername = await userService.findByUsername(validatedData.username);
    if (existingUserByUsername) {
      throw new ConflictError('Username already taken');
    }

    // Create user
    const user = await userService.createUser(validatedData);

    // Generate JWT token
    const token = JWTService.generateToken({
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    });

    // Prepare response
    const response: AuthResponse = {
      user: userService.toUserResponse(user),
      token,
    };

    sendCreated(res, response);
  })
);

/**
 * POST /api/auth/login
 * Login user
 */
router.post(
  '/login',
  loginRateLimiter,
  validate({ body: loginSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    // Data is already validated by middleware
    const validatedData = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress || '';
    const userAgent = req.get('User-Agent') || '';

    try {
      // Find user by username or email
      let user = await userService.findByUsername(validatedData.username);
      if (!user) {
        // Try finding by email if username lookup fails
        user = await userService.findByEmail(validatedData.username);
      }
      
      if (!user) {
        // Audit failed login attempt
        await auditLogin(validatedData.username, false, ipAddress, userAgent, undefined, {
          reason: 'User not found'
        });
        throw new AuthenticationError('Invalid username or password');
      }

      // Verify password
      const isPasswordValid = await userService.verifyPassword(
        validatedData.password,
        user.passwordHash
      );

      if (!isPasswordValid) {
        // Audit failed login attempt
        await auditLogin(validatedData.username, false, ipAddress, userAgent, user.id, {
          reason: 'Invalid password'
        });
        throw new AuthenticationError('Invalid username or password');
      }

      // Update last login
      await userService.updateLastLogin(user.id);

      // Generate JWT token
      const token = JWTService.generateToken({
        userId: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      });

      // Log token generation for debugging
      console.log('[LOGIN] Token generated for user:', {
        userId: user.id,
        username: user.username,
        tokenLength: token.length,
        tokenPreview: token.substring(0, 30) + '...'
      });

      // Audit successful login
      await auditLogin(user.username, true, ipAddress, userAgent, user.id, {
        email: user.email,
        role: user.role
      });

      // Prepare response
      const response: AuthResponse = {
        user: userService.toUserResponse(user),
        token,
      };

      console.log('[LOGIN] Sending response with token');
      sendSuccess(res, response);
    } catch (error) {
      // If it's not an authentication error, audit as failed login
      if (!(error instanceof AuthenticationError)) {
        await auditLogin(validatedData.username, false, ipAddress, userAgent, undefined, {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
      throw error;
    }
  })
);

/**
 * GET /api/auth/me
 * Get current user information (requires authentication)
 */
router.get('/me', authenticate, asyncHandler(async (req: Request, res: Response) => {
  console.log('[AUTH/ME] Request received', {
    hasUser: !!req.user,
    userId: req.user?.userId,
    username: req.user?.username
  });

  // Get user from request (set by auth middleware)
  const userId = req.user?.userId;

  if (!userId) {
    console.log('[AUTH/ME] No userId in request');
    throw new AuthenticationError('Not authenticated');
  }

  const user = await userService.findById(userId);
  if (!user) {
    console.log('[AUTH/ME] User not found:', userId);
    throw new AuthenticationError('User not found');
  }

  console.log('[AUTH/ME] User found, sending response');
  sendSuccess(res, userService.toUserResponse(user));
}));

/**
 * POST /api/auth/verify-token
 * Verify if a token is valid (for debugging)
 */
router.post('/verify-token', asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.body;
  
  if (!token) {
    throw new ValidationError('Token is required');
  }

  try {
    const payload = JWTService.verifyToken(token);
    console.log('[VERIFY-TOKEN] Token is valid', {
      userId: payload.userId,
      username: payload.username,
      role: payload.role
    });
    
    sendSuccess(res, {
      valid: true,
      payload
    });
  } catch (error) {
    console.log('[VERIFY-TOKEN] Token is invalid', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    sendSuccess(res, {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

export default router;
