/**
 * Property-Based Tests for PermissionChecker
 * 
 * Feature: backend-refactoring
 * Tests universal properties of permission validation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import { PermissionChecker } from './PermissionChecker.js';
import { IUserRepository } from '../repositories/UserRepository.js';
import { ITaskRepository } from '../repositories/TaskRepository.js';
import { IGroupRepository } from '../repositories/GroupRepository.js';
import { IPositionRepository } from '../repositories/PositionRepository.js';
import { UserRole } from '../models/User.js';
import { AuthorizationError } from './errors.js';
import {
  userIdArbitrary,
  userArbitrary,
  taskArbitrary,
  projectGroupArbitrary,
  positionArbitrary,
} from '../test-utils/generators.js';

describe('PermissionChecker - Property-Based Tests', () => {
  let permissionChecker: PermissionChecker;
  let userRepository: IUserRepository;
  let taskRepository: ITaskRepository;
  let groupRepository: IGroupRepository;
  let positionRepository: IPositionRepository;

  beforeEach(() => {
    // Create mock repositories
    userRepository = {
      findById: vi.fn(),
      findByEmail: vi.fn(),
      findByUsername: vi.fn(),
      findWithStats: vi.fn(),
      updateLastLogin: vi.fn(),
      findAll: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as any;

    taskRepository = {
      findById: vi.fn(),
      findByCreator: vi.fn(),
      findByGroup: vi.fn(),
      findWithPositions: vi.fn(),
      findPublicTasks: vi.fn(),
      updateStatus: vi.fn(),
      findAll: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as any;

    groupRepository = {
      findById: vi.fn(),
      findByOwner: vi.fn(),
      findByMember: vi.fn(),
      findWithMembers: vi.fn(),
      addMember: vi.fn(),
      removeMember: vi.fn(),
      findAll: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as any;

    positionRepository = {
      findById: vi.fn(),
      findByTask: vi.fn(),
      findByUser: vi.fn(),
      findWithApplications: vi.fn(),
      updateRanking: vi.fn(),
      findAll: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as any;
    
    permissionChecker = new PermissionChecker(
      userRepository,
      taskRepository,
      groupRepository,
      positionRepository
    );
  });

  describe('Property 4: Permission Validation', () => {
    // Feature: backend-refactoring, Property 4: Permission Validation
    // **Validates: Requirements 4.1, 4.2, 4.3**
    
    it('should grant task access to super admins for any task', async () => {
      await fc.assert(
        fc.asyncProperty(
          userArbitrary,
          taskArbitrary,
          async (user, task) => {
            // Arrange: Mock admin user and task
            const adminUser = { ...user, role: UserRole.SUPER_ADMIN };
            vi.mocked(userRepository.findById).mockResolvedValue(adminUser);
            vi.mocked(taskRepository.findById).mockResolvedValue(task);

            // Act: Check if admin can access task
            const canAccess = await permissionChecker.canAccessTask(
              adminUser.id,
              task.id!
            );

            // Assert: Admin should always have access
            expect(canAccess).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should grant task access to task creators', async () => {
      await fc.assert(
        fc.asyncProperty(
          userArbitrary,
          taskArbitrary,
          async (user, task) => {
            // Arrange: Mock user and task owned by that user
            const ownedTask = { ...task, publisherId: user.id };
            vi.mocked(userRepository.findById).mockResolvedValue(user);
            vi.mocked(taskRepository.findById).mockResolvedValue(ownedTask);

            // Act: Check if creator can access their task
            const canAccess = await permissionChecker.canAccessTask(
              user.id,
              ownedTask.id!
            );

            // Assert: Creator should have access to their own task
            expect(canAccess).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should grant task access to task assignees', async () => {
      await fc.assert(
        fc.asyncProperty(
          userArbitrary,
          userArbitrary,
          taskArbitrary,
          async (publisher, assignee, task) => {
            // Skip if same user
            fc.pre(publisher.id !== assignee.id);

            // Arrange: Mock publisher, assignee, and task
            const assignedTask = {
              ...task,
              publisherId: publisher.id,
              assigneeId: assignee.id,
            };
            vi.mocked(userRepository.findById).mockResolvedValue(assignee);
            vi.mocked(taskRepository.findById).mockResolvedValue(assignedTask);

            // Act: Check if assignee can access the task
            const canAccess = await permissionChecker.canAccessTask(
              assignee.id,
              assignedTask.id!
            );

            // Assert: Assignee should have access to assigned task
            expect(canAccess).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should deny task access to non-owners and non-admins', async () => {
      await fc.assert(
        fc.asyncProperty(
          userArbitrary,
          userArbitrary,
          taskArbitrary,
          async (owner, otherUser, task) => {
            // Skip if same user or other user is admin
            fc.pre(
              owner.id !== otherUser.id &&
              otherUser.role !== UserRole.SUPER_ADMIN
            );

            // Arrange: Mock owner, other user, and task owned by owner
            const ownedTask = { ...task, publisherId: owner.id, assigneeId: null };
            vi.mocked(userRepository.findById).mockResolvedValue(otherUser);
            vi.mocked(taskRepository.findById).mockResolvedValue(ownedTask);

            // Act: Check if other user can access the task
            const canAccess = await permissionChecker.canAccessTask(
              otherUser.id,
              ownedTask.id!
            );

            // Assert: Other user should not have access
            expect(canAccess).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should grant position access to super admins for any position', async () => {
      await fc.assert(
        fc.asyncProperty(
          userArbitrary,
          positionArbitrary,
          async (user, position) => {
            // Arrange: Mock admin user and position
            const adminUser = { ...user, role: UserRole.SUPER_ADMIN };
            vi.mocked(userRepository.findById).mockResolvedValue(adminUser);
            vi.mocked(positionRepository.findById).mockResolvedValue(position);

            // Act: Check if admin can access position
            const canAccess = await permissionChecker.canAccessPosition(
              adminUser.id,
              position.id!
            );

            // Assert: Admin should always have access
            expect(canAccess).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should grant group access to super admins for any group', async () => {
      await fc.assert(
        fc.asyncProperty(
          userArbitrary,
          projectGroupArbitrary,
          async (user, group) => {
            // Arrange: Mock admin user and group
            const adminUser = { ...user, role: UserRole.SUPER_ADMIN };
            vi.mocked(userRepository.findById).mockResolvedValue(adminUser);
            vi.mocked(groupRepository.findById).mockResolvedValue(group as any);

            // Act: Check if admin can access group
            const canAccess = await permissionChecker.canAccessGroup(
              adminUser.id,
              group.id!
            );

            // Assert: Admin should always have access
            expect(canAccess).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 5: Permission Error Handling', () => {
    // Feature: backend-refactoring, Property 5: Permission Error Handling
    // **Validates: Requirements 4.4, 4.7**
    
    it('should throw AuthorizationError with descriptive message when task modification is denied', async () => {
      await fc.assert(
        fc.asyncProperty(
          userArbitrary,
          userArbitrary,
          taskArbitrary,
          async (owner, otherUser, task) => {
            // Skip if same user or other user is admin
            fc.pre(
              owner.id !== otherUser.id &&
              otherUser.role !== UserRole.SUPER_ADMIN
            );

            // Arrange: Mock owner, other user, and task owned by owner
            const ownedTask = { ...task, publisherId: owner.id, assigneeId: null };
            vi.mocked(userRepository.findById).mockResolvedValue(otherUser);
            vi.mocked(taskRepository.findById).mockResolvedValue(ownedTask);

            // Act & Assert: Should throw AuthorizationError with descriptive message
            await expect(
              permissionChecker.canModifyTask(otherUser.id, ownedTask.id!)
            ).rejects.toThrow(AuthorizationError);

            try {
              await permissionChecker.canModifyTask(otherUser.id, ownedTask.id!);
            } catch (error) {
              expect(error).toBeInstanceOf(AuthorizationError);
              expect((error as AuthorizationError).message).toContain('permission');
              expect((error as AuthorizationError).message).toContain(ownedTask.id!);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should throw AuthorizationError with descriptive message when group modification is denied', async () => {
      await fc.assert(
        fc.asyncProperty(
          userArbitrary,
          projectGroupArbitrary,
          async (user, group) => {
            // Skip if user is admin
            fc.pre(user.role !== UserRole.SUPER_ADMIN);

            // Arrange: Mock user and group (user is not owner due to schema limitations)
            vi.mocked(userRepository.findById).mockResolvedValue(user);
            vi.mocked(groupRepository.findById).mockResolvedValue(group as any);
            // vi.mocked(groupRepository.findByOwner).mockResolvedValue([]);

            // Act & Assert: Should throw AuthorizationError with descriptive message
            await expect(
              permissionChecker.canModifyGroup(user.id, group.id!)
            ).rejects.toThrow(AuthorizationError);

            try {
              await permissionChecker.canModifyGroup(user.id, group.id!);
            } catch (error) {
              expect(error).toBeInstanceOf(AuthorizationError);
              expect((error as AuthorizationError).message).toContain('permission');
              expect((error as AuthorizationError).message).toContain(group.id!);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should throw AuthorizationError with descriptive message when position modification is denied', async () => {
      await fc.assert(
        fc.asyncProperty(
          userArbitrary,
          positionArbitrary,
          async (user, position) => {
            // Skip if user is admin
            fc.pre(user.role !== UserRole.SUPER_ADMIN);

            // Arrange: Mock user and position (user doesn't own any tasks with this position)
            vi.mocked(userRepository.findById).mockResolvedValue(user);
            vi.mocked(positionRepository.findById).mockResolvedValue(position);
            vi.mocked(positionRepository.findByUser).mockResolvedValue([]);
            vi.mocked(taskRepository.findAll).mockResolvedValue([]);

            // Act & Assert: Should throw AuthorizationError with descriptive message
            await expect(
              permissionChecker.canModifyPosition(user.id, position.id!)
            ).rejects.toThrow(AuthorizationError);

            try {
              await permissionChecker.canModifyPosition(user.id, position.id!);
            } catch (error) {
              expect(error).toBeInstanceOf(AuthorizationError);
              expect((error as AuthorizationError).message).toContain('permission');
              expect((error as AuthorizationError).message).toContain(position.id!);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not throw error when user has valid permissions', async () => {
      await fc.assert(
        fc.asyncProperty(
          userArbitrary,
          taskArbitrary,
          async (user, task) => {
            // Arrange: Mock user and task owned by that user
            const ownedTask = { ...task, publisherId: user.id };
            vi.mocked(userRepository.findById).mockResolvedValue(user);
            vi.mocked(taskRepository.findById).mockResolvedValue(ownedTask);

            // Act & Assert: Should not throw error
            await expect(
              permissionChecker.canModifyTask(user.id, ownedTask.id!)
            ).resolves.not.toThrow();
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
