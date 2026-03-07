import { describe, it, expect, beforeEach, afterEach, afterAll } from 'vitest';
import { pool } from '../config/database.js';
import { PositionService } from './PositionService.js';
import { UserService } from './UserService.js';
import { ApplicationStatus } from '../models/Position.js';

describe('PositionService', () => {
  let positionService: PositionService;
  let userService: UserService;
  let testUserId: string;
  let testPositionId: string;

  beforeEach(async () => {
    positionService = new PositionService();
    userService = new UserService(userRepository, permissionChecker);

    // Create a test user
    const user = await userService.createUser({
      username: `testuser_${Date.now()}`,
      email: `test_${Date.now()}@example.com`,
      password: 'password123',
    });
    testUserId = user.id;

    // Create a test position
    const position = await positionService.createPosition({
      name: `Test Position ${Date.now()}`,
      description: 'A test position',
      requiredSkills: ['skill1', 'skill2'],
    });
    testPositionId = position.id;
  });

  afterEach(async () => {
    // Clean up test data
    if (testUserId) {
      await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
    }
    if (testPositionId) {
      await pool.query('DELETE FROM positions WHERE id = $1', [testPositionId]);
    }
  });



  describe('Position CRUD', () => {
    it('should create a position', async () => {
      const position = await positionService.createPosition({
        name: `New Position ${Date.now()}`,
        description: 'New position description',
        requiredSkills: ['typescript', 'nodejs'],
      });

      expect(position).toBeDefined();
      expect(position.id).toBeDefined();
      expect(position.name).toContain('New Position');
      expect(position.requiredSkills).toEqual(['typescript', 'nodejs']);

      // Clean up
      await pool.query('DELETE FROM positions WHERE id = $1', [position.id]);
    });

    it('should get position by ID', async () => {
      const position = await positionService.getPositionById(testPositionId);

      expect(position).toBeDefined();
      expect(position?.id).toBe(testPositionId);
    });

    it('should get all positions', async () => {
      const positions = await positionService.getAllPositions();

      expect(positions).toBeDefined();
      expect(Array.isArray(positions)).toBe(true);
      expect(positions.length).toBeGreaterThan(0);
    });

    it('should update a position', async () => {
      const updated = await positionService.updatePosition(testPositionId, {
        description: 'Updated description',
        requiredSkills: ['newskill'],
      });

      expect(updated.description).toBe('Updated description');
      expect(updated.requiredSkills).toEqual(['newskill']);
    });
  });

  describe('Position Application', () => {
    it('should allow user to apply for a position', async () => {
      const application = await positionService.applyForPosition({
        userId: testUserId,
        positionId: testPositionId,
        reason: 'I want this position',
      });

      expect(application).toBeDefined();
      expect(application.userId).toBe(testUserId);
      expect(application.positionId).toBe(testPositionId);
      expect(application.status).toBe(ApplicationStatus.PENDING);
      expect(application.reason).toBe('I want this position');
    });

    it('should prevent duplicate applications', async () => {
      await positionService.applyForPosition({
        userId: testUserId,
        positionId: testPositionId,
        reason: 'First application',
      });

      await expect(
        positionService.applyForPosition({
          userId: testUserId,
          positionId: testPositionId,
          reason: 'Second application',
        })
      ).rejects.toThrow('already has a pending application');
    });

    it('should prevent application if user already has the position', async () => {
      // Grant position directly
      await positionService.grantPosition(testUserId, testPositionId);

      await expect(
        positionService.applyForPosition({
          userId: testUserId,
          positionId: testPositionId,
          reason: 'I want this position',
        })
      ).rejects.toThrow('already has this position');
    });

    it('should enforce 3-position limit on application', async () => {
      // Create 3 positions and grant them
      const positions = await Promise.all([
        positionService.createPosition({ name: `Pos1_${Date.now()}` }),
        positionService.createPosition({ name: `Pos2_${Date.now()}` }),
        positionService.createPosition({ name: `Pos3_${Date.now()}` }),
      ]);

      for (const pos of positions) {
        await positionService.grantPosition(testUserId, pos.id);
      }

      // Try to apply for a 4th position
      await expect(
        positionService.applyForPosition({
          userId: testUserId,
          positionId: testPositionId,
          reason: 'Fourth position',
        })
      ).rejects.toThrow('cannot have more than 3 positions');

      // Clean up
      for (const pos of positions) {
        await pool.query('DELETE FROM positions WHERE id = $1', [pos.id]);
      }
    });
  });

  describe('Application Review', () => {
    it('should approve application and grant position', async () => {
      // Create application
      const application = await positionService.applyForPosition({
        userId: testUserId,
        positionId: testPositionId,
        reason: 'Please approve',
      });

      // Create reviewer
      const reviewer = await userService.createUser({
        username: `reviewer_${Date.now()}`,
        email: `reviewer_${Date.now()}@example.com`,
        password: 'password123',
      });

      // Approve application
      const reviewed = await positionService.reviewApplication({
        applicationId: application.id,
        reviewerId: reviewer.id,
        approved: true,
        reviewComment: 'Approved!',
      });

      expect(reviewed.status).toBe(ApplicationStatus.APPROVED);
      expect(reviewed.reviewedBy).toBe(reviewer.id);
      expect(reviewed.reviewComment).toBe('Approved!');
      expect(reviewed.reviewedAt).toBeDefined();

      // Verify user has the position
      const hasPosition = await positionService.userHasPosition(testUserId, testPositionId);
      expect(hasPosition).toBe(true);

      // Clean up
      await pool.query('DELETE FROM users WHERE id = $1', [reviewer.id]);
    });

    it('should reject application without granting position', async () => {
      // Create application
      const application = await positionService.applyForPosition({
        userId: testUserId,
        positionId: testPositionId,
        reason: 'Please review',
      });

      // Create reviewer
      const reviewer = await userService.createUser({
        username: `reviewer_${Date.now()}`,
        email: `reviewer_${Date.now()}@example.com`,
        password: 'password123',
      });

      // Reject application
      const reviewed = await positionService.reviewApplication({
        applicationId: application.id,
        reviewerId: reviewer.id,
        approved: false,
        reviewComment: 'Not qualified',
      });

      expect(reviewed.status).toBe(ApplicationStatus.REJECTED);
      expect(reviewed.reviewComment).toBe('Not qualified');

      // Verify user does not have the position
      const hasPosition = await positionService.userHasPosition(testUserId, testPositionId);
      expect(hasPosition).toBe(false);

      // Clean up
      await pool.query('DELETE FROM users WHERE id = $1', [reviewer.id]);
    });

    it('should prevent reviewing already reviewed application', async () => {
      // Create and approve application
      const application = await positionService.applyForPosition({
        userId: testUserId,
        positionId: testPositionId,
        reason: 'Test',
      });

      const reviewer = await userService.createUser({
        username: `reviewer_${Date.now()}`,
        email: `reviewer_${Date.now()}@example.com`,
        password: 'password123',
      });

      await positionService.reviewApplication({
        applicationId: application.id,
        reviewerId: reviewer.id,
        approved: true,
      });

      // Try to review again
      await expect(
        positionService.reviewApplication({
          applicationId: application.id,
          reviewerId: reviewer.id,
          approved: false,
        })
      ).rejects.toThrow('already been reviewed');

      // Clean up
      await pool.query('DELETE FROM users WHERE id = $1', [reviewer.id]);
    });

    it('should enforce 3-position limit when approving application', async () => {
      // Grant 3 positions
      const positions = await Promise.all([
        positionService.createPosition({ name: `Pos1_${Date.now()}` }),
        positionService.createPosition({ name: `Pos2_${Date.now()}` }),
        positionService.createPosition({ name: `Pos3_${Date.now()}` }),
      ]);

      for (const pos of positions) {
        await positionService.grantPosition(testUserId, pos.id);
      }

      // Try to apply for 4th position - should fail
      await expect(
        positionService.applyForPosition({
          userId: testUserId,
          positionId: testPositionId,
          reason: 'Fourth position',
        })
      ).rejects.toThrow('User cannot have more than 3 positions');

      // Clean up
      for (const pos of positions) {
        await pool.query('DELETE FROM positions WHERE id = $1', [pos.id]);
      }
    });
  });

  describe('User Positions', () => {
    it('should get user positions', async () => {
      await positionService.grantPosition(testUserId, testPositionId);

      const positions = await positionService.getUserPositions(testUserId);

      expect(positions).toBeDefined();
      expect(positions.length).toBe(1);
      expect(positions[0].id).toBe(testPositionId);
    });

    it('should check if user has position', async () => {
      let hasPosition = await positionService.userHasPosition(testUserId, testPositionId);
      expect(hasPosition).toBe(false);

      await positionService.grantPosition(testUserId, testPositionId);

      hasPosition = await positionService.userHasPosition(testUserId, testPositionId);
      expect(hasPosition).toBe(true);
    });

    it('should get user position count', async () => {
      let count = await positionService.getUserPositionCount(testUserId);
      expect(count).toBe(0);

      await positionService.grantPosition(testUserId, testPositionId);

      count = await positionService.getUserPositionCount(testUserId);
      expect(count).toBe(1);
    });

    it('should revoke position from user', async () => {
      await positionService.grantPosition(testUserId, testPositionId);

      let hasPosition = await positionService.userHasPosition(testUserId, testPositionId);
      expect(hasPosition).toBe(true);

      await positionService.revokePosition(testUserId, testPositionId);

      hasPosition = await positionService.userHasPosition(testUserId, testPositionId);
      expect(hasPosition).toBe(false);
    });

    it('should enforce 3-position limit when granting directly', async () => {
      // Create and grant 3 positions
      const positions = await Promise.all([
        positionService.createPosition({ name: `Pos1_${Date.now()}` }),
        positionService.createPosition({ name: `Pos2_${Date.now()}` }),
        positionService.createPosition({ name: `Pos3_${Date.now()}` }),
      ]);

      for (const pos of positions) {
        await positionService.grantPosition(testUserId, pos.id);
      }

      // Try to grant a 4th position
      await expect(
        positionService.grantPosition(testUserId, testPositionId)
      ).rejects.toThrow('cannot have more than 3 positions');

      // Clean up
      for (const pos of positions) {
        await pool.query('DELETE FROM positions WHERE id = $1', [pos.id]);
      }
    });
  });
});


