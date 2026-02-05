/**
 * Repository Connection Error Handling Tests
 * 
 * Property 12: Connection Error Handling
 * Tests that repositories handle connection errors gracefully
 * 
 * Feature: backend-refactoring, Property 12: Connection Error Handling
 * Validates: Requirements 9.7
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fc from 'fast-check';
import { Pool, PoolClient } from 'pg';
import { UserRepository } from './UserRepository.js';
import { TaskRepository } from './TaskRepository.js';
import { GroupRepository } from './GroupRepository.js';
import { PositionRepository } from './PositionRepository.js';
import { 
  userArbitrary, 
  taskArbitrary, 
  projectGroupArbitrary, 
  positionArbitrary,
  userIdArbitrary,
  PBT_CONFIG 
} from '../test-utils/index.js';

describe('Repository Connection Error Handling', () => {
  let originalPool: Pool;
  let mockPool: any;

  beforeEach(() => {
    // Create a mock pool that simulates connection errors
    mockPool = {
      connect: vi.fn(),
      query: vi.fn(),
      end: vi.fn(),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Helper to create a repository with a mock pool that throws connection errors
   */
  function createRepositoryWithFailingPool<T>(
    RepositoryClass: new () => T,
    errorMessage: string = 'Connection failed'
  ): T {
    const repo = new RepositoryClass();
    
    // Replace the pool with our mock
    (repo as any).pool = {
      connect: async () => {
        throw new Error(errorMessage);
      },
      query: async () => {
        throw new Error(errorMessage);
      },
      end: async () => {},
    };
    
    return repo;
  }

  /**
   * Helper to create a repository with a mock pool that throws after connection
   */
  function createRepositoryWithQueryFailure<T>(
    RepositoryClass: new () => T,
    errorMessage: string = 'Query execution failed'
  ): T {
    const repo = new RepositoryClass();
    
    let released = false;
    const mockClient: Partial<PoolClient> = {
      query: async () => {
        throw new Error(errorMessage);
      },
      release: () => {
        released = true;
      },
    };
    
    // Replace the pool with our mock
    (repo as any).pool = {
      connect: async () => mockClient,
      query: async () => {
        throw new Error(errorMessage);
      },
      end: async () => {},
    };
    
    // Add a method to check if connection was released
    (repo as any).wasConnectionReleased = () => released;
    
    return repo;
  }

  describe('UserRepository', () => {
    // Feature: backend-refactoring, Property 12: Connection Error Handling
    it('should handle connection errors gracefully in findById', async () => {
      await fc.assert(
        fc.asyncProperty(userIdArbitrary, async (userId) => {
          const repo = createRepositoryWithFailingPool(UserRepository, 'Connection timeout');
          
          try {
            await repo.findById(userId);
            // Should not reach here
            expect(true).toBe(false);
          } catch (error) {
            // Should throw an error
            expect(error).toBeInstanceOf(Error);
            expect((error as Error).message).toContain('Connection');
          }
        }),
        { ...PBT_CONFIG, numRuns: 50 }
      );
    });

    // Feature: backend-refactoring, Property 12: Connection Error Handling
    it('should handle query errors gracefully and release connection', async () => {
      await fc.assert(
        fc.asyncProperty(userIdArbitrary, async (userId) => {
          const repo = createRepositoryWithQueryFailure(UserRepository, 'Query failed');
          
          try {
            await repo.findById(userId);
            // Should not reach here
            expect(true).toBe(false);
          } catch (error) {
            // Should throw an error
            expect(error).toBeInstanceOf(Error);
            
            // Connection should be released even on error
            expect((repo as any).wasConnectionReleased()).toBe(true);
          }
        }),
        { ...PBT_CONFIG, numRuns: 50 }
      );
    });

    // Feature: backend-refactoring, Property 12: Connection Error Handling
    it('should handle connection errors in findByEmail', async () => {
      await fc.assert(
        fc.asyncProperty(fc.emailAddress(), async (email) => {
          const repo = createRepositoryWithFailingPool(UserRepository);
          
          try {
            await repo.findByEmail(email);
            expect(true).toBe(false);
          } catch (error) {
            expect(error).toBeInstanceOf(Error);
          }
        }),
        { ...PBT_CONFIG, numRuns: 50 }
      );
    });
  });

  describe('TaskRepository', () => {
    // Feature: backend-refactoring, Property 12: Connection Error Handling
    it('should handle connection errors gracefully in findById', async () => {
      await fc.assert(
        fc.asyncProperty(userIdArbitrary, async (taskId) => {
          const repo = createRepositoryWithFailingPool(TaskRepository, 'Network error');
          
          try {
            await repo.findById(taskId);
            expect(true).toBe(false);
          } catch (error) {
            expect(error).toBeInstanceOf(Error);
            expect((error as Error).message).toBeTruthy();
          }
        }),
        { ...PBT_CONFIG, numRuns: 50 }
      );
    });

    // Feature: backend-refactoring, Property 12: Connection Error Handling
    it('should handle connection errors in findByCreator', async () => {
      await fc.assert(
        fc.asyncProperty(userIdArbitrary, async (creatorId) => {
          const repo = createRepositoryWithFailingPool(TaskRepository);
          
          try {
            await repo.findByCreator(creatorId);
            expect(true).toBe(false);
          } catch (error) {
            expect(error).toBeInstanceOf(Error);
          }
        }),
        { ...PBT_CONFIG, numRuns: 50 }
      );
    });

    // Feature: backend-refactoring, Property 12: Connection Error Handling
    it('should handle query errors and release connection in findPublicTasks', async () => {
      const repo = createRepositoryWithQueryFailure(TaskRepository);
      
      try {
        await repo.findPublicTasks();
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((repo as any).wasConnectionReleased()).toBe(true);
      }
    });
  });

  describe('GroupRepository', () => {
    // Feature: backend-refactoring, Property 12: Connection Error Handling
    it('should handle connection errors gracefully in findById', async () => {
      await fc.assert(
        fc.asyncProperty(userIdArbitrary, async (groupId) => {
          const repo = createRepositoryWithFailingPool(GroupRepository, 'Database unavailable');
          
          try {
            await repo.findById(groupId);
            expect(true).toBe(false);
          } catch (error) {
            expect(error).toBeInstanceOf(Error);
            expect((error as Error).message).toContain('Database');
          }
        }),
        { ...PBT_CONFIG, numRuns: 50 }
      );
    });

    // Feature: backend-refactoring, Property 12: Connection Error Handling
    it('should handle query errors and release connection', async () => {
      await fc.assert(
        fc.asyncProperty(userIdArbitrary, async (groupId) => {
          const repo = createRepositoryWithQueryFailure(GroupRepository);
          
          try {
            await repo.findById(groupId);
            expect(true).toBe(false);
          } catch (error) {
            expect(error).toBeInstanceOf(Error);
            expect((repo as any).wasConnectionReleased()).toBe(true);
          }
        }),
        { ...PBT_CONFIG, numRuns: 50 }
      );
    });
  });

  describe('PositionRepository', () => {
    // Feature: backend-refactoring, Property 12: Connection Error Handling
    it('should handle connection errors gracefully in findById', async () => {
      await fc.assert(
        fc.asyncProperty(userIdArbitrary, async (positionId) => {
          const repo = createRepositoryWithFailingPool(PositionRepository, 'Connection pool exhausted');
          
          try {
            await repo.findById(positionId);
            expect(true).toBe(false);
          } catch (error) {
            expect(error).toBeInstanceOf(Error);
            expect((error as Error).message).toBeTruthy();
          }
        }),
        { ...PBT_CONFIG, numRuns: 50 }
      );
    });

    // Feature: backend-refactoring, Property 12: Connection Error Handling
    it('should handle connection errors in findByUser', async () => {
      await fc.assert(
        fc.asyncProperty(userIdArbitrary, async (userId) => {
          const repo = createRepositoryWithFailingPool(PositionRepository);
          
          try {
            await repo.findByUser(userId);
            expect(true).toBe(false);
          } catch (error) {
            expect(error).toBeInstanceOf(Error);
          }
        }),
        { ...PBT_CONFIG, numRuns: 50 }
      );
    });

    // Feature: backend-refactoring, Property 12: Connection Error Handling
    it('should handle query errors and release connection in findWithApplications', async () => {
      await fc.assert(
        fc.asyncProperty(userIdArbitrary, async (positionId) => {
          const repo = createRepositoryWithQueryFailure(PositionRepository);
          
          try {
            await repo.findWithApplications(positionId);
            expect(true).toBe(false);
          } catch (error) {
            expect(error).toBeInstanceOf(Error);
            expect((repo as any).wasConnectionReleased()).toBe(true);
          }
        }),
        { ...PBT_CONFIG, numRuns: 50 }
      );
    });
  });

  describe('Cross-Repository Error Consistency', () => {
    // Feature: backend-refactoring, Property 12: Connection Error Handling
    it('should handle connection errors consistently across all repositories', async () => {
      const repositories = [
        new UserRepository(),
        new TaskRepository(),
        new GroupRepository(),
        new PositionRepository(),
      ];

      const errorMessage = 'Simulated connection failure';

      for (const repo of repositories) {
        // Replace pool with failing mock
        (repo as any).pool = {
          connect: async () => {
            throw new Error(errorMessage);
          },
          query: async () => {
            throw new Error(errorMessage);
          },
          end: async () => {},
        };

        try {
          await (repo as any).findById('test-id');
          expect(true).toBe(false);
        } catch (error) {
          // All repositories should throw errors with descriptive messages
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toBeTruthy();
        }
      }
    });
  });
});
