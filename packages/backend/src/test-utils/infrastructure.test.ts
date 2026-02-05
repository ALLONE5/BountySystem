/**
 * Test Infrastructure Verification
 * 
 * This test file verifies that the testing infrastructure is set up correctly
 * and all utilities work as expected.
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  createUserFixture,
  createTaskFixture,
  createProjectGroupFixture,
  createPositionFixture,
  createUserFixtures,
  userArbitrary,
  taskArbitrary,
  projectGroupArbitrary,
  positionArbitrary,
  testProperty,
  assertHasProperties,
  assertValidDate,
  assertValidEmail,
  PBT_CONFIG,
} from './index.js';
import { UserRole } from '../models/User.js';
import { TaskStatus, Visibility } from '../models/Task.js';

describe('Test Infrastructure', () => {
  describe('Fixtures', () => {
    it('should create a valid User fixture', () => {
      const user = createUserFixture();
      
      expect(user.id).toBe('1');
      expect(user.username).toBe('testuser');
      expect(user.email).toBe('test@example.com');
      expect(user.role).toBe(UserRole.USER);
      expect(user.createdAt).toBeInstanceOf(Date);
    });

    it('should create a User fixture with overrides', () => {
      const admin = createUserFixture({
        id: '999',
        username: 'admin',
        role: UserRole.SUPER_ADMIN,
      });
      
      expect(admin.id).toBe('999');
      expect(admin.username).toBe('admin');
      expect(admin.role).toBe(UserRole.SUPER_ADMIN);
    });

    it('should create multiple User fixtures', () => {
      const users = createUserFixtures(5);
      
      expect(users).toHaveLength(5);
      expect(users[0].id).toBe('1');
      expect(users[4].id).toBe('5');
      expect(users[0].username).toBe('testuser1');
      expect(users[4].username).toBe('testuser5');
    });

    it('should create a valid Task fixture', () => {
      const task = createTaskFixture();
      
      expect(task.id).toBe('1');
      expect(task.name).toBe('Test Task');
      expect(task.status).toBe(TaskStatus.NOT_STARTED);
      expect(task.visibility).toBe(Visibility.PUBLIC);
      expect(task.bountyAmount).toBe(0);
    });

    it('should create a valid ProjectGroup fixture', () => {
      const group = createProjectGroupFixture();
      
      expect(group.id).toBe('1');
      expect(group.name).toBe('Test Project Group');
      expect(group.createdAt).toBeInstanceOf(Date);
    });

    it('should create a valid Position fixture', () => {
      const position = createPositionFixture();
      
      expect(position.id).toBe('1');
      expect(position.name).toBe('Test Position');
      expect(position.requiredSkills).toEqual([]);
    });
  });

  describe('Generators', () => {
    // Feature: backend-refactoring, Property 0: Infrastructure Verification
    it('should generate valid User objects', () => {
      fc.assert(
        fc.property(userArbitrary, (user) => {
          assertHasProperties(user, ['id', 'username', 'email', 'role', 'createdAt']);
          assertValidEmail(user.email);
          assertValidDate(user.createdAt);
          assertValidDate(user.lastLogin);
          expect(user.username.length).toBeGreaterThanOrEqual(3);
          expect(user.username.length).toBeLessThanOrEqual(20);
        }),
        PBT_CONFIG
      );
    });

    // Feature: backend-refactoring, Property 0: Infrastructure Verification
    it('should generate valid Task objects', () => {
      fc.assert(
        fc.property(taskArbitrary, (task) => {
          assertHasProperties(task, ['id', 'name', 'status', 'visibility', 'publisherId']);
          assertValidDate(task.createdAt);
          assertValidDate(task.plannedStartDate);
          assertValidDate(task.plannedEndDate);
          expect(task.bountyAmount).toBeGreaterThanOrEqual(0);
          expect(task.progress).toBeGreaterThanOrEqual(0);
          expect(task.progress).toBeLessThanOrEqual(100);
        }),
        PBT_CONFIG
      );
    });

    // Feature: backend-refactoring, Property 0: Infrastructure Verification
    it('should generate valid ProjectGroup objects', () => {
      fc.assert(
        fc.property(projectGroupArbitrary, (group) => {
          assertHasProperties(group, ['id', 'name', 'createdAt', 'updatedAt']);
          assertValidDate(group.createdAt);
          assertValidDate(group.updatedAt);
          expect(group.name.length).toBeGreaterThan(0);
        }),
        PBT_CONFIG
      );
    });

    // Feature: backend-refactoring, Property 0: Infrastructure Verification
    it('should generate valid Position objects', () => {
      fc.assert(
        fc.property(positionArbitrary, (position) => {
          assertHasProperties(position, ['id', 'name', 'requiredSkills', 'createdAt']);
          assertValidDate(position.createdAt);
          assertValidDate(position.updatedAt);
          expect(Array.isArray(position.requiredSkills)).toBe(true);
        }),
        PBT_CONFIG
      );
    });
  });

  describe('Helpers', () => {
    // Feature: backend-refactoring, Property 0: Infrastructure Verification
    testProperty(
      'should validate user IDs are strings',
      userArbitrary,
      (user) => {
        expect(typeof user.id).toBe('string');
      }
    );

    it('should assert properties exist', () => {
      const user = createUserFixture();
      assertHasProperties(user, ['id', 'username', 'email']);
    });

    it('should validate dates', () => {
      const user = createUserFixture();
      assertValidDate(user.createdAt);
      assertValidDate(user.lastLogin);
    });

    it('should validate emails', () => {
      assertValidEmail('test@example.com');
      assertValidEmail('user.name+tag@example.co.uk');
    });
  });
});
