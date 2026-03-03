import { describe, it, expect } from 'vitest';
import { createUserFixture, createTaskFixture, createProjectGroupFixture, createPositionFixture } from '../test-utils/fixtures.js';
import { UserMapper } from '../utils/mappers/UserMapper.js';
import { TaskMapper } from '../utils/mappers/TaskMapper.js';
import { GroupMapper } from '../utils/mappers/GroupMapper.js';
import { PositionMapper } from '../utils/mappers/PositionMapper.js';

/**
 * Backward Compatibility Test Suite
 * 
 * This test suite verifies that the refactored API maintains backward compatibility
 * with the pre-refactoring implementation by testing:
 * - Response structure consistency
 * - Field naming conventions (camelCase)
 * - Required fields presence
 * - Data type consistency
 * - No sensitive data exposure
 * 
 * Requirements: 6.7
 */

describe('API Backward Compatibility Tests', () => {
  describe('User Response Structure', () => {
    it('should return user response with expected structure', () => {
      const user = createUserFixture({ id: '123', username: 'testuser' });
      const response = UserMapper.toUserResponse(user);

      expect(response).toHaveProperty('id');
      expect(response).toHaveProperty('username');
      expect(response).not.toHaveProperty('passwordHash');
    });

    it('should use camelCase for user fields', () => {
      const user = createUserFixture();
      const response = UserMapper.toUserResponse(user);

      expect(response).toHaveProperty('createdAt');
      expect(response).not.toHaveProperty('created_at');
    });

    it('should handle null values in user fields', () => {
      const user = createUserFixture({ avatarId: null, lastLogin: null });
      const response = UserMapper.toUserResponse(user);

      expect(response.avatarId).toBeNull();
      expect(response.lastLogin).toBeNull();
    });

    it('should never expose password hash in user responses', () => {
      const user = createUserFixture({ passwordHash: '$2b$10$secrethash' });
      const response = UserMapper.toUserResponse(user);

      expect(response).not.toHaveProperty('password');
      expect(response).not.toHaveProperty('passwordHash');
      expect(response).not.toHaveProperty('password_hash');
    });
  });

  describe('Task Response Structure', () => {
    it('should return task DTO with expected structure', () => {
      const task = createTaskFixture({ id: '456', name: 'Test Task' });
      const dto = TaskMapper.toDTO(task);

      expect(dto).toHaveProperty('id');
      expect(dto).toHaveProperty('name');
      expect(dto).toHaveProperty('publisherId');
    });

    it('should use camelCase for task fields', () => {
      const task = createTaskFixture();
      const dto = TaskMapper.toDTO(task);

      expect(dto).toHaveProperty('publisherId');
      expect(dto).toHaveProperty('bountyAmount');
      expect(dto).not.toHaveProperty('publisher_id');
      expect(dto).not.toHaveProperty('bounty_amount');
    });

    it('should handle null values in task fields', () => {
      const task = createTaskFixture({ assigneeId: null, groupId: null, parentId: null });
      const dto = TaskMapper.toDTO(task);

      expect(dto.assigneeId).toBeNull();
      expect(dto.groupId).toBeNull();
      expect(dto.parentId).toBeNull();
    });
  });

  describe('Group Response Structure', () => {
    it('should return group DTO with expected structure', () => {
      const group = createProjectGroupFixture({ id: '789', name: 'Test Group' });
      const dto = GroupMapper.toDTO(group);

      expect(dto).toHaveProperty('id');
      expect(dto).toHaveProperty('name');
      expect(dto).toHaveProperty('createdAt');
    });

    it('should use camelCase for group fields', () => {
      const group = createProjectGroupFixture();
      const dto = GroupMapper.toDTO(group);

      expect(dto).toHaveProperty('createdAt');
      expect(dto).not.toHaveProperty('created_at');
    });
  });

  describe('Position Response Structure', () => {
    it('should return position DTO with expected structure', () => {
      const position = createPositionFixture({ id: '999', name: 'Test Position' });
      const dto = PositionMapper.toDTO(position);

      expect(dto).toHaveProperty('id');
      expect(dto).toHaveProperty('name');
      expect(dto).toHaveProperty('requiredSkills');
    });

    it('should use camelCase for position fields', () => {
      const position = createPositionFixture();
      const dto = PositionMapper.toDTO(position);

      expect(dto).toHaveProperty('requiredSkills');
      expect(dto).not.toHaveProperty('required_skills');
    });
  });

  describe('Array Handling', () => {
    it('should handle arrays of users', () => {
      const users = [
        createUserFixture({ id: '1' }),
        createUserFixture({ id: '2' }),
      ];
      const responses = UserMapper.toUserResponseArray(users);

      expect(Array.isArray(responses)).toBe(true);
      expect(responses.length).toBe(2);
    });

    it('should handle arrays of tasks', () => {
      const tasks = [
        createTaskFixture({ id: '1' }),
        createTaskFixture({ id: '2' }),
      ];
      const dtos = TaskMapper.toDTOList(tasks);

      expect(Array.isArray(dtos)).toBe(true);
      expect(dtos.length).toBe(2);
    });

    it('should handle empty arrays', () => {
      expect(UserMapper.toUserResponseArray([])).toEqual([]);
      expect(TaskMapper.toDTOList([])).toEqual([]);
      expect(GroupMapper.toDTOList([])).toEqual([]);
      expect(PositionMapper.toDTOList([])).toEqual([]);
    });
  });

  describe('Data Type Consistency', () => {
    it('should maintain consistent ID types', () => {
      const user = createUserFixture();
      const task = createTaskFixture();
      const group = createProjectGroupFixture();
      const position = createPositionFixture();

      expect(typeof UserMapper.toUserResponse(user).id).toBe('string');
      expect(typeof TaskMapper.toDTO(task).id).toBe('string');
      expect(typeof GroupMapper.toDTO(group).id).toBe('string');
      expect(typeof PositionMapper.toDTO(position).id).toBe('string');
    });

    it('should handle numeric fields correctly', () => {
      const task = createTaskFixture({ bountyAmount: 100, progress: 50 });
      const dto = TaskMapper.toDTO(task);

      expect(typeof dto.bountyAmount).toBe('number');
      expect(typeof dto.progress).toBe('number');
      expect(dto.bountyAmount).toBe(100);
      expect(dto.progress).toBe(50);
    });

    it('should handle boolean fields correctly', () => {
      const task = createTaskFixture({ isExecutable: true, isBountySettled: false });
      const dto = TaskMapper.toDTO(task);

      expect(typeof dto.isExecutable).toBe('boolean');
      expect(typeof dto.isBountySettled).toBe('boolean');
      expect(dto.isExecutable).toBe(true);
      expect(dto.isBountySettled).toBe(false);
    });

    it('should handle array fields correctly', () => {
      const task = createTaskFixture({ tags: ['tag1', 'tag2'] });
      const position = createPositionFixture({ requiredSkills: ['skill1'] });

      const taskDto = TaskMapper.toDTO(task);
      const positionDto = PositionMapper.toDTO(position);

      expect(Array.isArray(taskDto.tags)).toBe(true);
      expect(Array.isArray(positionDto.requiredSkills)).toBe(true);
      expect(taskDto.tags).toEqual(['tag1', 'tag2']);
      expect(positionDto.requiredSkills).toEqual(['skill1']);
    });
  });
});
