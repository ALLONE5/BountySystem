import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { UserService } from '../services/UserService.js';
import { JWTService } from '../utils/jwt.js';
import { ValidationError, AuthenticationError, ConflictError } from '../utils/errors.js';
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
      email: user.email,
      role: user.role,
    });

    // Prepare response
    const response: AuthResponse = {
      user: userService.toUserResponse(user),
      token,
    };

    res.status(201).json(response);
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

    // Find user by username or email
    let user = await userService.findByUsername(validatedData.username);
    if (!user) {
      // Try finding by email if username lookup fails
      user = await userService.findByEmail(validatedData.username);
    }
    
    if (!user) {
      throw new AuthenticationError('Invalid username or password');
    }

    // Verify password
    const isPasswordValid = await userService.verifyPassword(
      validatedData.password,
      user.passwordHash
    );

    if (!isPasswordValid) {
      throw new AuthenticationError('Invalid username or password');
    }

    // Update last login
    await userService.updateLastLogin(user.id);

    // Generate JWT token
    const token = JWTService.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Prepare response
    const response: AuthResponse = {
      user: userService.toUserResponse(user),
      token,
    };

    res.status(200).json(response);
  })
);

/**
 * GET /api/auth/me
 * Get current user information (requires authentication)
 */
router.get('/me', asyncHandler(async (req: Request, res: Response) => {
  // Get user from request (set by auth middleware)
  const userId = (req as any).user?.userId;

  if (!userId) {
    throw new AuthenticationError('Not authenticated');
  }

  const user = await userService.findById(userId);
  if (!user) {
    throw new AuthenticationError('User not found');
  }

  res.status(200).json(userService.toUserResponse(user));
}));

export default router;
