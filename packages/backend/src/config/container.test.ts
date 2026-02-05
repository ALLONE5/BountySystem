/**
 * Container Configuration Tests
 * 
 * Verifies that the DI container is properly configured with all services and repositories.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createContainer } from './container.js';
import { UserRepository } from '../repositories/UserRepository.js';
import { TaskRepository } from '../repositories/TaskRepository.js';
import { GroupRepository } from '../repositories/GroupRepository.js';
import { PositionRepository } from '../repositories/PositionRepository.js';
import { PermissionChecker } from '../utils/PermissionChecker.js';
import { TransactionManager } from '../utils/TransactionManager.js';

describe('Container Configuration', () => {
  let container: ReturnType<typeof createContainer>;

  beforeEach(() => {
    container = createContainer();
  });

  describe('Repository Registration', () => {
    it('should register UserRepository', () => {
      const userRepo = container.resolve('userRepository');
      expect(userRepo).toBeInstanceOf(UserRepository);
    });

    it('should register TaskRepository', () => {
      const taskRepo = container.resolve('taskRepository');
      expect(taskRepo).toBeInstanceOf(TaskRepository);
    });

    it('should register GroupRepository', () => {
      const groupRepo = container.resolve('groupRepository');
      expect(groupRepo).toBeInstanceOf(GroupRepository);
    });

    it('should register PositionRepository', () => {
      const positionRepo = container.resolve('positionRepository');
      expect(positionRepo).toBeInstanceOf(PositionRepository);
    });
  });

  describe('Utility Registration', () => {
    it('should register TransactionManager', () => {
      const txManager = container.resolve('transactionManager');
      expect(txManager).toBeInstanceOf(TransactionManager);
    });

    it('should register PermissionChecker with dependencies', () => {
      const permChecker = container.resolve('permissionChecker');
      expect(permChecker).toBeInstanceOf(PermissionChecker);
    });
  });

  describe('Singleton Behavior', () => {
    it('should return same instance for multiple resolves', () => {
      const userRepo1 = container.resolve('userRepository');
      const userRepo2 = container.resolve('userRepository');
      expect(userRepo1).toBe(userRepo2);
    });

    it('should return same PermissionChecker instance', () => {
      const permChecker1 = container.resolve('permissionChecker');
      const permChecker2 = container.resolve('permissionChecker');
      expect(permChecker1).toBe(permChecker2);
    });

    it('should return same TransactionManager instance', () => {
      const txManager1 = container.resolve('transactionManager');
      const txManager2 = container.resolve('transactionManager');
      expect(txManager1).toBe(txManager2);
    });
  });

  describe('Dependency Resolution', () => {
    it('should resolve PermissionChecker dependencies automatically', () => {
      // This test verifies that PermissionChecker gets its repository dependencies
      // If dependencies are not resolved, the constructor would fail
      expect(() => {
        container.resolve('permissionChecker');
      }).not.toThrow();
    });

    it('should have all required services registered', () => {
      const registeredServices = container.getRegisteredServices();
      
      expect(registeredServices).toContain('userRepository');
      expect(registeredServices).toContain('taskRepository');
      expect(registeredServices).toContain('groupRepository');
      expect(registeredServices).toContain('positionRepository');
      expect(registeredServices).toContain('transactionManager');
      expect(registeredServices).toContain('permissionChecker');
    });
  });

  describe('Container Isolation', () => {
    it('should create independent containers', () => {
      const container1 = createContainer();
      const container2 = createContainer();
      
      const repo1 = container1.resolve('userRepository');
      const repo2 = container2.resolve('userRepository');
      
      // Different containers should create different instances
      expect(repo1).not.toBe(repo2);
    });
  });
});

