/**
 * Transaction Manager Tests
 * 
 * Tests for the TransactionManager utility class.
 * Includes property-based tests for transaction behavior.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { TransactionManager } from './TransactionManager.js';
import { PBT_CONFIG, testProperty } from '../test-utils/index.js';

describe('TransactionManager', () => {
  describe('Property 6: Transaction Commit on Success', () => {
    // Feature: backend-refactoring, Property 6: Transaction Commit on Success
    it('should commit successful operations', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.string(), { minLength: 1, maxLength: 10 }),
          async (operations) => {
            // Create mock pool and client
            const queries: string[] = [];
            let committed = false;
            let rolledBack = false;
            let released = false;

            const mockClient = {
              query: async (sql: string) => {
                queries.push(sql);
                if (sql === 'COMMIT') {
                  committed = true;
                }
                if (sql === 'ROLLBACK') {
                  rolledBack = true;
                }
                return { rows: [], rowCount: 0 };
              },
              release: () => {
                released = true;
              },
            };

            const mockPool = {
              connect: async () => mockClient,
            } as any;

            const txManager = new TransactionManager(mockPool);

            // Execute successful transaction
            const result = await txManager.executeInTransaction(async (client) => {
              // Simulate operations
              for (const op of operations) {
                await client.query(op);
              }
              return 'success';
            });

            // Verify result
            expect(result).toBe('success');

            // Verify BEGIN was called
            expect(queries[0]).toBe('BEGIN');

            // Verify all operations were executed
            for (let i = 0; i < operations.length; i++) {
              expect(queries[i + 1]).toBe(operations[i]);
            }

            // Verify COMMIT was called
            expect(committed).toBe(true);

            // Verify ROLLBACK was NOT called
            expect(rolledBack).toBe(false);

            // Verify connection was released
            expect(released).toBe(true);
          }
        ),
        { ...PBT_CONFIG }
      );
    });
  });

  describe('Property 7: Transaction Rollback on Failure', () => {
    // Feature: backend-refactoring, Property 7: Transaction Rollback on Failure
    it('should rollback failed operations', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.string(), { minLength: 1, maxLength: 10 }),
          fc.integer({ min: 0, max: 9 }),
          fc.string(),
          async (operations, failureIndex, errorMessage) => {
            // Ensure failure index is within bounds
            const actualFailureIndex = failureIndex % operations.length;

            // Create mock pool and client
            const queries: string[] = [];
            let committed = false;
            let rolledBack = false;
            let released = false;

            const mockClient = {
              query: async (sql: string) => {
                queries.push(sql);
                if (sql === 'COMMIT') {
                  committed = true;
                }
                if (sql === 'ROLLBACK') {
                  rolledBack = true;
                }
                return { rows: [], rowCount: 0 };
              },
              release: () => {
                released = true;
              },
            };

            const mockPool = {
              connect: async () => mockClient,
            } as any;

            const txManager = new TransactionManager(mockPool);

            // Execute transaction that should fail
            let caughtError: Error | null = null;
            try {
              await txManager.executeInTransaction(async (client) => {
                for (let i = 0; i < operations.length; i++) {
                  if (i === actualFailureIndex) {
                    throw new Error(errorMessage);
                  }
                  await client.query(operations[i]);
                }
                return 'success';
              });
            } catch (error) {
              caughtError = error as Error;
            }

            // Verify error was caught
            expect(caughtError).not.toBeNull();
            expect(caughtError?.message).toBe(errorMessage);

            // Verify BEGIN was called
            expect(queries[0]).toBe('BEGIN');

            // Verify ROLLBACK was called
            expect(rolledBack).toBe(true);

            // Verify COMMIT was NOT called
            expect(committed).toBe(false);

            // Verify connection was released
            expect(released).toBe(true);
          }
        ),
        { ...PBT_CONFIG }
      );
    });
  });

  describe('Property 8: Transaction Connection Release', () => {
    // Feature: backend-refactoring, Property 8: Transaction Connection Release
    it('should release connections after transactions (success or failure)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.boolean(),
          fc.string(),
          async (shouldSucceed, errorMessage) => {
            // Create mock pool and client
            let released = false;

            const mockClient = {
              query: async (sql: string) => {
                return { rows: [], rowCount: 0 };
              },
              release: () => {
                released = true;
              },
            };

            const mockPool = {
              connect: async () => mockClient,
            } as any;

            const txManager = new TransactionManager(mockPool);

            // Execute transaction
            try {
              await txManager.executeInTransaction(async (client) => {
                await client.query('SELECT 1');
                if (!shouldSucceed) {
                  throw new Error(errorMessage);
                }
                return 'success';
              });
            } catch (error) {
              // Expected for failure case
            }

            // Verify connection was released regardless of success/failure
            expect(released).toBe(true);
          }
        ),
        { ...PBT_CONFIG }
      );
    });
  });

  describe('Property 9: Transaction Error Propagation', () => {
    // Feature: backend-refactoring, Property 9: Transaction Error Propagation
    it('should propagate errors with stack traces', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1 }),
          async (errorMessage) => {
            // Create mock pool and client
            const mockClient = {
              query: async (sql: string) => {
                return { rows: [], rowCount: 0 };
              },
              release: () => {},
            };

            const mockPool = {
              connect: async () => mockClient,
            } as any;

            const txManager = new TransactionManager(mockPool);

            // Execute transaction that throws error
            let caughtError: Error | null = null;
            try {
              await txManager.executeInTransaction(async (client) => {
                const error = new Error(errorMessage);
                throw error;
              });
            } catch (error) {
              caughtError = error as Error;
            }

            // Verify error was propagated
            expect(caughtError).not.toBeNull();
            expect(caughtError?.message).toBe(errorMessage);

            // Verify stack trace is preserved
            expect(caughtError?.stack).toBeDefined();
            expect(caughtError?.stack).toContain('Error');
          }
        ),
        { ...PBT_CONFIG }
      );
    });
  });

  describe('Unit Tests', () => {
    it('should execute callback and return result on success', async () => {
      const queries: string[] = [];
      let committed = false;
      let released = false;

      const mockClient = {
        query: async (sql: string) => {
          queries.push(sql);
          if (sql === 'COMMIT') {
            committed = true;
          }
          return { rows: [], rowCount: 0 };
        },
        release: () => {
          released = true;
        },
      };

      const mockPool = {
        connect: async () => mockClient,
      } as any;

      const txManager = new TransactionManager(mockPool);

      const result = await txManager.executeInTransaction(async (client) => {
        await client.query('INSERT INTO users VALUES (1)');
        return { id: 1, name: 'Test' };
      });

      expect(result).toEqual({ id: 1, name: 'Test' });
      expect(queries).toContain('BEGIN');
      expect(queries).toContain('INSERT INTO users VALUES (1)');
      expect(queries).toContain('COMMIT');
      expect(committed).toBe(true);
      expect(released).toBe(true);
    });

    it('should rollback on error and propagate error', async () => {
      const queries: string[] = [];
      let rolledBack = false;
      let released = false;

      const mockClient = {
        query: async (sql: string) => {
          queries.push(sql);
          if (sql === 'ROLLBACK') {
            rolledBack = true;
          }
          return { rows: [], rowCount: 0 };
        },
        release: () => {
          released = true;
        },
      };

      const mockPool = {
        connect: async () => mockClient,
      } as any;

      const txManager = new TransactionManager(mockPool);

      await expect(
        txManager.executeInTransaction(async (client) => {
          await client.query('INSERT INTO users VALUES (1)');
          throw new Error('Test error');
        })
      ).rejects.toThrow('Test error');

      expect(queries).toContain('BEGIN');
      expect(queries).toContain('ROLLBACK');
      expect(rolledBack).toBe(true);
      expect(released).toBe(true);
    });
  });
});
