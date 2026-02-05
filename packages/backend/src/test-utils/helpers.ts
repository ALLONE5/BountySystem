/**
 * Test Helper Utilities
 * 
 * This module provides helper functions for property-based testing,
 * including assertion helpers, mock utilities, and test configuration.
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

/**
 * Default configuration for property-based tests
 * Ensures consistent test runs across the codebase
 */
export const PBT_CONFIG = {
  numRuns: 100, // Minimum 100 iterations per property test
  verbose: false,
  seed: undefined, // Can be set for reproducible tests
};

/**
 * Helper to run a property-based test with standard configuration
 * 
 * @param description - Test description
 * @param arbitrary - fast-check arbitrary generator
 * @param predicate - Property to test
 * @param config - Optional configuration overrides
 */
export function testProperty<T>(
  description: string,
  arbitrary: fc.Arbitrary<T>,
  predicate: (value: T) => void | boolean,
  config: Partial<typeof PBT_CONFIG> = {}
): void {
  it(description, () => {
    fc.assert(
      fc.property(arbitrary, predicate),
      { ...PBT_CONFIG, ...config }
    );
  });
}

/**
 * Helper to run a property-based test with multiple arbitraries
 * 
 * @param description - Test description
 * @param arbitraries - Array of fast-check arbitrary generators
 * @param predicate - Property to test
 * @param config - Optional configuration overrides
 */
export function testPropertyMulti<T extends any[]>(
  description: string,
  arbitraries: { [K in keyof T]: fc.Arbitrary<T[K]> },
  predicate: (...values: T) => void | boolean,
  config: Partial<typeof PBT_CONFIG> = {}
): void {
  it(description, () => {
    fc.assert(
      fc.property(...arbitraries, predicate),
      { ...PBT_CONFIG, ...config }
    );
  });
}

/**
 * Assertion helper: Check if an object has all required properties
 */
export function assertHasProperties<T extends object>(
  obj: T,
  properties: (keyof T)[]
): void {
  for (const prop of properties) {
    expect(obj).toHaveProperty(prop);
  }
}

/**
 * Assertion helper: Check if two objects are deeply equal
 */
export function assertDeepEqual<T>(actual: T, expected: T): void {
  expect(actual).toEqual(expected);
}

/**
 * Assertion helper: Check if a value is within a range
 */
export function assertInRange(value: number, min: number, max: number): void {
  expect(value).toBeGreaterThanOrEqual(min);
  expect(value).toBeLessThanOrEqual(max);
}

/**
 * Assertion helper: Check if a date is valid
 */
export function assertValidDate(date: Date | null): void {
  if (date !== null) {
    expect(date).toBeInstanceOf(Date);
    expect(date.getTime()).not.toBeNaN();
  }
}

/**
 * Assertion helper: Check if a string is a valid email
 */
export function assertValidEmail(email: string): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  expect(emailRegex.test(email)).toBe(true);
}

/**
 * Assertion helper: Check if a string is a valid UUID
 */
export function assertValidUUID(id: string): void {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  expect(uuidRegex.test(id) || /^\d+$/.test(id)).toBe(true);
}

/**
 * Helper to create a mock database pool for testing
 */
export function createMockPool() {
  const mockClient = {
    query: async (sql: string, params?: any[]) => ({ rows: [], rowCount: 0 }),
    release: () => {},
  };

  return {
    connect: async () => mockClient,
    query: async (sql: string, params?: any[]) => ({ rows: [], rowCount: 0 }),
    end: async () => {},
  };
}

/**
 * Helper to create a mock transaction client
 */
export function createMockTransactionClient() {
  const queries: Array<{ sql: string; params?: any[] }> = [];
  let committed = false;
  let rolledBack = false;

  return {
    query: async (sql: string, params?: any[]) => {
      queries.push({ sql, params });
      
      if (sql === 'BEGIN') {
        return { rows: [], rowCount: 0 };
      }
      if (sql === 'COMMIT') {
        committed = true;
        return { rows: [], rowCount: 0 };
      }
      if (sql === 'ROLLBACK') {
        rolledBack = true;
        return { rows: [], rowCount: 0 };
      }
      
      return { rows: [], rowCount: 0 };
    },
    release: () => {},
    getQueries: () => queries,
    isCommitted: () => committed,
    isRolledBack: () => rolledBack,
  };
}

/**
 * Helper to wait for async operations in tests
 */
export async function waitFor(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Helper to create a spy function for testing
 */
export function createSpy<T extends (...args: any[]) => any>(): T & {
  calls: Array<Parameters<T>>;
  callCount: number;
  reset: () => void;
} {
  const calls: Array<Parameters<T>> = [];
  
  const spy = ((...args: Parameters<T>) => {
    calls.push(args);
  }) as T & {
    calls: Array<Parameters<T>>;
    callCount: number;
    reset: () => void;
  };
  
  Object.defineProperty(spy, 'calls', {
    get: () => calls,
  });
  
  Object.defineProperty(spy, 'callCount', {
    get: () => calls.length,
  });
  
  spy.reset = () => {
    calls.length = 0;
  };
  
  return spy;
}

/**
 * Helper to check if an error is of a specific type
 */
export function assertErrorType(
  error: unknown,
  expectedType: new (...args: any[]) => Error
): void {
  expect(error).toBeInstanceOf(expectedType);
}

/**
 * Helper to check if an error has a specific message
 */
export function assertErrorMessage(error: unknown, expectedMessage: string): void {
  expect(error).toBeInstanceOf(Error);
  expect((error as Error).message).toContain(expectedMessage);
}

/**
 * Helper to test that a function throws an error
 */
export async function assertThrows(
  fn: () => Promise<any> | any,
  expectedError?: new (...args: any[]) => Error
): Promise<Error> {
  try {
    await fn();
    throw new Error('Expected function to throw, but it did not');
  } catch (error) {
    if (expectedError) {
      assertErrorType(error, expectedError);
    }
    return error as Error;
  }
}

/**
 * Helper to test that a function does not throw
 */
export async function assertDoesNotThrow(fn: () => Promise<any> | any): Promise<void> {
  try {
    await fn();
  } catch (error) {
    throw new Error(`Expected function not to throw, but it threw: ${error}`);
  }
}
