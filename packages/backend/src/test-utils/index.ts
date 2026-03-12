/**
 * Test Utilities Index
 * 
 * Central export point for all test utilities, fixtures, generators, and helpers.
 * Import from this file to access all testing infrastructure.
 * 
 * @example
 * ```typescript
 * import { createUserFixture, userArbitrary, testProperty } from '../test-utils';
 * ```
 */

// Export fixtures
export {
  createUserFixture,
  createTaskFixture,
  createProjectGroupFixture,
  createPositionFixture,
  createUserFixtures,
  createTaskFixtures,
  createProjectGroupFixtures,
  createPositionFixtures,
} from './fixtures.js';

// Export generators
export {
  userIdArbitrary,
  emailArbitrary,
  usernameArbitrary,
  userRoleArbitrary,
  taskStatusArbitrary,
  visibilityArbitrary,
  dateArbitrary,
  optionalDateArbitrary,
  bountyArbitrary,
  progressArbitrary,
  complexityArbitrary,
  priorityArbitrary,
  estimatedHoursArbitrary,
  depthArbitrary,
  stringArrayArbitrary,
  userArbitrary,
  taskArbitrary,
  projectGroupArbitrary,
  positionArbitrary,
  userArrayArbitrary,
  taskArrayArbitrary,
  projectGroupArrayArbitrary,
  positionArrayArbitrary,
} from './generators.js';

// Export helpers
export {
  PBT_CONFIG,
  testProperty,
  testPropertyMulti,
  assertHasProperties,
  assertDeepEqual,
  assertInRange,
  assertValidDate,
  assertValidEmail,
  assertValidUUID,
  createMockPool,
  createMockTransactionClient,
  waitFor,
  createSpy,
  assertErrorType,
  assertErrorMessage,
  assertThrows,
  assertDoesNotThrow,
} from './helpers.js';

// Export cleanup utilities
export {
  cleanupAllTestData,
  cleanupUserTestData,
  cleanupTaskTestData,
  disableForeignKeyChecks,
  enableForeignKeyChecks,
  truncateAllTables,
} from './cleanup.js';

export { createTestDependencies, type TestDependencies } from './test-setup.js';
