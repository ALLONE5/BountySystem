import { describe, it, expect } from 'vitest';
import { JWTService } from './jwt.js';
import { UserRole } from '../models/User.js';

describe('JWTService', () => {
  const testPayload = {
    userId: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    role: UserRole.USER,
  };

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const token = JWTService.generateToken(testPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });
  });

  describe('verifyToken', () => {
    it('should verify and decode a valid token', () => {
      const token = JWTService.generateToken(testPayload);
      const decoded = JWTService.verifyToken(token);

      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe(testPayload.userId);
      expect(decoded.email).toBe(testPayload.email);
      expect(decoded.role).toBe(testPayload.role);
    });

    it('should throw error for invalid token', () => {
      expect(() => {
        JWTService.verifyToken('invalid.token.here');
      }).toThrow('Invalid or expired token');
    });

    it('should throw error for malformed token', () => {
      expect(() => {
        JWTService.verifyToken('not-a-jwt-token');
      }).toThrow('Invalid or expired token');
    });
  });

  describe('decodeToken', () => {
    it('should decode token without verification', () => {
      const token = JWTService.generateToken(testPayload);
      const decoded = JWTService.decodeToken(token);

      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe(testPayload.userId);
      expect(decoded?.email).toBe(testPayload.email);
    });

    it('should return null for invalid token', () => {
      const decoded = JWTService.decodeToken('invalid-token');

      expect(decoded).toBeNull();
    });
  });
});
