import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { UserMapper } from '../utils/mappers/UserMapper.js';
import { TaskMapper } from '../utils/mappers/TaskMapper.js';
import { GroupMapper } from '../utils/mappers/GroupMapper.js';
import { PositionMapper } from '../utils/mappers/PositionMapper.js';
import { userArbitrary, taskArbitrary, projectGroupArbitrary, positionArbitrary } from '../test-utils/generators.js';

/**
 * Property-Based Test for API Backward Compatibility
 * Feature: backend-refactoring, Property 10: API Backward Compatibility
 * 
 * Tests that API responses match pre-refactoring format for all valid inputs.
 * Requirements: 6.7
 */

describe('Property 10: API Backward Compatibility', () => {
  // Feature: backend-refactoring, Property 10: API Backward Compatibility
  it('should maintain consistent response structure for all users', () => {
    fc.assert(
      fc.property(userArbitrary, (user) => {
        const response = UserMapper.toUserResponse(user);
        
        // Required fields must be present
        expect(response).toHaveProperty('id');
        expect(response).toHaveProperty('username');
        expect(response).toHaveProperty('email');
        expect(response).toHaveProperty('role');
        
        // Sensitive fields must not be exposed
        expect(response).not.toHaveProperty('password');
        expect(response).not.toHaveProperty('passwordHash');
        expect(response).not.toHaveProperty('password_hash');
        
        // Field naming must be camelCase
        expect(response).toHaveProperty('createdAt');
        expect(response).not.toHaveProperty('created_at');
        
        // Data types must be consistent
        expect(typeof response.id).toBe('string');
        expect(typeof response.username).toBe('string');
        expect(typeof response.email).toBe('string');
      }),
      { numRuns: 100 }
    );
  });

  // Feature: backend-refactoring, Property 10: API Backward Compatibility
  it('should maintain consistent response structure for all tasks', () => {
    fc.assert(
      fc.property(taskArbitrary, (task) => {
        const dto = TaskMapper.toDTO(task);
        
        // Required fields must be present
        expect(dto).toHaveProperty('id');
        expect(dto).toHaveProperty('name');
        expect(dto).toHaveProperty('status');
        expect(dto).toHaveProperty('publisherId');
        
        // Field naming must be camelCase
        expect(dto).toHaveProperty('publisherId');
        expect(dto).toHaveProperty('bountyAmount');
        expect(dto).toHaveProperty('createdAt');
        expect(dto).not.toHaveProperty('publisher_id');
        expect(dto).not.toHaveProperty('bounty_amount');
        expect(dto).not.toHaveProperty('created_at');
        
        // Data types must be consistent
        expect(typeof dto.id).toBe('string');
        expect(typeof dto.name).toBe('string');
        expect(typeof dto.publisherId).toBe('string');
        expect(typeof dto.bountyAmount).toBe('number');
      }),
      { numRuns: 100 }
    );
  });

  // Feature: backend-refactoring, Property 10: API Backward Compatibility
  it('should maintain consistent response structure for all groups', () => {
    fc.assert(
      fc.property(projectGroupArbitrary, (group) => {
        const dto = GroupMapper.toDTO(group);
        
        // Required fields must be present
        expect(dto).toHaveProperty('id');
        expect(dto).toHaveProperty('name');
        
        // Field naming must be camelCase
        expect(dto).toHaveProperty('createdAt');
        expect(dto).not.toHaveProperty('created_at');
        
        // Data types must be consistent
        expect(typeof dto.id).toBe('string');
        expect(typeof dto.name).toBe('string');
      }),
      { numRuns: 100 }
    );
  });

  // Feature: backend-refactoring, Property 10: API Backward Compatibility
  it('should maintain consistent response structure for all positions', () => {
    fc.assert(
      fc.property(positionArbitrary, (position) => {
        const dto = PositionMapper.toDTO(position);
        
        // Required fields must be present
        expect(dto).toHaveProperty('id');
        expect(dto).toHaveProperty('name');
        expect(dto).toHaveProperty('requiredSkills');
        
        // Field naming must be camelCase
        expect(dto).toHaveProperty('requiredSkills');
        expect(dto).toHaveProperty('createdAt');
        expect(dto).not.toHaveProperty('required_skills');
        expect(dto).not.toHaveProperty('created_at');
        
        // Data types must be consistent
        expect(typeof dto.id).toBe('string');
        expect(typeof dto.name).toBe('string');
        expect(Array.isArray(dto.requiredSkills)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  // Feature: backend-refactoring, Property 10: API Backward Compatibility
  it('should handle arrays consistently for all mappers', () => {
    fc.assert(
      fc.property(
        fc.array(userArbitrary, { minLength: 0, maxLength: 10 }),
        fc.array(taskArbitrary, { minLength: 0, maxLength: 10 }),
        (users, tasks) => {
          const userResponses = UserMapper.toUserResponseArray(users);
          const taskDtos = TaskMapper.toDTOList(tasks);
          
          // Arrays must maintain length
          expect(userResponses.length).toBe(users.length);
          expect(taskDtos.length).toBe(tasks.length);
          
          // All items must be properly mapped
          userResponses.forEach((response) => {
            expect(response).toHaveProperty('id');
            expect(response).not.toHaveProperty('passwordHash');
          });
          
          taskDtos.forEach((dto) => {
            expect(dto).toHaveProperty('id');
            expect(dto).toHaveProperty('publisherId');
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
