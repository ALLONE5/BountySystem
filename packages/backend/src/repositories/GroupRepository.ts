import { PoolClient } from 'pg';
import { TaskGroup, GroupMember, GroupMemberDetail } from '../models/TaskGroup.js';
import { Validator } from '../utils/Validator.js';
import { pool } from '../config/database.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { logger } from '../utils/Logger.js';

/**
 * Group Repository Interface
 * Extends base repository with group-specific queries for task_groups
 * Overrides base methods to use string IDs (UUIDs) instead of numbers
 */
export interface IGroupRepository {
  findById(id: string): Promise<TaskGroup | null>;
  findAll(filters?: Record<string, any>): Promise<TaskGroup[]>;
  create(data: Partial<TaskGroup>, client?: PoolClient): Promise<TaskGroup>;
  update(id: string, data: Partial<TaskGroup>, client?: PoolClient): Promise<TaskGroup>;
  delete(id: string, client?: PoolClient): Promise<void>;
  findByCreator(creatorId: string): Promise<TaskGroup[]>;
  findByMember(userId: string): Promise<TaskGroup[]>;
  findWithMembers(groupId: string): Promise<TaskGroup & { members: GroupMemberDetail[] }>;
  addMember(groupId: string, userId: string): Promise<GroupMember>;
  removeMember(groupId: string, userId: string): Promise<void>;
  isMember(groupId: string, userId: string): Promise<boolean>;
  getGroupMembers(groupId: string): Promise<GroupMemberDetail[]>;
}

/**
 * Group Repository
 * Handles all database operations for task groups (user collaboration groups)
 * Uses string IDs (UUIDs) instead of numeric IDs
 * Does not extend BaseRepository due to ID type mismatch
 */
export class GroupRepository implements IGroupRepository {
  private tableName = 'task_groups';

