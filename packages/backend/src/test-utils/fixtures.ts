/**
 * Test Fixtures for Property-Based Testing
 * 
 * This module provides base test fixtures for models used in property-based testing.
 * These fixtures provide valid default values that can be overridden for specific test cases.
 */

import { User, UserRole } from '../models/User.js';
import { Task, TaskStatus, Visibility } from '../models/Task.js';
import { ProjectGroup } from '../models/ProjectGroup.js';
import { Position } from '../models/Position.js';

/**
 * Creates a base User fixture with valid default values
 */
export function createUserFixture(overrides: Partial<User> = {}): User {
  return {
    id: '1',
    username: 'testuser',
    email: 'test@example.com',
    passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz123456',
    avatarId: null,
    role: UserRole.USER,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    lastLogin: null,
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  };
}

/**
 * Creates a base Task fixture with valid default values
 */
export function createTaskFixture(overrides: Partial<Task> = {}): Task {
  return {
    id: '1',
    name: 'Test Task',
    description: 'Test task description',
    parentId: null,
    depth: 0,
    isExecutable: true,
    tags: [],
    createdAt: new Date('2024-01-01T00:00:00Z'),
    plannedStartDate: null,
    plannedEndDate: null,
    actualStartDate: null,
    actualEndDate: null,
    estimatedHours: null,
    complexity: null,
    priority: null,
    status: TaskStatus.NOT_STARTED,
    positionId: null,
    visibility: Visibility.PUBLIC,
    bountyAmount: 0,
    bountyAlgorithmVersion: null,
    isBountySettled: false,
    publisherId: '1',
    assigneeId: null,
    groupId: null,
    progress: 0,
    progressLocked: false,
    aggregatedEstimatedHours: null,
    aggregatedComplexity: null,
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  };
}

/**
 * Creates a base ProjectGroup fixture with valid default values
 */
export function createProjectGroupFixture(overrides: Partial<ProjectGroup> = {}): ProjectGroup {
  return {
    id: '1',
    name: 'Test Project Group',
    description: 'Test project group description',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  };
}

/**
 * Creates a base Position fixture with valid default values
 */
export function createPositionFixture(overrides: Partial<Position> = {}): Position {
  return {
    id: '1',
    name: 'Test Position',
    description: 'Test position description',
    requiredSkills: [],
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  };
}

/**
 * Creates multiple User fixtures with sequential IDs
 */
export function createUserFixtures(count: number, baseOverrides: Partial<User> = {}): User[] {
  return Array.from({ length: count }, (_, i) =>
    createUserFixture({
      ...baseOverrides,
      id: String(i + 1),
      username: `testuser${i + 1}`,
      email: `test${i + 1}@example.com`,
    })
  );
}

/**
 * Creates multiple Task fixtures with sequential IDs
 */
export function createTaskFixtures(count: number, baseOverrides: Partial<Task> = {}): Task[] {
  return Array.from({ length: count }, (_, i) =>
    createTaskFixture({
      ...baseOverrides,
      id: String(i + 1),
      name: `Test Task ${i + 1}`,
    })
  );
}

/**
 * Creates multiple ProjectGroup fixtures with sequential IDs
 */
export function createProjectGroupFixtures(count: number, baseOverrides: Partial<ProjectGroup> = {}): ProjectGroup[] {
  return Array.from({ length: count }, (_, i) =>
    createProjectGroupFixture({
      ...baseOverrides,
      id: String(i + 1),
      name: `Test Project Group ${i + 1}`,
    })
  );
}

/**
 * Creates multiple Position fixtures with sequential IDs
 */
export function createPositionFixtures(count: number, baseOverrides: Partial<Position> = {}): Position[] {
  return Array.from({ length: count }, (_, i) =>
    createPositionFixture({
      ...baseOverrides,
      id: String(i + 1),
      name: `Test Position ${i + 1}`,
    })
  );
}
