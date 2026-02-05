import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { UserRole } from '../models/User.js';

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export class JWTService {
  /**
   * Generate JWT token
   */
  static generateToken(payload: JWTPayload): string {
    // @ts-ignore - jsonwebtoken types have issues with expiresIn
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });
  }

  /**
   * Verify and decode JWT token
   */
  static verifyToken(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;
      return decoded;
    } catch (error) {
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
