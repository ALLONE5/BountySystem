import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Pool } from 'pg';
import { RankingService } from './RankingService';
import { UserService } from './UserService';
import { TaskService } from './TaskService';
import { RankingPeriod } from '../models/Ranking';
import { TaskStatus } from '../models/Task';
import { cleanupAllTestData } from '../test-utils/cleanup.js';

describe('RankingService', () => {
  let pool: Pool;
  let rankingService: RankingService;
  let userService: UserService;
  let taskService: TaskService;
  let testUserIds: string[] = [];
  let testTaskIds: string[] = [];

  beforeEach(async () => {
    pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'bounty_hunter',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
    });

    rankingService = new RankingService(pool);
    userService = new UserService(userRepository, permissionChecker);
    taskService = new TaskService();

    // Create test users
    const user1 = await userService.createUser({
      username: `rank_user1_${Date.now()}`,
      email: `rank1_${Date.now()}@test.com`,
      password: 'password123',
    });
    const user2 = await userService.createUser({
      username: `rank_user2_${Date.now()}`,
      email: `rank2_${Date.now()}@test.com`,
      password: 'password123',
    });
    const user3 = await userService.createUser({
      username: `rank_user3_${Date.now()}`,
      email: `rank3_${Date.now()}@test.com`,
      password: 'password123',
    });

    testUserIds = [user1.id, user2.id, user3.id];

    // Create completed tasks with different bounties
    const task1 = await taskService.createTask({
      name: 'Task 1',
      description: 'Test task 1',
      publisherId: user1.id,
      estimatedHours: 5,
      complexity: 3,
      priority: 3,
    });
    await taskService.updateTask(task1.id, {
      assigneeId: user1.id,
      status: TaskStatus.IN_PROGRESS,
    });
    await taskService.updateTask(task1.id, {
      status: TaskStatus.COMPLETED,
    });

    const task2 = await taskService.createTask({
      name: 'Task 2',
      description: 'Test task 2',
      publisherId: user2.id,
      estimatedHours: 10,
      complexity: 5,
      priority: 5,
    });
    await taskService.updateTask(task2.id, {
      assigneeId: user2.id,
      status: TaskStatus.IN_PROGRESS,
    });
    await taskService.updateTask(task2.id, {
      status: TaskStatus.COMPLETED,
    });

    const task3 = await taskService.createTask({
      name: 'Task 3',
      description: 'Test task 3',
      publisherId: user3.id,
      estimatedHours: 3,
      complexity: 2,
      priority: 2,
    });
    await taskService.updateTask(task3.id, {
      assigneeId: user3.id,
      status: TaskStatus.IN_PROGRESS,
    });
    await taskService.updateTask(task3.id, {
      status: TaskStatus.COMPLETED,
    });

    testTaskIds = [task1.id, task2.id, task3.id];
  });

  afterEach(async () => {
    // Clean up all test data in correct order to avoid foreign key violations
    await cleanupAllTestData();
  });

  it('should calculate monthly rankings', async () => {
    const now = new Date();
    const rankings = await rankingService.calculateRankings(
      RankingPeriod.MONTHLY,
      now.getFullYear(),
      now.getMonth() + 1
    );

    expect(rankings).toBeDefined();
    expect(rankings.length).toBeGreaterThan(0);
    
    // Rankings should be ordered by bounty (descending)
    for (let i = 0; i < rankings.length - 1; i++) {
      expect(rankings[i].totalBounty).toBeGreaterThanOrEqual(
        rankings[i + 1].totalBounty
      );
      expect(rankings[i].rank).toBe(i + 1);
    }
  });

  it('should calculate quarterly rankings', async () => {
    const now = new Date();
    const quarter = Math.floor(now.getMonth() / 3) + 1;
    const rankings = await rankingService.calculateRankings(
      RankingPeriod.QUARTERLY,
      now.getFullYear(),
      undefined,
      quarter
    );

    expect(rankings).toBeDefined();
    expect(rankings.length).toBeGreaterThan(0);
    
    // Verify quarter is set correctly
    rankings.forEach((ranking) => {
      expect(ranking.quarter).toBe(quarter);
      expect(ranking.month).toBeNull();
    });
  });

  it('should calculate all-time rankings', async () => {
    const now = new Date();
    const rankings = await rankingService.calculateRankings(
      RankingPeriod.ALL_TIME,
      now.getFullYear()
    );

    expect(rankings).toBeDefined();
    expect(rankings.length).toBeGreaterThan(0);
    
    // Verify all-time rankings have no month or quarter
    rankings.forEach((ranking) => {
      expect(ranking.month).toBeNull();
      expect(ranking.quarter).toBeNull();
    });
  });

  it('should get rankings with user info', async () => {
    const now = new Date();
    await rankingService.calculateRankings(
      RankingPeriod.MONTHLY,
      now.getFullYear(),
      now.getMonth() + 1
    );

    const rankings = await rankingService.getRankings({
      period: RankingPeriod.MONTHLY,
      year: now.getFullYear(),
      month: now.getMonth() + 1,
    });

    expect(rankings).toBeDefined();
    expect(rankings.length).toBeGreaterThan(0);
    
    // Verify user info is included
    rankings.forEach((ranking) => {
      expect(ranking.userId).toBeDefined();
      expect(ranking.username).toBeDefined();
      expect(ranking.totalBounty).toBeGreaterThanOrEqual(0);
      expect(ranking.rank).toBeGreaterThan(0);
    });
  });

  it('should get user-specific ranking', async () => {
    const now = new Date();
    await rankingService.calculateRankings(
      RankingPeriod.MONTHLY,
      now.getFullYear(),
      now.getMonth() + 1
    );

    const userRanking = await rankingService.getUserRanking(
      testUserIds[0],
      RankingPeriod.MONTHLY,
      now.getFullYear(),
      now.getMonth() + 1
    );

    expect(userRanking).toBeDefined();
    expect(userRanking?.userId).toBe(testUserIds[0]);
    expect(userRanking?.rank).toBeGreaterThan(0);
  });

  it('should update all rankings at once', async () => {
    const result = await rankingService.updateAllRankings();

    expect(result.monthly).toBeDefined();
    expect(result.quarterly).toBeDefined();
    expect(result.allTime).toBeDefined();
    
    expect(result.monthly.length).toBeGreaterThan(0);
    expect(result.quarterly.length).toBeGreaterThan(0);
    expect(result.allTime.length).toBeGreaterThan(0);
  });

  it('should handle empty rankings gracefully', async () => {
    // Calculate rankings for a future month with no completed tasks
    const rankings = await rankingService.calculateRankings(
      RankingPeriod.MONTHLY,
      2099,
      12
    );

    expect(rankings).toBeDefined();
    expect(rankings.length).toBe(0);
  });

  it('should replace existing rankings when recalculating', async () => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    // Calculate rankings first time
    const firstRankings = await rankingService.calculateRankings(
      RankingPeriod.MONTHLY,
      year,
      month
    );

    // Calculate again
    const secondRankings = await rankingService.calculateRankings(
      RankingPeriod.MONTHLY,
      year,
      month
    );

    // Should have same number of rankings
    expect(secondRankings.length).toBe(firstRankings.length);
    
    // Verify no duplicates in database
    const dbRankings = await rankingService.getRankings({
      period: RankingPeriod.MONTHLY,
      year,
      month,
    });
    
    const userIds = dbRankings.map((r) => r.userId);
    const uniqueUserIds = new Set(userIds);
    expect(userIds.length).toBe(uniqueUserIds.size);
  });
});
