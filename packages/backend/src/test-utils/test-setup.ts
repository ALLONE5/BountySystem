/**
 * Test Setup Utilities
 * Provides common setup functions for test files
 */

import { UserRepository } from '../repositories/UserRepository.js';
import { TaskRepository } from '../repositories/TaskRepository.js';
import { GroupRepository } from '../repositories/GroupRepository.js';
import { PositionRepository } from '../repositories/PositionRepository.js';
import { PermissionChecker } from '../utils/PermissionChecker.js';

/**
 * Create test dependencies for services
 * Returns commonly used repositories and utilities
 */
export function createTestDependencies() {
  const userRepository = new UserRepository();
  const taskRepository = new TaskRepository();
  const groupRepository = new GroupRepository();
  const positionRepository = new PositionRepository();
  const permissionChecker = new PermissionChecker(userRepository, taskRepository, groupRepository, positionRepository);
  
  return {
    userRepository,
    taskRepository,
    groupRepository,
    positionRepository,
    permissionChecker
  };
}

/**
 * Type for test dependencies
 */
export type TestDependencies = ReturnType<typeof createTestDependencies>;
