/**
 * Cache Service Tests
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { CacheService } from './CacheService';
import { redisClient, connectRedis, disconnectRedis } from '../config/redis';

describe('CacheService', () => {
  beforeAll(async () => {
    await connectRedis();
  });

  afterAll(async () => {
    await disconnectRedis();
  });

  beforeEach(async () => {
    // Clear cache before each test
    await CacheService.clearAll();
  });

  describe('Basic Operations', () => {
    it('should set and get a value', async () => {
      const key = 'test:key';
      const value = { data: 'test value' };

      await CacheService.set(key, value);
      const result = await CacheService.get(key);

      expect(result).toEqual(value);
    });

    it('should return null for non-existent key', async () => {
      const result = await CacheService.get('non:existent:key');
      expect(result).toBeNull();
    });

    it('should delete a value', async () => {
      const key = 'test:delete';
      const value = { data: 'to be deleted' };

      await CacheService.set(key, value);
      await CacheService.delete(key);
      const result = await CacheService.get(key);

      expect(result).toBeNull();
    });

    it('should check if key exists', async () => {
      const key = 'test:exists';
      const value = { data: 'exists' };

      await CacheService.set(key, value);
      const exists = await CacheService.exists(key);

      expect(exists).toBe(true);
    });

    it('should delete keys matching pattern', async () => {
      await CacheService.set('pattern:1', { data: '1' });
      await CacheService.set('pattern:2', { data: '2' });
      await CacheService.set('other:1', { data: '3' });

      await CacheService.deletePattern('pattern:*');

      const result1 = await CacheService.get('pattern:1');
      const result2 = await CacheService.get('pattern:2');
      const result3 = await CacheService.get('other:1');

      expect(result1).toBeNull();
      expect(result2).toBeNull();
      expect(result3).not.toBeNull();
    });
  });

  describe('Session Caching', () => {
    it('should set and get session', async () => {
      const userId = 'user-123';
      const sessionData = { token: 'abc123', role: 'user' };

      await CacheService.setSession(userId, sessionData);
      const result = await CacheService.getSession(userId);

      expect(result).toEqual(sessionData);
    });

    it('should delete session', async () => {
      const userId = 'user-456';
      const sessionData = { token: 'def456' };

      await CacheService.setSession(userId, sessionData);
      await CacheService.deleteSession(userId);
      const result = await CacheService.getSession(userId);

      expect(result).toBeNull();
    });
  });

  describe('Task List Caching', () => {
    it('should cache and retrieve task list', async () => {
      const userId = 'user-789';
      const tasks = [
        { id: 'task-1', name: 'Task 1' },
        { id: 'task-2', name: 'Task 2' },
      ];

      await CacheService.setTaskList(userId, 'publisher', tasks);
      const result = await CacheService.getTaskList(userId, 'publisher');

      expect(result).toEqual(tasks);
    });

    it('should invalidate task list for user', async () => {
      const userId = 'user-abc';
      const tasks = [{ id: 'task-1', name: 'Task 1' }];

      await CacheService.setTaskList(userId, 'publisher', tasks);
      await CacheService.setTaskList(userId, 'assignee', tasks);
      await CacheService.invalidateTaskList(userId);

      const result1 = await CacheService.getTaskList(userId, 'publisher');
      const result2 = await CacheService.getTaskList(userId, 'assignee');

      expect(result1).toBeNull();
      expect(result2).toBeNull();
    });
  });

  describe('Ranking Caching', () => {
    it('should cache and retrieve rankings', async () => {
      const rankings = [
        { userId: 'user-1', rank: 1, totalBounty: 1000 },
        { userId: 'user-2', rank: 2, totalBounty: 800 },
      ];

      await CacheService.setRanking('monthly', 2024, 12, null, rankings);
      const result = await CacheService.getRanking('monthly', 2024, 12, null);

      expect(result).toEqual(rankings);
    });

    it('should invalidate all rankings', async () => {
      const rankings = [{ userId: 'user-1', rank: 1, totalBounty: 1000 }];

      await CacheService.setRanking('monthly', 2024, 12, null, rankings);
      await CacheService.setRanking('quarterly', 2024, null, 4, rankings);
      await CacheService.invalidateRankings();

      const result1 = await CacheService.getRanking('monthly', 2024, 12, null);
      const result2 = await CacheService.getRanking('quarterly', 2024, null, 4);

      expect(result1).toBeNull();
      expect(result2).toBeNull();
    });
  });

  describe('User Profile Caching', () => {
    it('should cache and retrieve user profile', async () => {
      const userId = 'user-profile-1';
      const profile = {
        id: userId,
        username: 'testuser',
        email: 'test@example.com',
      };

      await CacheService.setUserProfile(userId, profile);
      const result = await CacheService.getUserProfile(userId);

      expect(result).toEqual(profile);
    });

    it('should invalidate user profile', async () => {
      const userId = 'user-profile-2';
      const profile = { id: userId, username: 'testuser' };

      await CacheService.setUserProfile(userId, profile);
      await CacheService.invalidateUserProfile(userId);
      const result = await CacheService.getUserProfile(userId);

      expect(result).toBeNull();
    });
  });

  describe('Avatar Caching', () => {
    it('should cache and retrieve user avatars', async () => {
      const userId = 'user-avatar-1';
      const avatars = [
        { id: 'avatar-1', name: 'Basic', requiredRank: 100 },
        { id: 'avatar-2', name: 'Silver', requiredRank: 50 },
      ];

      await CacheService.setUserAvatars(userId, avatars);
      const result = await CacheService.getUserAvatars(userId);

      expect(result).toEqual(avatars);
    });

    it('should invalidate all user avatars', async () => {
      const userId1 = 'user-avatar-2';
      const userId2 = 'user-avatar-3';
      const avatars = [{ id: 'avatar-1', name: 'Basic' }];

      await CacheService.setUserAvatars(userId1, avatars);
      await CacheService.setUserAvatars(userId2, avatars);
      await CacheService.invalidateAllAvatars();

      const result1 = await CacheService.getUserAvatars(userId1);
      const result2 = await CacheService.getUserAvatars(userId2);

      expect(result1).toBeNull();
      expect(result2).toBeNull();
    });
  });

  describe('Bounty Algorithm Caching', () => {
    it('should cache and retrieve bounty algorithm', async () => {
      const algorithm = {
        version: '1.0',
        baseAmount: 100,
        urgencyWeight: 0.3,
        importanceWeight: 0.4,
        durationWeight: 0.3,
      };

      await CacheService.setBountyAlgorithm(algorithm);
      const result = await CacheService.getBountyAlgorithm();

      expect(result).toEqual(algorithm);
    });

    it('should invalidate bounty algorithm', async () => {
      const algorithm = { version: '1.0', baseAmount: 100 };

      await CacheService.setBountyAlgorithm(algorithm);
      await CacheService.invalidateBountyAlgorithm();
      const result = await CacheService.getBountyAlgorithm();

      expect(result).toBeNull();
    });
  });
});
