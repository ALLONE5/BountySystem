import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { GroupService } from './GroupService.js';
import { pool } from '../config/database.js';
import { UserRepository } from '../repositories/UserRepository.js';
import { TaskRepository } from '../repositories/TaskRepository.js';
import { GroupRepository } from '../repositories/GroupRepository.js';
import { PositionRepository } from '../repositories/PositionRepository.js';
import { PermissionChecker } from '../utils/PermissionChecker.js';
import { AuthorizationError, NotFoundError, ValidationError, OwnershipError } from '../utils/errors.js';
import { UserRole } from '../models/User.js';

describe('GroupService', () => {
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
  const groupService = new GroupService(groupRepository, permissionChecker);
  
  let testUserId: string;
  let testUser2Id: string;
  let testGroupId: string;

  beforeAll(async () => {
    // Clean up test data
    await pool.query("DELETE FROM group_members WHERE group_id IN (SELECT id FROM task_groups WHERE name LIKE 'Test Group%')");
    await pool.query("DELETE FROM task_groups WHERE name LIKE 'Test Group%'");
    await pool.query("DELETE FROM users WHERE email LIKE 'testgroup%@example.com'");
    
    // Create test users
    const user1Result = await pool.query(`
      INSERT INTO users (username, email, password_hash, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `, ['testgroupuser1', 'testgroup1@example.com', 'hash123', UserRole.USER]);
    testUserId = user1Result.rows[0].id;

    const user2Result = await pool.query(`
      INSERT INTO users (username, email, password_hash, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `, ['testgroupuser2', 'testgroup2@example.com', 'hash123', UserRole.USER]);
    testUser2Id = user2Result.rows[0].id;
  });

  afterAll(async () => {
    // Clean up test data
    await pool.query("DELETE FROM group_members WHERE group_id IN (SELECT id FROM task_groups WHERE name LIKE 'Test Group%')");
    await pool.query("DELETE FROM task_groups WHERE name LIKE 'Test Group%'");
    await pool.query("DELETE FROM users WHERE email LIKE 'testgroup%@example.com'");
  });

  describe('Refactored GroupService Integration Tests', () => {
    describe('createGroup', () => {
      it('should create a new group using repository and return DTO', async () => {
        const groupData = {
          name: 'Test Group 1',
          creatorId: testUserId,
        };

        const group = await groupService.createGroup(groupData);

        expect(group).toBeDefined();
        expect(group.id).toBeDefined();
        expect(group.name).toBe('Test Group 1');
        expect(group.creatorId).toBe(testUserId);
        expect(group.createdAt).toBeDefined();
        expect(group.updatedAt).toBeDefined();

        testGroupId = group.id;
      });

      it('should automatically add creator as member', async () => {
        const isMember = await groupService.isMember(testGroupId, testUserId);
        expect(isMember).toBe(true);
      });
    });

    describe('getGroup', () => {
      it('should get group by ID using repository and return DTO', async () => {
        const group = await groupService.getGroup(testGroupId);

        expect(group).toBeDefined();
        expect(group.id).toBe(testGroupId);
        expect(group.name).toBe('Test Group 1');
        expect(group.creatorId).toBe(testUserId);
      });

      it('should return null for non-existent group', async () => {
        const group = await groupService.getGroup('00000000-0000-0000-0000-000000000000');
        expect(group).toBeNull();
      });
    });

    describe('getGroupWithMembers', () => {
      it('should get group with members using repository', async () => {
        const groupWithMembers = await groupService.getGroupWithMembers(testGroupId);

        expect(groupWithMembers).toBeDefined();
        expect(groupWithMembers.id).toBe(testGroupId);
        expect(groupWithMembers.members).toBeDefined();
        expect(Array.isArray(groupWithMembers.members)).toBe(true);
        expect(groupWithMembers.members.length).toBeGreaterThan(0);
        expect(groupWithMembers.members[0].userId).toBe(testUserId);
      });
    });

    describe('addMember', () => {
      it('should add member to group using repository', async () => {
        const member = await groupService.addMember(testGroupId, testUser2Id);

        expect(member).toBeDefined();
        expect(member.groupId).toBe(testGroupId);
        expect(member.userId).toBe(testUser2Id);
        expect(member.joinedAt).toBeDefined();
      });

      it('should throw ValidationError when adding existing member', async () => {
        await expect(
          groupService.addMember(testGroupId, testUser2Id)
        ).rejects.toThrow(ValidationError);
      });

      it('should throw NotFoundError for non-existent group', async () => {
        await expect(
          groupService.addMember('00000000-0000-0000-0000-000000000000', testUser2Id)
        ).rejects.toThrow(NotFoundError);
      });
    });

    describe('getGroupMembers', () => {
      it('should get all group members using repository', async () => {
        const members = await groupService.getGroupMembers(testGroupId);

        expect(members).toBeDefined();
        expect(Array.isArray(members)).toBe(true);
        expect(members.length).toBe(2); // Creator + added member
        
        const userIds = members.map(m => m.userId);
        expect(userIds).toContain(testUserId);
        expect(userIds).toContain(testUser2Id);
      });
    });

    describe('isMember', () => {
      it('should check membership using repository', async () => {
        const isMember1 = await groupService.isMember(testGroupId, testUserId);
        const isMember2 = await groupService.isMember(testGroupId, testUser2Id);

        expect(isMember1).toBe(true);
        expect(isMember2).toBe(true);
      });

      it('should return false for non-member', async () => {
        // Create another user
        const user3Result = await pool.query(`
          INSERT INTO users (username, email, password_hash, role)
          VALUES ($1, $2, $3, $4)
          RETURNING id
        `, ['testgroupuser3', 'testgroup3@example.com', 'hash123', UserRole.USER]);
        const user3Id = user3Result.rows[0].id;

        const isMember = await groupService.isMember(testGroupId, user3Id);
        expect(isMember).toBe(false);

        // Clean up
        await pool.query("DELETE FROM users WHERE id = $1", [user3Id]);
      });
    });

    describe('getUserGroups', () => {
      it('should get all groups user is member of using repository', async () => {
        const groups = await groupService.getUserGroups(testUserId);

        expect(groups).toBeDefined();
        expect(Array.isArray(groups)).toBe(true);
        expect(groups.length).toBeGreaterThan(0);
        
        const groupIds = groups.map(g => g.id);
        expect(groupIds).toContain(testGroupId);
      });

      it('should include members in group data', async () => {
        const groups = await groupService.getUserGroups(testUserId);
        const testGroup = groups.find(g => g.id === testGroupId);

        expect(testGroup).toBeDefined();
        expect(testGroup.members).toBeDefined();
        expect(Array.isArray(testGroup.members)).toBe(true);
        expect(testGroup.memberIds).toBeDefined();
        expect(Array.isArray(testGroup.memberIds)).toBe(true);
      });
    });

    describe('updateGroup', () => {
      it('should update group name using repository', async () => {
        const updatedGroup = await groupService.updateGroup(testGroupId, 'Updated Test Group', testUserId);

        expect(updatedGroup).toBeDefined();
        expect(updatedGroup.name).toBe('Updated Test Group');
        expect(updatedGroup.id).toBe(testGroupId);
      });

      it('should throw OwnershipError when non-creator tries to update', async () => {
        await expect(
          groupService.updateGroup(testGroupId, 'Unauthorized Update', testUser2Id)
        ).rejects.toThrow(OwnershipError);
      });

      it('should throw NotFoundError for non-existent group', async () => {
        await expect(
          groupService.updateGroup('00000000-0000-0000-0000-000000000000', 'Test', testUserId)
        ).rejects.toThrow(NotFoundError);
      });
    });

    describe('removeMember', () => {
      it('should remove member from group using repository', async () => {
        await groupService.removeMember(testGroupId, testUser2Id);

        const isMember = await groupService.isMember(testGroupId, testUser2Id);
        expect(isMember).toBe(false);
      });

      it('should throw ValidationError when removing non-member', async () => {
        await expect(
          groupService.removeMember(testGroupId, testUser2Id)
        ).rejects.toThrow(ValidationError);
      });

      it('should throw ValidationError when removing last member (creator)', async () => {
        await expect(
          groupService.removeMember(testGroupId, testUserId)
        ).rejects.toThrow(ValidationError);
      });

      it('should throw NotFoundError for non-existent group', async () => {
        await expect(
          groupService.removeMember('00000000-0000-0000-0000-000000000000', testUserId)
        ).rejects.toThrow(NotFoundError);
      });
    });

    describe('deleteGroup', () => {
      it('should throw OwnershipError when non-creator tries to delete', async () => {
        // Add user2 back as member
        await groupService.addMember(testGroupId, testUser2Id);

        await expect(
          groupService.deleteGroup(testGroupId, testUser2Id)
        ).rejects.toThrow(OwnershipError);
      });

      it('should delete group using repository when creator deletes', async () => {
        await groupService.deleteGroup(testGroupId, testUserId);

        const group = await groupService.getGroup(testGroupId);
        expect(group).toBeNull();
      });

      it('should throw NotFoundError for non-existent group', async () => {
        await expect(
          groupService.deleteGroup('00000000-0000-0000-0000-000000000000', testUserId)
        ).rejects.toThrow(NotFoundError);
      });
    });

    describe('Repository integration', () => {
      it('should use GroupRepository for all database operations', async () => {
        // Create a new group to test
        const group = await groupService.createGroup({
          name: 'Test Group 2',
          creatorId: testUserId,
        });

        // Verify repository methods are used
        const fetchedGroup = await groupRepository.findById(group.id);
        expect(fetchedGroup).toBeDefined();
        expect(fetchedGroup?.name).toBe('Test Group 2');

        // Clean up
        await groupService.deleteGroup(group.id, testUserId);
      });

      it('should use GroupMapper for DTO transformation', async () => {
        const group = await groupService.createGroup({
          name: 'Test Group 3',
          creatorId: testUserId,
        });

        // Verify DTO structure (camelCase, no internal fields)
        expect(group.creatorId).toBeDefined();
        expect(group.createdAt).toBeDefined();
        expect(group.updatedAt).toBeDefined();
        expect((group as any).creator_id).toBeUndefined();
        expect((group as any).created_at).toBeUndefined();

        // Clean up
        await groupService.deleteGroup(group.id, testUserId);
      });
    });

    describe('Error handling', () => {
      it('should handle repository errors gracefully', async () => {
        await expect(
          groupService.getGroup('invalid-uuid')
        ).rejects.toThrow();
      });

      it('should propagate NotFoundError from repository', async () => {
        await expect(
          groupService.updateGroup('00000000-0000-0000-0000-000000000000', 'Test', testUserId)
        ).rejects.toThrow(NotFoundError);
      });

      it('should propagate ValidationError from repository', async () => {
        const group = await groupService.createGroup({
          name: 'Test Group 4',
          creatorId: testUserId,
        });

        // Try to add same member twice
        await groupService.addMember(group.id, testUser2Id);
        await expect(
          groupService.addMember(group.id, testUser2Id)
        ).rejects.toThrow(ValidationError);

        // Clean up
        await groupService.deleteGroup(group.id, testUserId);
      });
    });
  });
});
