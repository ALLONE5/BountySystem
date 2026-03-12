import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { UserRole } from '../models/User.js';
import { logger } from '../config/logger.js';

export interface JWTPayload {
  userId: string;
  username: string;
  email: string;
  role: UserRole;
}

export class JWTService {
  /**
   * Generate JWT token
   */
  static generateToken(payload: JWTPayload): string {
    logger.debug('[JWT] Generating token', { 
      userId: payload.userId,
      username: payload.username,
      expiresIn: config.jwt.expiresIn,
      secretLength: config.jwt.secret.length
    });

    // @ts-ignore - jsonwebtoken types have issues with expiresIn
    const token: string = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });

    logger.info('[JWT] Token generated successfully', { 
      userId: payload.userId,
      tokenLength: token.length 
    });

    return token;
  }

  /**
   * Verify and decode JWT token
   */
  static verifyToken(token: string): JWTPayload {
    try {
      logger.debug('[JWT] Verifying token', { 
        tokenLength: token.length,
        secretLength: config.jwt.secret.length
      });

      const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;
      
      logger.info('[JWT] Token verified successfully', { 
        userId: decoded.userId,
        username: decoded.username,
        role: decoded.role
      });

      return decoded;
    } catch (error) {
      logger.error('[JWT] Token verification failed', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        errorName: error instanceof Error ? error.name : 'Unknown'
      });
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Decode token without verification (for debugging)
   */
  static decodeToken(token: string): JWTPayload | null {
    try {
      return jwt.decode(token) as JWTPayload;
    } catch (error) {
      return null;
    }
  }
}
