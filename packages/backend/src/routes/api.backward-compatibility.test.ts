import { describe, it, expect } from 'vitest';
import { createUserFixture, createTaskFixture, createProjectGroupFixture, createPositionFixture } from '../test-utils/fixtures.js';
import { UserMapper } from '../utils/mappers/UserMapper.js';
import { TaskMapper } from '../utils/mappers/TaskMapper.js';
import { GroupMapper } from '../utils/mappers/GroupMapper.js';
import { PositionMapper } from '../utils/mappers/PositionMapper.js';

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
    });
  });

  describe('Data Type Consistency', () => {
    it('should maintain consistent ID types', () => {
      const user = createUserFixture();
      const task = createTaskFixture();
      expect(typeof UserMapper.toUserResponse(user).id).toBe('string');
      expect(typeof TaskMapper.toDTO(task).id).toBe('string');
    });

    it('should handle numeric fields correctly', () => {
      const task = createTaskFixture({ bountyAmount: 100 });
      const dto = TaskMapper.toDTO(task);
      expect(typeof dto.bountyAmount).toBe('number');
      expect(dto.bountyAmount).toBe(100);
    });
  });

  describe('Security', () => {
    it('should never expose password hash', () => {
      const user = createUserFixture({ passwordHash: 'secret' });
      const response = UserMapper.toUserResponse(user);
      expect(response).not.toHaveProperty('passwordHash');
    });
  });
});
