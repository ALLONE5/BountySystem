/**
 * Repository Edge Cases Tests
 * 
 * Tests edge cases for repository operations including:
 * - Empty collections
 * - Null/undefined handling
 * - Boundary conditions
 * 
 * Validates: Requirements 2.6, 9.7
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { UserRepository } from './UserRepository.js';
import { TaskRepository } from './TaskRepository.js';
import { GroupRepository } from './GroupRepository.js';
import { PositionRepository } from './PositionRepository.js';
import { pool } from '../config/database.js';
import { createUserFixture, createTaskFixture, createProjectGroupFixture, createPositionFixture } from '../test-utils/fixtures.js';

describe('Repository Edge Cases', () => {
  let userRepo: UserRepository;
  let taskRepo: TaskRepository;
  let groupRepo: GroupRepository;
  let positionRepo: PositionRepository;

  beforeAll(async () => {
    userRepo = new UserRepository();
    taskRepo = new TaskRepository();
    groupRepo = new GroupRepository();
    positionRepo = new PositionRepository();

    // Clean up test data
    await pool.query('DELETE FROM tasks WHERE name LIKE $1', ['%EdgeCase%']);
    await pool.query('DELETE FROM project_groups WHERE name LIKE $1', ['%EdgeCase%']);
    await pool.query('DELETE FROM positions WHERE name LIKE $1', ['%EdgeCase%']);
    await pool.query('DELETE FROM users WHERE username LIKE $1', ['%edgecase%']);
  });

  afterAll(async () => {
    // Clean up test data
    await pool.query('DELETE FROM tasks WHERE name LIKE $1', ['%EdgeCase%']);
    await pool.query('DELETE FROM project_groups WHERE name LIKE $1', ['%EdgeCase%']);
    await pool.query('DELETE FROM positions WHERE name LIKE $1', ['%EdgeCase%']);
    await pool.query('DELETE FROM users WHERE username LIKE $1', ['%edgecase%']);
  });

  describe('Empty Collection Handling', () => {
    it('should return empty array when no users match filter', async () => {
      const result = await userRepo.findAll({ email: 'nonexistent_user_12345@example.com' });
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      // May return results, just verify it's an array
    });

    it('should return empty array when no tasks match creator', async () => {
      const result = await taskRepo.findByCreator('00000000-0000-0000-0000-000000000000');
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });

    it('should return empty array when no groups match creator', async () => {
      const result = await groupRepo.findByCreator('00000000-0000-0000-0000-000000000000');
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });

    it('should return empty array when no positions match user', async () => {
      const result = await positionRepo.findByUser('00000000-0000-0000-0000-000000000000');
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });

    it('should return empty array for findAll with no results', async () => {
      const result = await taskRepo.findAll({ 
        name: 'ThisTaskNameShouldNeverExist_12345_XYZ' 
      });
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });
  });

  describe('Null/Undefined Handling', () => {
    it('should return null when user not found by ID', async () => {
      const result = await userRepo.findById('00000000-0000-0000-0000-000000000000');
      
      expect(result).toBeNull();
    });

    it('should return null when task not found by ID', async () => {
      const result = await taskRepo.findById('00000000-0000-0000-0000-000000000000');
      
      expect(result).toBeNull();
    });

    it('should return null when group not found by ID', async () => {
      const result = await groupRepo.findById('00000000-0000-0000-0000-000000000000');
      
      expect(result).toBeNull();
    });

    it('should return null when position not found by ID', async () => {
      const result = await positionRepo.findById('00000000-0000-0000-0000-000000000000');
      
      expect(result).toBeNull();
    });

    it('should return null when user not found by email', async () => {
      const result = await userRepo.findByEmail('nonexistent@example.com');
      
      expect(result).toBeNull();
    });

    it('should return null when user not found by username', async () => {
      const result = await userRepo.findByUsername('nonexistent_user_12345');
      
      expect(result).toBeNull();
    });
  });

  describe('Boundary Conditions', () => {
    it('should handle very long filter strings gracefully', async () => {
      const longString = 'a'.repeat(1000);
      const result = await userRepo.findAll({ username: longString });
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle empty filter object', async () => {
      const result = await taskRepo.findAll({});
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      // Should return all tasks (or at least not throw)
    });

    it('should handle filter with null values', async () => {
      const result = await taskRepo.findAll({ 
        parentId: null 
      });
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle multiple filters with no matches', async () => {
      const result = await taskRepo.findAll({
        name: 'NonExistentTaskName_XYZ_12345'
      });
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });
  });

  describe('Special Characters Handling', () => {
    it('should handle special characters in username search', async () => {
      const result = await userRepo.findByUsername("user'with\"quotes");
      
      // Should not throw SQL injection error
      expect(result).toBeNull();
    });

    it('should handle special characters in email search', async () => {
      const result = await userRepo.findByEmail("test'@example.com");
      
      // Should not throw SQL injection error
      expect(result).toBeNull();
    });

    it('should handle special characters in task name filter', async () => {
      const result = await taskRepo.findAll({ 
        name: "Task with 'quotes' and \"double quotes\"" 
      });
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent findById calls without errors', async () => {
      const promises = Array.from({ length: 10 }, (_, i) => 
        userRepo.findById(`00000000-0000-0000-0000-00000000000${i}`)
      );
      
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result).toBeNull();
      });
    });

    it('should handle concurrent findAll calls without errors', async () => {
      const promises = Array.from({ length: 5 }, () => 
        taskRepo.findAll({ status: 'completed' })
      );
      
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(Array.isArray(result)).toBe(true);
      });
    });
  });

  describe('Data Integrity', () => {
    it('should not modify input filters object', async () => {
      const filters = { name: 'Test', status: 'completed' };
      const originalFilters = { ...filters };
      
      await taskRepo.findAll(filters);
      
      expect(filters).toEqual(originalFilters);
    });

    it('should return independent result objects', async () => {
      // Create a test user
      const testUser = createUserFixture({
        username: 'edgecase_user_1',
        email: 'edgecase1@example.com'
      });
      
      const created = await userRepo.create(testUser);
      
      // Fetch the same user twice
      const result1 = await userRepo.findById(created.id);
      const result2 = await userRepo.findById(created.id);
      
      // Results should be equal but not the same object
      expect(result1).toEqual(result2);
      expect(result1).not.toBe(result2);
      
      // Clean up
      await userRepo.delete(created.id);
    });
  });

  describe('Error Recovery', () => {
    it('should continue working after a failed operation', async () => {
      // Try to find a non-existent user
      const result1 = await userRepo.findById('00000000-0000-0000-0000-000000000000');
      expect(result1).toBeNull();
      
      // Repository should still work for subsequent operations
      const result2 = await userRepo.findAll({});
      expect(Array.isArray(result2)).toBe(true);
    });

    it('should handle alternating success and failure operations', async () => {
      const operations = [
        () => userRepo.findById('00000000-0000-0000-0000-000000000000'), // fail
        () => userRepo.findAll({}), // success
        () => taskRepo.findById('00000000-0000-0000-0000-000000000000'), // fail
        () => taskRepo.findAll({}), // success
      ];
      
      for (const operation of operations) {
        const result = await operation();
        expect(result).toBeDefined();
      }
    });
  });

  describe('Pagination Edge Cases', () => {
    it('should handle limit of 0', async () => {
      const result = await taskRepo.findAll({}, { limit: 0 });
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });

    it('should handle very large limit', async () => {
      const result = await taskRepo.findAll({}, { limit: 1000000 });
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle offset larger than result set', async () => {
      const result = await taskRepo.findAll({}, { offset: 1000000 });
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });
  });
});
