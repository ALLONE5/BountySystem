/**
 * Property-Based Testing Generators
 * 
 * This module provides fast-check generators for creating random test data
 * that conforms to model interfaces. These generators are used in property-based tests.
 */

import fc from 'fast-check';
import { User, UserRole } from '../models/User.js';
import { Task, TaskStatus, Visibility } from '../models/Task.js';
import { ProjectGroup } from '../models/ProjectGroup.js';
import { Position } from '../models/Position.js';

/**
 * Generator for valid User IDs (positive integers as strings)
 */
export const userIdArbitrary = fc.integer({ min: 1, max: 100000 }).map(String);

/**
 * Generator for valid email addresses
 */
export const emailArbitrary = fc.emailAddress();

/**
 * Generator for valid usernames (alphanumeric, 3-20 chars)
 */
export const usernameArbitrary = fc
  .stringMatching(/^[a-zA-Z0-9_]{3,20}$/)
  .filter((s) => s.length >= 3);

/**
 * Generator for UserRole enum values
 */
export const userRoleArbitrary = fc.constantFrom(
  UserRole.USER,
  UserRole.POSITION_ADMIN,
  UserRole.SUPER_ADMIN
);

/**
 * Generator for TaskStatus enum values
 */
export const taskStatusArbitrary = fc.constantFrom(
  TaskStatus.NOT_STARTED,
  TaskStatus.AVAILABLE,
  TaskStatus.IN_PROGRESS,
  TaskStatus.COMPLETED,
  TaskStatus.ABANDONED
);

/**
 * Generator for Visibility enum values
 */
export const visibilityArbitrary = fc.constantFrom(
  Visibility.PUBLIC,
  Visibility.POSITION_ONLY,
  Visibility.PRIVATE
);

/**
 * Generator for valid dates (between 2020 and 2030)
 */
export const dateArbitrary = fc.date({
  min: new Date('2020-01-01'),
  max: new Date('2030-12-31'),
}).filter(d => !isNaN(d.getTime()));

/**
 * Generator for optional dates (null or valid date, never NaN)
 */
export const optionalDateArbitrary = fc.option(dateArbitrary, { nil: null });

/**
 * Generator for valid bounty amounts (0 to 10000)
 */
export const bountyArbitrary = fc.integer({ min: 0, max: 10000 });

/**
 * Generator for valid progress values (0 to 100)
 */
export const progressArbitrary = fc.integer({ min: 0, max: 100 });

/**
 * Generator for valid complexity values (1 to 10)
 */
export const complexityArbitrary = fc.integer({ min: 1, max: 10 });

/**
 * Generator for valid priority values (1 to 5)
 */
export const priorityArbitrary = fc.integer({ min: 1, max: 5 });

/**
 * Generator for valid estimated hours (1 to 1000)
 */
export const estimatedHoursArbitrary = fc.integer({ min: 1, max: 1000 });

/**
 * Generator for valid depth values (0 to 10)
 */
export const depthArbitrary = fc.integer({ min: 0, max: 10 });

/**
 * Generator for string arrays (tags, skills, etc.)
 */
export const stringArrayArbitrary = fc.array(
  fc.string({ minLength: 1, maxLength: 20 }),
  { maxLength: 10 }
);

/**
 * Generator for User objects
 */
export const userArbitrary: fc.Arbitrary<User> = fc.record({
  id: userIdArbitrary,
  username: usernameArbitrary,
  email: emailArbitrary,
  passwordHash: fc.string({ minLength: 60, maxLength: 60 }), // bcrypt hash length
  avatarId: fc.option(userIdArbitrary, { nil: null }),
  role: userRoleArbitrary,
  createdAt: dateArbitrary,
  lastLogin: optionalDateArbitrary,
  updatedAt: dateArbitrary,
});

/**
 * Generator for Task objects
 */
export const taskArbitrary: fc.Arbitrary<Task> = fc.record({
  id: userIdArbitrary,
  name: fc.string({ minLength: 1, maxLength: 200 }),
  description: fc.option(fc.string({ maxLength: 2000 }), { nil: null }),
  parentId: fc.option(userIdArbitrary, { nil: null }),
  depth: depthArbitrary,
  isExecutable: fc.boolean(),
  tags: stringArrayArbitrary,
  createdAt: dateArbitrary,
  plannedStartDate: optionalDateArbitrary,
  plannedEndDate: optionalDateArbitrary,
  actualStartDate: optionalDateArbitrary,
  actualEndDate: optionalDateArbitrary,
  estimatedHours: fc.option(estimatedHoursArbitrary, { nil: null }),
  complexity: fc.option(complexityArbitrary, { nil: null }),
  priority: fc.option(priorityArbitrary, { nil: null }),
  status: taskStatusArbitrary,
  positionId: fc.option(userIdArbitrary, { nil: null }),
  visibility: visibilityArbitrary,
  bountyAmount: bountyArbitrary,
  bountyAlgorithmVersion: fc.option(fc.string({ maxLength: 50 }), { nil: null }),
  isBountySettled: fc.boolean(),
  publisherId: userIdArbitrary,
  assigneeId: fc.option(userIdArbitrary, { nil: null }),
  groupId: fc.option(userIdArbitrary, { nil: null }),
  progress: progressArbitrary,
  progressLocked: fc.boolean(),
  aggregatedEstimatedHours: fc.option(estimatedHoursArbitrary, { nil: null }),
  aggregatedComplexity: fc.option(complexityArbitrary, { nil: null }),
  updatedAt: dateArbitrary,
});

/**
 * Generator for ProjectGroup objects
 */
export const projectGroupArbitrary: fc.Arbitrary<ProjectGroup> = fc.record({
  id: userIdArbitrary,
  name: fc.string({ minLength: 1, maxLength: 200 }),
  description: fc.option(fc.string({ maxLength: 2000 }), { nil: null }),
  createdAt: dateArbitrary,
  updatedAt: dateArbitrary,
});

/**
 * Generator for Position objects
 */
export const positionArbitrary: fc.Arbitrary<Position> = fc.record({
  id: userIdArbitrary,
  name: fc.string({ minLength: 1, maxLength: 200 }),
  description: fc.option(fc.string({ maxLength: 2000 }), { nil: null }),
  requiredSkills: stringArrayArbitrary,
  createdAt: dateArbitrary,
  updatedAt: dateArbitrary,
});

/**
 * Generator for arrays of Users
 */
export const userArrayArbitrary = fc.array(userArbitrary, { maxLength: 20 });

/**
 * Generator for arrays of Tasks
 */
export const taskArrayArbitrary = fc.array(taskArbitrary, { maxLength: 20 });

/**
 * Generator for arrays of ProjectGroups
 */
export const projectGroupArrayArbitrary = fc.array(projectGroupArbitrary, { maxLength: 20 });

/**
 * Generator for arrays of Positions
 */
export const positionArrayArbitrary = fc.array(positionArbitrary, { maxLength: 20 });