  /**
   * Transform database row to TaskGroup model
   */
  private mapRowToModel(row: any): TaskGroup {
    return {
      id: row.id,
      name: row.name,
      creatorId: row.creator_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  /**
   * Validate group data before create/update
   */
  private validateData(data: Partial<TaskGroup>, isUpdate: boolean = false): void {
    if (!isUpdate) {
      // Required fields for creation (check both camelCase and snake_case)
      const creatorId = (data as any).creator_id || (data as any).creatorId;
      Validator.required(data.name, 'name');
      Validator.required(creatorId, 'creatorId');
    }

    // Validate name length if provided
    if (data.name) {
      Validator.minLength(data.name, 1, 'name');
      Validator.maxLength(data.name, 255, 'name');
    }
  }

  /**
   * Find group by ID (overrides base class to use string ID)
   */
  async findById(id: string): Promise<TaskGroup | null> {
    try {
      Validator.required(id, 'id');

      const query = `
        SELECT id, name, creator_id, created_at, updated_at
        FROM task_groups
        WHERE id = $1
      `;

      const result = await pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToModel(result.rows[0]);
    } catch (error) {
      console.error('Error finding group by id:', error);
      throw error;
    }
  }

  /**
   * Find all groups (overrides base class)
   */
  async findAll(filters?: Record<string, any>): Promise<TaskGroup[]> {
    try {
      const query = `
        SELECT id, name, creator_id, created_at, updated_at
        FROM task_groups
        ORDER BY created_at DESC
      `;

      const result = await pool.query(query);
      return result.rows.map(row => this.mapRowToModel(row));
    } catch (error) {
      console.error('Error finding all groups:', error);
      throw error;
    }
  }

  /**
   * Create a new group (overrides base class)
   */
  async create(data: Partial<TaskGroup>, client?: PoolClient): Promise<TaskGroup> {
    const conn = client || pool;
    
    try {
      this.validateData(data, false);

      const creatorId = (data as any).creator_id || (data as any).creatorId;

      const query = `
        INSERT INTO task_groups (name, creator_id)
        VALUES ($1, $2)
        RETURNING id, name, creator_id, created_at, updated_at
      `;

      const result = await conn.query(query, [data.name, creatorId]);
      return this.mapRowToModel(result.rows[0]);
    } catch (error) {
      console.error('Error creating group:', error);
      throw error;
    }
  }

  /**
   * Update a group (overrides base class to use string ID)
   */
  async update(id: string, data: Partial<TaskGroup>, client?: PoolClient): Promise<TaskGroup> {
    const conn = client || pool;
    
    try {
      Validator.required(id, 'id');
      this.validateData(data, true);

      // Verify group exists
      const group = await this.findById(id);
      if (!group) {
        throw new NotFoundError('Group not found');
      }

      const query = `
        UPDATE task_groups
        SET name = COALESCE($1, name),
            updated_at = NOW()
        WHERE id = $2
        RETURNING id, name, creator_id, created_at, updated_at
      `;

      const result = await conn.query(query, [data.name, id]);
      return this.mapRowToModel(result.rows[0]);
    } catch (error) {
      console.error('Error updating group:', error);
      throw error;
    }
  }

  /**
   * Delete a group (overrides base class to use string ID)
   */
  async delete(id: string, client?: PoolClient): Promise<void> {
    const conn = client || pool;
    
    try {
      Validator.required(id, 'id');

      // Verify group exists
      const group = await this.findById(id);
      if (!group) {
        throw new NotFoundError('Group not found');
      }

      // Delete group members first (cascade)
      await conn.query('DELETE FROM group_members WHERE group_id = $1', [id]);

      // Delete group
      await conn.query('DELETE FROM task_groups WHERE id = $1', [id]);
    } catch (error) {
      console.error('Error deleting group:', error);
      throw error;
    }
  }

  /**
   * Find groups by creator
   */
  async findByCreator(creatorId: string): Promise<TaskGroup[]> {
    try {
      Validator.required(creatorId, 'creatorId');

      const query = `
        SELECT id, name, creator_id, created_at, updated_at
        FROM task_groups
        WHERE creator_id = $1
        ORDER BY created_at DESC
      `;

      const result = await pool.query(query, [creatorId]);
      return result.rows.map(row => this.mapRowToModel(row));
    } catch (error) {
      console.error('Error finding groups by creator:', error);
      throw error;
    }
  }

  /**
   * Find groups where user is a member
   */
  async findByMember(userId: string): Promise<TaskGroup[]> {
    try {
      Validator.required(userId, 'userId');

      const query = `
        SELECT DISTINCT tg.id, tg.name, tg.creator_id, tg.created_at, tg.updated_at
        FROM task_groups tg
        INNER JOIN group_members gm ON tg.id = gm.group_id
        WHERE gm.user_id = $1
        ORDER BY tg.created_at DESC
      `;

      const result = await pool.query(query, [userId]);
      return result.rows.map(row => this.mapRowToModel(row));
    } catch (error) {
      console.error('Error finding groups by member:', error);
      throw error;
    }
  }

  /**
   * Find group with members
   */
  async findWithMembers(groupId: string): Promise<TaskGroup & { members: GroupMemberDetail[] }> {
    try {
      Validator.required(groupId, 'groupId');

      const group = await this.findById(groupId);
      
      if (!group) {
        throw new NotFoundError('Group not found');
      }

      const members = await this.getGroupMembers(groupId);

      return {
        ...group,
        members
      };
    } catch (error) {
      console.error('Error finding group with members:', error);
      throw error;
    }
  }

  /**
   * Add member to group
   */
  async addMember(groupId: string, userId: string): Promise<GroupMember> {
    try {
      Validator.required(groupId, 'groupId');
      Validator.required(userId, 'userId');

      // Verify group exists
      const group = await this.findById(groupId);
      if (!group) {
        throw new NotFoundError('Group not found');
      }

      // Check if user is already a member
      const isMember = await this.isMember(groupId, userId);
      if (isMember) {
        throw new ValidationError('User is already a member of this group');
      }

      const query = `
        INSERT INTO group_members (group_id, user_id)
        VALUES ($1, $2)
        RETURNING id, group_id, user_id, joined_at
      `;

      const result = await pool.query(query, [groupId, userId]);
      const row = result.rows[0];

      return {
        id: row.id,
        groupId: row.group_id,
        userId: row.user_id,
        joinedAt: row.joined_at
      };
    } catch (error) {
      console.error('Error adding member to group:', error);
      throw error;
    }
  }

  /**
   * Remove member from group
   */
  async removeMember(groupId: string, userId: string): Promise<void> {
    try {
      Validator.required(groupId, 'groupId');
      Validator.required(userId, 'userId');

      // Verify group exists
      const group = await this.findById(groupId);
      if (!group) {
        throw new NotFoundError('Group not found');
      }

      // Check if user is a member
      const isMember = await this.isMember(groupId, userId);
      if (!isMember) {
        throw new ValidationError('User is not a member of this group');
      }

      const query = 'DELETE FROM group_members WHERE group_id = $1 AND user_id = $2';
      await pool.query(query, [groupId, userId]);
    } catch (error) {
      console.error('Error removing member from group:', error);
      throw error;
    }
  }

  /**
   * Check if a user is a member of a group
   */
  async isMember(groupId: string, userId: string): Promise<boolean> {
    try {
      Validator.required(groupId, 'groupId');
      Validator.required(userId, 'userId');

      const query = `
        SELECT EXISTS(
          SELECT 1 FROM group_members
          WHERE group_id = $1 AND user_id = $2
        ) as is_member
      `;

      const result = await pool.query(query, [groupId, userId]);
      return result.rows[0].is_member;
    } catch (error) {
      console.error('Error checking group membership:', error);
      throw error;
    }
  }

  /**
   * Get all members of a group
   */
  async getGroupMembers(groupId: string): Promise<GroupMemberDetail[]> {
    try {
      Validator.required(groupId, 'groupId');

      const query = `
        SELECT 
          gm.id, 
          gm.group_id, 
          gm.user_id, 
          gm.joined_at,
          u.username,
          u.email,
          u.role,
          u.avatar_id
        FROM group_members gm
        INNER JOIN users u ON u.id = gm.user_id
        WHERE gm.group_id = $1
        ORDER BY gm.joined_at ASC
      `;

      const result = await pool.query(query, [groupId]);
      
      return result.rows.map(row => ({
        id: row.id,
        groupId: row.group_id,
        userId: row.user_id,
        joinedAt: row.joined_at,
        username: row.username,
        email: row.email,
        role: row.role,
        avatarId: row.avatar_id
      }));
    } catch (error) {
      console.error('Error getting group members:', error);
      throw error;
    }
  }
}
