/**
 * Error Handling Tests
 * 
 * This module tests error type consistency across the backend system.
 * Feature: backend-refactoring
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  ForbiddenError,
} from './errors.js';

describe('Error Type Consistency', () => {
  // Feature: backend-refactoring, Property 11: Error Type Consistency
  describe('Property 11: Error Type Consistency', () => {
    it('should throw ValidationError with status 400 for validation failures', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 200 }),
          fc.option(fc.anything(), { nil: undefined }),
          (message, details) => {
            // Act
            const error = new ValidationError(message, details);

            // Assert
            expect(error).toBeInstanceOf(ValidationError);
            expect(error).toBeInstanceOf(AppError);
            expect(error).toBeInstanceOf(Error);
            expect(error.name).toBe('ValidationError');
            expect(error.code).toBe('VALIDATION_ERROR');
            expect(error.status).toBe(400);
            expect(error.message).toBe(message);
            if (details !== undefined) {
              expect(error.details).toBe(details);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should throw AuthenticationError with status 401 for authentication failures', () => {
      fc.assert(
        fc.property(
          fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: undefined }),
          (message) => {
            // Act
            const error = message ? new AuthenticationError(message) : new AuthenticationError();

            // Assert
            expect(error).toBeInstanceOf(AuthenticationError);
            expect(error).toBeInstanceOf(AppError);
            expect(error).toBeInstanceOf(Error);
            expect(error.name).toBe('AuthenticationError');
            expect(error.code).toBe('AUTHENTICATION_ERROR');
            expect(error.status).toBe(401);
            expect(error.message).toBe(message || 'Authentication failed');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should throw AuthorizationError with status 403 for authorization failures', () => {
      fc.assert(
        fc.property(
          fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: undefined }),
          (message) => {
            // Act
            const error = message ? new AuthorizationError(message) : new AuthorizationError();

            // Assert
            expect(error).toBeInstanceOf(AuthorizationError);
            expect(error).toBeInstanceOf(AppError);
            expect(error).toBeInstanceOf(Error);
            expect(error.name).toBe('AuthorizationError');
            expect(error.code).toBe('AUTHORIZATION_ERROR');
            expect(error.status).toBe(403);
            expect(error.message).toBe(message || 'Insufficient permissions');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should throw NotFoundError with status 404 for resource not found', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          (resource) => {
            // Act
            const error = new NotFoundError(resource);

            // Assert
            expect(error).toBeInstanceOf(NotFoundError);
            expect(error).toBeInstanceOf(AppError);
            expect(error).toBeInstanceOf(Error);
            expect(error.name).toBe('NotFoundError');
            expect(error.code).toBe('NOT_FOUND');
            expect(error.status).toBe(404);
            expect(error.message).toBe(`${resource} not found`);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should throw ConflictError with status 409 for conflict conditions', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 200 }),
          (message) => {
            // Act
            const error = new ConflictError(message);

            // Assert
            expect(error).toBeInstanceOf(ConflictError);
            expect(error).toBeInstanceOf(AppError);
            expect(error).toBeInstanceOf(Error);
            expect(error.name).toBe('ConflictError');
            expect(error.code).toBe('CONFLICT');
            expect(error.status).toBe(409);
            expect(error.message).toBe(message);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should throw ForbiddenError with status 403 for forbidden access', () => {
      fc.assert(
        fc.property(
          fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: undefined }),
          (message) => {
            // Act
            const error = message ? new ForbiddenError(message) : new ForbiddenError();

            // Assert
            expect(error).toBeInstanceOf(ForbiddenError);
            expect(error).toBeInstanceOf(AppError);
            expect(error).toBeInstanceOf(Error);
            expect(error.name).toBe('ForbiddenError');
            expect(error.code).toBe('FORBIDDEN');
            expect(error.status).toBe(403);
            expect(error.message).toBe(message || 'Forbidden');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve error hierarchy and instanceof checks', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            'ValidationError',
            'AuthenticationError',
            'AuthorizationError',
            'NotFoundError',
            'ConflictError',
            'ForbiddenError'
          ),
          fc.string({ minLength: 1, maxLength: 200 }),
          (errorType, message) => {
            // Arrange & Act
            let error: AppError;
            switch (errorType) {
              case 'ValidationError':
                error = new ValidationError(message);
                break;
              case 'AuthenticationError':
                error = new AuthenticationError(message);
                break;
              case 'AuthorizationError':
                error = new AuthorizationError(message);
                break;
              case 'NotFoundError':
                error = new NotFoundError(message);
                break;
              case 'ConflictError':
                error = new ConflictError(message);
                break;
              case 'ForbiddenError':
                error = new ForbiddenError(message);
                break;
              default:
                throw new Error('Unknown error type');
            }

            // Assert: All custom errors should be instances of AppError and Error
            expect(error).toBeInstanceOf(AppError);
            expect(error).toBeInstanceOf(Error);
            expect(error.name).toBe(errorType);
            expect(error.message).toBeTruthy();
            expect(error.code).toBeTruthy();
            expect(error.status).toBeGreaterThanOrEqual(400);
            expect(error.status).toBeLessThan(600);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have consistent status codes for error types', () => {
      // Arrange
      const errorTypeToStatus = {
        ValidationError: 400,
        AuthenticationError: 401,
        AuthorizationError: 403,
        ForbiddenError: 403,
        NotFoundError: 404,
        ConflictError: 409,
      };

      fc.assert(
        fc.property(
          fc.constantFrom(...Object.keys(errorTypeToStatus)),
          fc.string({ minLength: 1, maxLength: 200 }),
          (errorType, message) => {
            // Act
            let error: AppError;
            switch (errorType) {
              case 'ValidationError':
                error = new ValidationError(message);
                break;
              case 'AuthenticationError':
                error = new AuthenticationError(message);
                break;
              case 'AuthorizationError':
                error = new AuthorizationError(message);
                break;
              case 'NotFoundError':
                error = new NotFoundError(message);
                break;
              case 'ConflictError':
                error = new ConflictError(message);
                break;
              case 'ForbiddenError':
                error = new ForbiddenError(message);
                break;
              default:
                throw new Error('Unknown error type');
            }

            // Assert
            const expectedStatus = errorTypeToStatus[errorType as keyof typeof errorTypeToStatus];
            expect(error.status).toBe(expectedStatus);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
