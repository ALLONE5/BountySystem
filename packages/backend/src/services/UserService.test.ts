import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { UserService } from './UserService.js';
import { UserRole } from '../models/User.js';
import { pool } from '../config/database.js';
import { UserRepository } from '../repositories/UserRepository.js';
import { TaskRepository } from '../repositories/TaskRepository.js';
import { GroupRepository } from '../repositories/GroupRepository.js';
import { PositionRepository } from '../repositories/PositionRepository.js';
import { PermissionChecker } from '../utils/PermissionChecker.js';
import { AuthorizationError, NotFoundError } from '../utils/errors.js';

describe('UserService', () => {
  // Create service with dependencies
  const userRepository = new UserRepository();
  const taskRepository = new TaskRepository();
  const groupRepository = new GroupRepository();
  const positionRepository = new PositionRepository();
  const permissionChecker = new PermissionChecker(
    userRepository,
    taskRepository,
    groupRepository,
    positionRepository
  );
  const userService = new UserService(userRepository, permissionChecker);
  
  let testUserId: string;
  let adminUserId: string;

  beforeAll(async () => {
    // Clean up test data
    await pool.query("DELETE FROM users WHERE email LIKE 'test%@example.com'");
    
    // Create an admin user for permission tests
    const adminUser = await userService.createUser({
      username: 'testadmin',
      email: 'testadmin@example.com',
      password: 'AdminPass123',
      role: UserRole.SUPER_ADMIN,
    });
    adminUserId = adminUser.id;
  });

  afterAll(async () => {
    // Clean up test data
    await pool.query("DELETE FROM users WHERE email LIKE 'test%@example.com'");
  });

  describe('createUser', () => {
    it('should create a new user with hashed password', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123',
      };

      const user = await userService.createUser(userData);

      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.username).toBe(userData.username);
      expect(user.email).toBe(userData.email);
      expect(user.passwordHash).toBeDefined();
      expect(user.passwordHash).not.toBe(userData.password);
      expect(user.role).toBe(UserRole.USER);

      testUserId = user.id;
    });

    it('should create user with specified role', async () => {
      const userData = {
        username: 'adminuser2',
        email: 'testadmin2@example.com',
        password: 'AdminPass123',
        role: UserRole.SUPER_ADMIN,
      };

      const user = await userService.createUser(userData);

      expect(user.role).toBe(UserRole.SUPER_ADMIN);
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const user = await userService.findByEmail('test@example.com');

      expect(user).toBeDefined();
      expect(user?.email).toBe('test@example.com');
      expect(user?.username).toBe('testuser');
    });

    it('should return null for non-existent email', async () => {
      const user = await userService.findByEmail('nonexistent@example.com');

      expect(user).toBeNull();
    });
  });

  describe('findById', () => {
    it('should find user by ID', async () => {
      const user = await userService.findById(testUserId);

      expect(user).toBeDefined();
      expect(user?.id).toBe(testUserId);
      expect(user?.email).toBe('test@example.com');
    });

    it('should return null for non-existent ID', async () => {
      const user = await userService.findById('00000000-0000-0000-0000-000000000000');

      expect(user).toBeNull();
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const user = await userService.findByEmail('test@example.com');
      expect(user).toBeDefined();

      const isValid = await userService.verifyPassword('Password123', user!.passwordHash);

      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const user = await userService.findByEmail('test@example.com');
      expect(user).toBeDefined();

      const isValid = await userService.verifyPassword('wrongpassword', user!.passwordHash);

      expect(isValid).toBe(false);
    });
  });

  describe('updateUser', () => {
    it('should update user information', async () => {
      const updates = {
        username: 'updateduser',
      };

      const user = await userService.updateUser(testUserId, testUserId, updates);

      expect(user.username).toBe('updateduser');
      expect(user.email).toBe('test@example.com'); // Should remain unchanged
    });
  });

  describe('toUserResponse', () => {
    it('should remove sensitive data from user object', async () => {
      const user = await userService.findById(testUserId);
      expect(user).toBeDefined();

      const userResponse = userService.toUserResponse(user!);

      expect(userResponse).toBeDefined();
      expect(userResponse.id).toBe(testUserId);
      expect(userResponse.username).toBeDefined();
      expect(userResponse.email).toBeDefined();
      expect((userResponse as any).passwordHash).toBeUndefined();
    });
  });

  describe('changePassword', () => {
    it('should change user password with valid current password', async () => {
      const currentPassword = 'Password123'; // Must match the password used in createUser
      const newPassword = 'NewPassword123';

      await userService.changePassword(testUserId, currentPassword, newPassword);

      // Verify new password works
      const user = await userService.findById(testUserId);
      expect(user).toBeDefined();
      const isValid = await userService.verifyPassword(newPassword, user!.passwordHash);
      expect(isValid).toBe(true);

      // Verify old password no longer works
      const isOldValid = await userService.verifyPassword(currentPassword, user!.passwordHash);
      expect(isOldValid).toBe(false);

      // Change back for other tests
      await userService.changePassword(testUserId, newPassword, currentPassword);
    });

    it('should reject password change with incorrect current password', async () => {
      await expect(
        userService.changePassword(testUserId, 'WrongPassword123', 'NewPassword123')
      ).rejects.toThrow('Current password is incorrect');
    });

    it('should reject weak passwords', async () => {
      // First test - password too short
      await expect(
        userService.changePassword(testUserId, 'Password123', 'weak')
      ).rejects.toThrow();

      // Second test - no uppercase
      await expect(
        userService.changePassword(testUserId, 'Password123', 'nouppercase123')
      ).rejects.toThrow();

      // Third test - no lowercase
      await expect(
        userService.changePassword(testUserId, 'Password123', 'NOLOWERCASE123')
      ).rejects.toThrow();

      // Fourth test - no numbers
      await expect(
        userService.changePassword(testUserId, 'Password123', 'NoNumbers')
      ).rejects.toThrow();
    });

    it('should reject password change for non-existent user', async () => {
      await expect(
        userService.changePassword('00000000-0000-0000-0000-000000000000', 'password123', 'NewPassword123')
      ).rejects.toThrow('User not found');
    });
  });

  describe('validatePasswordStrength', () => {
    it('should accept strong passwords', () => {
      expect(() => userService.validatePasswordStrength('StrongPass123')).not.toThrow();
      expect(() => userService.validatePasswordStrength('AnotherGood1')).not.toThrow();
    });

    it('should reject passwords that are too short', () => {
      expect(() => userService.validatePasswordStrength('Short1')).toThrow(
        'Password must be at least 8 characters long'
      );
    });

    it('should reject passwords without uppercase letters', () => {
      expect(() => userService.validatePasswordStrength('nouppercase123')).toThrow(
        'Password must contain at least one uppercase letter'
      );
    });

    it('should reject passwords without lowercase letters', () => {
      expect(() => userService.validatePasswordStrength('NOLOWERCASE123')).toThrow(
        'Password must contain at least one lowercase letter'
      );
    });

    it('should reject passwords without numbers', () => {
      expect(() => userService.validatePasswordStrength('NoNumbers')).toThrow(
        'Password must contain at least one number'
      );
    });
  });

  describe('validateEmailFormat', () => {
    it('should accept valid email formats', () => {
      expect(() => userService.validateEmailFormat('test@example.com')).not.toThrow();
      expect(() => userService.validateEmailFormat('user.name@domain.co.uk')).not.toThrow();
      expect(() => userService.validateEmailFormat('user+tag@example.com')).not.toThrow();
    });

    it('should reject invalid email formats', () => {
      expect(() => userService.validateEmailFormat('notanemail')).toThrow('Invalid email format');
      expect(() => userService.validateEmailFormat('missing@domain')).toThrow('Invalid email format');
      expect(() => userService.validateEmailFormat('@nodomain.com')).toThrow('Invalid email format');
      expect(() => userService.validateEmailFormat('noat.com')).toThrow('Invalid email format');
    });
  });

  describe('updateEmail', () => {
    it('should update user email with valid format', async () => {
      const newEmail = 'testnew@example.com';

      const updatedUser = await userService.updateEmail(testUserId, newEmail);

      expect(updatedUser.email).toBe(newEmail);

      // Verify user can be found by new email
      const foundUser = await userService.findByEmail(newEmail);
      expect(foundUser).toBeDefined();
      expect(foundUser?.id).toBe(testUserId);

      // Change back for other tests
      await userService.updateEmail(testUserId, 'test@example.com');
    });

    it('should reject invalid email format', async () => {
      await expect(
        userService.updateEmail(testUserId, 'invalidemail')
      ).rejects.toThrow('Invalid email format');
    });

    it('should reject email already in use by another user', async () => {
      // testadmin@example.com is already used by another user
      await expect(
        userService.updateEmail(testUserId, 'testadmin@example.com')
      ).rejects.toThrow('Email is already in use');
    });

    it('should allow updating to same email', async () => {
      const currentEmail = 'test@example.com';
      
      const updatedUser = await userService.updateEmail(testUserId, currentEmail);
      
      expect(updatedUser.email).toBe(currentEmail);
    });
  });

  describe('requestEmailChange', () => {
    it('should validate email format when requesting change', async () => {
      await expect(
        userService.requestEmailChange(testUserId, 'invalidemail')
      ).rejects.toThrow('Invalid email format');
    });

    it('should reject email already in use when requesting change', async () => {
      await expect(
        userService.requestEmailChange(testUserId, 'testadmin@example.com')
      ).rejects.toThrow('Email is already in use');
    });

    it('should accept valid email change request', async () => {
      await expect(
        userService.requestEmailChange(testUserId, 'testnewemail@example.com')
      ).resolves.not.toThrow();
    });
  });

  // Integration tests for refactored UserService
  describe('Refactored UserService Integration Tests', () => {
    describe('getUserById', () => {
      it('should return UserResponse DTO using repository and mapper', async () => {
        const userResponse = await userService.getUserById(testUserId);

        expect(userResponse).toBeDefined();
        expect(userResponse.id).toBe(testUserId);
        expect(userResponse.username).toBeDefined();
        expect(userResponse.email).toBe('test@example.com');
        expect((userResponse as any).passwordHash).toBeUndefined(); // Should not include password
      });

      it('should throw NotFoundError for non-existent user', async () => {
        await expect(
          userService.getUserById('00000000-0000-0000-0000-000000000000')
        ).rejects.toThrow(NotFoundError);
      });
    });

    describe('getUserWithStats', () => {
      it('should return user with statistics using repository', async () => {
        const userWithStats = await userService.getUserWithStats(testUserId);

        expect(userWithStats).toBeDefined();
        expect(userWithStats.id).toBe(testUserId);
        expect(userWithStats.stats).toBeDefined();
        expect(userWithStats.stats.totalTasksPublished).toBeDefined();
        expect(userWithStats.stats.totalTasksCompleted).toBeDefined();
        expect(userWithStats.stats.totalBountyEarned).toBeDefined();
        expect(userWithStats.stats.totalBountyPaid).toBeDefined();
        expect((userWithStats as any).passwordHash).toBeUndefined(); // Should not include password
      });

      it('should throw error for non-existent user', async () => {
        await expect(
          userService.getUserWithStats('00000000-0000-0000-0000-000000000000')
        ).rejects.toThrow();
      });
    });

    describe('updateUser with permission checking', () => {
      it('should allow user to update their own profile', async () => {
        const updates = {
          username: 'selfupdated',
        };

        const userResponse = await userService.updateUser(testUserId, testUserId, updates);

        expect(userResponse).toBeDefined();
        expect(userResponse.username).toBe('selfupdated');
        expect((userResponse as any).passwordHash).toBeUndefined(); // Should return DTO
      });

      it('should allow admin to update any user profile', async () => {
        const updates = {
          username: 'adminupdated',
        };

        const userResponse = await userService.updateUser(adminUserId, testUserId, updates);

        expect(userResponse).toBeDefined();
        expect(userResponse.username).toBe('adminupdated');
      });

      it('should reject non-admin user updating another user', async () => {
        // Create another regular user
        const otherUser = await userService.createUser({
          username: 'otheruser',
          email: 'testother@example.com',
          password: 'Password123',
        });

        const updates = {
          username: 'unauthorized',
        };

        await expect(
          userService.updateUser(testUserId, otherUser.id, updates)
        ).rejects.toThrow(AuthorizationError);
      });

      it('should update multiple fields using repository', async () => {
        const updates = {
          username: 'multiupdate',
          email: 'testmulti@example.com',
        };

        const userResponse = await userService.updateUser(testUserId, testUserId, updates);

        expect(userResponse.username).toBe('multiupdate');
        expect(userResponse.email).toBe('testmulti@example.com');

        // Change back for other tests
        await userService.updateUser(testUserId, testUserId, {
          username: 'testuser',
          email: 'test@example.com',
        });
      });
    });

    describe('Repository integration', () => {
      it('should use UserRepository for findById', async () => {
        const user = await userService.findById(testUserId);

        expect(user).toBeDefined();
        expect(user?.id).toBe(testUserId);
      });

      it('should use UserRepository for findByEmail', async () => {
        const user = await userService.findByEmail('test@example.com');

        expect(user).toBeDefined();
        expect(user?.email).toBe('test@example.com');
      });

      it('should use UserRepository for findByUsername', async () => {
        const user = await userService.findByUsername('testuser');

        expect(user).toBeDefined();
        expect(user?.username).toBe('testuser');
      });

      it('should use UserRepository for updateLastLogin', async () => {
        await expect(
          userService.updateLastLogin(testUserId)
        ).resolves.not.toThrow();

        const user = await userService.findById(testUserId);
        expect(user?.lastLogin).toBeDefined();
      });
    });

    describe('Error handling', () => {
      it('should handle repository errors gracefully', async () => {
        await expect(
          userService.getUserById('invalid-uuid')
        ).rejects.toThrow();
      });

      it('should propagate NotFoundError from repository', async () => {
        await expect(
          userService.getUserById('00000000-0000-0000-0000-000000000000')
        ).rejects.toThrow(NotFoundError);
      });

      it('should propagate AuthorizationError from permission checks', async () => {
        await expect(
          userService.updateUser(testUserId, adminUserId, { username: 'hack' })
        ).rejects.toThrow(AuthorizationError);
      });
    });
  });
});
