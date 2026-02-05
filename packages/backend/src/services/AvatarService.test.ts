import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Pool } from 'pg';
import { AvatarService } from './AvatarService';
import { RankingService } from './RankingService';
import { UserService } from './UserService';
import { TaskService } from './TaskService';
import { RankingPeriod } from '../models/Ranking';
import { TaskStatus } from '../models/Task';
import { cleanupAllTestData } from '../test-utils/cleanup.js';

describe('AvatarService', () => {
  let pool: Pool;
  let avatarService: AvatarService;
  let rankingService: RankingService;
  let userService: UserService;
  let taskService: TaskService;
  let testAvatarIds: string[] = [];
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

    avatarService = new AvatarService(pool);
    rankingService = new RankingService(pool);
    userService = new UserService();
    taskService = new TaskService();

    // Create test avatars with different rank requirements
    const avatar1 = await avatarService.createAvatar({
      name: 'Bronze Avatar',
      imageUrl: '/avatars/bronze.png',
      requiredRank: 100,
    });
    const avatar2 = await avatarService.createAvatar({
      name: 'Silver Avatar',
      imageUrl: '/avatars/silver.png',
      requiredRank: 50,
    });
    const avatar3 = await avatarService.createAvatar({
      name: 'Gold Avatar',
      imageUrl: '/avatars/gold.png',
      requiredRank: 10,
    });
    const avatar4 = await avatarService.createAvatar({
      name: 'Platinum Avatar',
      imageUrl: '/avatars/platinum.png',
      requiredRank: 1,
    });

    testAvatarIds = [avatar1.id, avatar2.id, avatar3.id, avatar4.id];

    // Create test users
    const user1 = await userService.createUser({
      username: `avatar_user1_${Date.now()}`,
      email: `avatar1_${Date.now()}@test.com`,
      password: 'password123',
    });
    const user2 = await userService.createUser({
      username: `avatar_user2_${Date.now()}`,
      email: `avatar2_${Date.now()}@test.com`,
      password: 'password123',
    });

    testUserIds = [user1.id, user2.id];
  });

  afterEach(async () => {
    // Clean up all test data in correct order to avoid foreign key violations
    await cleanupAllTestData();
  });

  it('should create an avatar', async () => {
    const avatar = await avatarService.createAvatar({
      name: 'Test Avatar',
      imageUrl: '/avatars/test.png',
      requiredRank: 25,
    });

    expect(avatar).toBeDefined();
    expect(avatar.id).toBeDefined();
    expect(avatar.name).toBe('Test Avatar');
    expect(avatar.imageUrl).toBe('/avatars/test.png');
    expect(avatar.requiredRank).toBe(25);

    testAvatarIds.push(avatar.id);
  });

  it('should get avatar by ID', async () => {
    const avatar = await avatarService.getAvatarById(testAvatarIds[0]);

    expect(avatar).toBeDefined();
    expect(avatar?.id).toBe(testAvatarIds[0]);
    expect(avatar?.name).toBe('Bronze Avatar');
  });

  it('should get all avatars', async () => {
    const avatars = await avatarService.getAllAvatars();

    expect(avatars).toBeDefined();
    expect(avatars.length).toBeGreaterThanOrEqual(4);
    
    // Should be ordered by required_rank
    for (let i = 0; i < avatars.length - 1; i++) {
      expect(avatars[i].requiredRank).toBeLessThanOrEqual(
        avatars[i + 1].requiredRank
      );
    }
  });

  it('should update avatar', async () => {
    const updated = await avatarService.updateAvatar(testAvatarIds[0], {
      name: 'Updated Bronze Avatar',
      requiredRank: 90,
    });

    expect(updated.name).toBe('Updated Bronze Avatar');
    expect(updated.requiredRank).toBe(90);
  });

  it('should delete avatar', async () => {
    const avatar = await avatarService.createAvatar({
      name: 'To Delete',
      imageUrl: '/avatars/delete.png',
      requiredRank: 200,
    });

    await avatarService.deleteAvatar(avatar.id);

    const deleted = await avatarService.getAvatarById(avatar.id);
    expect(deleted).toBeNull();
  });

  it('should get available avatars for user based on ranking', async () => {
    // Create tasks and rankings for user
    const task = await taskService.createTask({
      name: 'Test Task',
      description: 'Test',
      publisherId: testUserIds[0],
      estimatedHours: 5,
      complexity: 3,
      priority: 3,
    });
    testTaskIds.push(task.id);

    await taskService.updateTask(task.id, {
      assigneeId: testUserIds[0],
      status: TaskStatus.IN_PROGRESS,
    });
    await taskService.updateTask(task.id, {
      status: TaskStatus.COMPLETED,
    });

    // Calculate rankings
    const now = new Date();
    const lastMonth = now.getMonth() === 0 ? 12 : now.getMonth();
    const lastMonthYear =
      now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

    await rankingService.calculateRankings(
      RankingPeriod.MONTHLY,
      lastMonthYear,
      lastMonth
    );

    // Get available avatars
    const availableAvatars = await avatarService.getAvailableAvatarsForUser(
      testUserIds[0]
    );

    expect(availableAvatars).toBeDefined();
    expect(availableAvatars.length).toBeGreaterThan(0);
  });

  it('should allow user to select unlocked avatar', async () => {
    // User with no ranking should be able to select any avatar (new user)
    await avatarService.selectAvatarForUser(testUserIds[0], testAvatarIds[0]);

    const userAvatar = await avatarService.getUserAvatar(testUserIds[0]);
    expect(userAvatar).toBeDefined();
    expect(userAvatar?.id).toBe(testAvatarIds[0]);
  });

  it('should prevent user from selecting locked avatar', async () => {
    // Create a high-ranking user (rank 1)
    const task = await taskService.createTask({
      name: 'High Bounty Task',
      description: 'Test',
      publisherId: testUserIds[0],
      estimatedHours: 20,
      complexity: 5,
      priority: 5,
    });
    testTaskIds.push(task.id);

    await taskService.updateTask(task.id, {
      assigneeId: testUserIds[0],
      status: TaskStatus.IN_PROGRESS,
    });
    await taskService.updateTask(task.id, {
      status: TaskStatus.COMPLETED,
    });

    // Create a low-ranking user (rank 2)
    const task2 = await taskService.createTask({
      name: 'Low Bounty Task',
      description: 'Test',
      publisherId: testUserIds[1],
      estimatedHours: 1,
      complexity: 1,
      priority: 1,
    });
    testTaskIds.push(task2.id);

    await taskService.updateTask(task2.id, {
      assigneeId: testUserIds[1],
      status: TaskStatus.IN_PROGRESS,
    });
    await taskService.updateTask(task2.id, {
      status: TaskStatus.COMPLETED,
    });

    // Calculate rankings
    const now = new Date();
    const lastMonth = now.getMonth() === 0 ? 12 : now.getMonth();
    const lastMonthYear =
      now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

    await rankingService.calculateRankings(
      RankingPeriod.MONTHLY,
      lastMonthYear,
      lastMonth
    );

    // User 2 (rank 2) should not be able to select Platinum avatar (rank 1 required)
    const canSelect = await avatarService.canUserSelectAvatar(
      testUserIds[1],
      testAvatarIds[3]
    );

    expect(canSelect).toBe(false);
  });

  it('should get user current avatar', async () => {
    await avatarService.selectAvatarForUser(testUserIds[0], testAvatarIds[1]);

    const avatar = await avatarService.getUserAvatar(testUserIds[0]);
    expect(avatar).toBeDefined();
    expect(avatar?.id).toBe(testAvatarIds[1]);
    expect(avatar?.name).toBe('Silver Avatar');
  });

  it('should return null for user with no avatar', async () => {
    const avatar = await avatarService.getUserAvatar(testUserIds[1]);
    expect(avatar).toBeNull();
  });
});
