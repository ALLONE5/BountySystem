import type { Request, Response, NextFunction } from 'express';
import type { JWTPayload } from '../utils/jwt.js';
import { JWTService } from '../utils/jwt.js';
import { AuthenticationError } from '../utils/errors.js';
import { logger } from '../config/logger.js';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

/**
 * Authentication middleware
 * Verifies JWT token and attaches user info to request
 */
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.debug('[AUTH] Authenticating request', { 
      url: req.url, 
      method: req.method,
      hasAuthHeader: !!req.headers.authorization 
    });

    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('[AUTH] No token provided', { url: req.url });
      throw new AuthenticationError('No token provided');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    logger.debug('[AUTH] Token extracted', { 
      tokenLength: token.length,
      tokenPrefix: token.substring(0, 20) + '...'
    });

    // Verify token
    const payload = JWTService.verifyToken(token);
    logger.info('[AUTH] Token verified successfully', { 
      userId: payload.userId,
      username: payload.username,
      role: payload.role
    });

    // Attach user info to request
    req.user = payload;

    next();
  } catch (error) {
    logger.error('[AUTH] Authentication failed', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      url: req.url
    });
    
    if (error instanceof Error && error.message === 'Invalid or expired token') {
      next(new AuthenticationError('Invalid or expired token'));
    } else {
      next(error);
    }
  }
};

/**
 * Optional authentication middleware
 * Attaches user info if token is present, but doesn't require it
 */
export const optionalAuthenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = JWTService.verifyToken(token);
      req.user = payload;
    }

    next();
  } catch (error) {
    // Ignore authentication errors for optional auth
    next();
  }
};
