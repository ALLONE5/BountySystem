/**
 * Dependency Injection Container Configuration
 * 
 * Initializes and configures the DI container with all services and repositories.
 * This file serves as the central configuration point for dependency injection.
 */

import { DIContainer } from '../utils/DIContainer.js';
import { pool } from './database.js';

// Repositories
import { UserRepository } from '../repositories/UserRepository.js';
import { TaskRepository } from '../repositories/TaskRepository.js';
import { GroupRepository } from '../repositories/GroupRepository.js';
import { PositionRepository } from '../repositories/PositionRepository.js';

// Services
import { UserService } from '../services/UserService.js';
import { GroupService } from '../services/GroupService.js';
import { TaskService } from '../services/TaskService.js';
import { PositionService } from '../services/PositionService.js';

// Utilities
import { PermissionChecker } from '../utils/PermissionChecker.js';
import { TransactionManager } from '../utils/TransactionManager.js';

/**
 * Create and configure the DI container with all services and repositories
 * @returns Configured DIContainer instance
 */
export function createContainer(): DIContainer {
  const container = new DIContainer();

  // Register repositories
  container.register('userRepository', () => new UserRepository());
  container.register('taskRepository', () => new TaskRepository());
  container.register('groupRepository', () => new GroupRepository());
  container.register('positionRepository', () => new PositionRepository());

  // Register TransactionManager with database pool
  container.register('transactionManager', () => new TransactionManager(pool));

  // Register PermissionChecker with repository dependencies
  container.register('permissionChecker', (c) => new PermissionChecker(
    c.resolve('userRepository'),
    c.resolve('taskRepository'),
    c.resolve('groupRepository'),
    c.resolve('positionRepository')
  ));

  // Register services with their dependencies
  container.register('userService', (c) => new UserService(
    c.resolve('userRepository'),
    c.resolve('permissionChecker')
  ));

  container.register('groupService', (c) => new GroupService(
    c.resolve('groupRepository'),
    c.resolve('permissionChecker')
  ));

  container.register('taskService', (c) => new TaskService(
    c.resolve('taskRepository'),
    c.resolve('positionRepository'),
    c.resolve('permissionChecker'),
    c.resolve('transactionManager')
  ));

  container.register('positionService', (c) => new PositionService(
    c.resolve('positionRepository'),
    c.resolve('permissionChecker')
  ));

  return container;
}

/**
 * Global container instance
 * Use this for application-wide dependency injection
 */
export const container = createContainer();

/**
 * Helper function to resolve services from the global container
 * @param serviceName - Name of the service to resolve
 * @returns Resolved service instance
 */
export function resolve<T>(serviceName: string): T {
  return container.resolve<T>(serviceName);
}