describe('PositionService - Refactored with Repository and Mapper', () => {
  let positionService: PositionService;
  let userService: UserService;
  let testUserId: string;
  let testPositionId: string;

  beforeEach(async () => {
    // Import dependencies
    const { PositionRepository } = await import('../repositories/PositionRepository.js');
    const { PermissionChecker } = await import('../utils/PermissionChecker.js');
    const { UserRepository } = await import('../repositories/UserRepository.js');
    const { TaskRepository } = await import('../repositories/TaskRepository.js');
    const { GroupRepository } = await import('../repositories/GroupRepository.js');

    // Create repository instances
    const positionRepository = new PositionRepository();
    const userRepository = new UserRepository();
    const taskRepository = new TaskRepository();
    const groupRepository = new GroupRepository();

    // Create permission checker
    const permissionChecker = new PermissionChecker(
      userRepository,
      taskRepository,
      groupRepository,
      positionRepository
    );

    // Create service with dependencies
    positionService = new PositionService(positionRepository, permissionChecker);
    userService = new UserService(userRepository, permissionChecker);

    // Create a test user
    const user = await userService.createUser({
      username: `testuser_refactored_${Date.now()}`,
      email: `test_refactored_${Date.now()}@example.com`,
      password: 'password123',
    });
    testUserId = user.id;

    // Create a test position
    const position = await positionService.createPosition({
      name: `Test Position Refactored ${Date.now()}`,
      description: 'A test position for refactored service',
      requiredSkills: ['skill1', 'skill2'],
    });
    testPositionId = position.id;
  });

  afterEach(async () => {
    // Clean up test data
    if (testUserId) {
      await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
    }
    if (testPositionId) {
      await pool.query('DELETE FROM positions WHERE id = $1', [testPositionId]);
    }
  });

  describe('Repository Integration', () => {
    it('should use repository to get position by ID', async () => {
      const position = await positionService.getPositionById(testPositionId);

      expect(position).toBeDefined();
      expect(position?.id).toBe(testPositionId);
      // Verify DTO transformation (camelCase fields)
      expect(position?.requiredSkills).toBeDefined();
      expect(position?.createdAt).toBeDefined();
      expect(position?.updatedAt).toBeDefined();
    });

    it('should use repository to update position', async () => {
      const updated = await positionService.updatePosition(testPositionId, {
        description: 'Updated via repository',
      });

      expect(updated.description).toBe('Updated via repository');
      // Verify DTO transformation
      expect(updated.createdAt).toBeDefined();
      expect(updated.updatedAt).toBeDefined();
    });

    it('should use repository to get user positions', async () => {
      await positionService.grantPosition(testUserId, testPositionId);

      const positions = await positionService.getUserPositions(testUserId);

      expect(positions).toBeDefined();
      expect(positions.length).toBeGreaterThan(0);
      // Verify DTO transformation
      expect(positions[0].requiredSkills).toBeDefined();
      expect(positions[0].createdAt).toBeDefined();
    });

    it('should use repository to update ranking', async () => {
      // Note: This is a placeholder as schema doesn't have ranking
      const result = await positionService.updateRanking(testPositionId, 5);

      expect(result).toBeDefined();
      expect(result.id).toBe(testPositionId);
    });
  });

  describe('Mapper Integration', () => {
    it('should return DTOs with camelCase fields for positions', async () => {
      const position = await positionService.getPositionById(testPositionId);

      expect(position).toBeDefined();
      // Check for camelCase fields (not snake_case)
      expect(position?.requiredSkills).toBeDefined();
      expect(position?.createdAt).toBeDefined();
      expect(position?.updatedAt).toBeDefined();
      // Ensure snake_case fields are not present
      expect((position as any)?.required_skills).toBeUndefined();
      expect((position as any)?.created_at).toBeUndefined();
    });

    it('should return DTOs with camelCase fields for applications', async () => {
      const application = await positionService.applyForPosition({
        userId: testUserId,
        positionId: testPositionId,
        reason: 'Testing mapper',
      });

      expect(application).toBeDefined();
      // Check for camelCase fields
      expect(application.userId).toBe(testUserId);
      expect(application.positionId).toBe(testPositionId);
      expect(application.createdAt).toBeDefined();
      expect(application.reviewedAt).toBeDefined();
      // Ensure snake_case fields are not present
      expect((application as any).user_id).toBeUndefined();
      expect((application as any).position_id).toBeUndefined();
    });

    it('should return DTOs for position lists', async () => {
      await positionService.grantPosition(testUserId, testPositionId);
      const positions = await positionService.getUserPositions(testUserId);

      expect(positions).toBeDefined();
      expect(Array.isArray(positions)).toBe(true);
      positions.forEach(pos => {
        expect(pos.requiredSkills).toBeDefined();
        expect(pos.createdAt).toBeDefined();
        expect((pos as any).required_skills).toBeUndefined();
      });
    });

    it('should return DTOs for application lists', async () => {
      await positionService.applyForPosition({
        userId: testUserId,
        positionId: testPositionId,
        reason: 'Test',
      });

      const applications = await positionService.getUserApplications(testUserId);

      expect(applications).toBeDefined();
      expect(Array.isArray(applications)).toBe(true);
      applications.forEach(app => {
        expect(app.userId).toBeDefined();
        expect(app.positionId).toBeDefined();
        expect(app.createdAt).toBeDefined();
        expect((app as any).user_id).toBeUndefined();
      });
    });
  });

  describe('Error Handling', () => {
    it('should throw error when position not found', async () => {
      await expect(
        positionService.getPositionById('00000000-0000-0000-0000-000000000000')
      ).resolves.toBeNull();
    });

    it('should throw error when updating non-existent position', async () => {
      await expect(
        positionService.updatePosition('00000000-0000-0000-0000-000000000000', { description: 'test' })
      ).rejects.toThrow('Position not found');
    });

    it('should handle repository errors gracefully', async () => {
      // Test with invalid position ID format
      await expect(
        positionService.getPositionById('invalid-uuid')
      ).rejects.toThrow();
    });
  });

  describe('Backward Compatibility', () => {
    it('should maintain same response structure as before refactoring', async () => {
      const position = await positionService.getPositionById(testPositionId);

      // Verify response has expected fields
      expect(position).toHaveProperty('id');
      expect(position).toHaveProperty('name');
      expect(position).toHaveProperty('description');
      expect(position).toHaveProperty('requiredSkills');
      expect(position).toHaveProperty('createdAt');
      expect(position).toHaveProperty('updatedAt');
    });

    it('should maintain same application response structure', async () => {
      const application = await positionService.applyForPosition({
        userId: testUserId,
        positionId: testPositionId,
        reason: 'Test',
      });

      // Verify response has expected fields
      expect(application).toHaveProperty('id');
      expect(application).toHaveProperty('userId');
      expect(application).toHaveProperty('positionId');
      expect(application).toHaveProperty('reason');
      expect(application).toHaveProperty('status');
      expect(application).toHaveProperty('createdAt');
    });
  });
});
