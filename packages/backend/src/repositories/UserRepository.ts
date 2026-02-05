import { PoolClient } from 'pg';
import { BaseRepository, IRepository } from './BaseRepository.js';
import { User, UserRole } from '../models/User.js';
import { Validator } from '../utils/Validator.js';
import { NotFoundError } from '../utils/errors.js';

/**
 * User Statistics Interface
 */
export interface UserStats {
  totalTasksPublished: number;
  totalTasksCompleted: number;
  totalBountyEarned: number;
  totalBountyPaid: number;
}

/**
 * User Repository Interface
 * Extends base repository with user-specific queries
 */
export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findAll(filters?: Record<string, any>): Promise<User[]>;
  create(data: Partial<User>, client?: PoolClient): Promise<User>;
  update(id: string, data: Partial<User>, client?: PoolClient): Promise<User>;
  delete(id: string, client?: PoolClient): Promise<void>;
  findByEmail(email: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  findWithStats(userId: string): Promise<User & { stats: UserStats }>;
  updateLastLogin(userId: string): Promise<void>;
}

/**
 * User Repository
 * Handles all database operations for users
 */
export class UserRepository extends BaseRepository<User> implements IUserRepository {
  constructor() {
    super('users');
  }

  /**
   * Get all column names for the users table
   */
  protected getColumns(): string[] {
    return [
      'id',
      'username',
      'email',
      'password_hash',
      'avatar_id',
      'role',
      'created_at',
      'last_login',
      'updated_at'
    ];
  }

  /**
   * Transform database row to User model
   */
  protected mapRowToModel(row: any): User {
    return {
      id: row.id,
      username: row.username,
      email: row.email,
      passwordHash: row.password_hash,
      avatarId: row.avatar_id,
      role: row.role as UserRole,
      createdAt: row.created_at,
      lastLogin: row.last_login,
      updatedAt: row.updated_at
    };
  }

  /**
   * Validate user data before create/update
   */
  protected validateData(data: Partial<User>, isUpdate: boolean = false): void {
    if (!isUpdate) {
      // Required fields for creation
      Validator.required(data.username, 'username');
      Validator.required(data.email, 'email');
      Validator.required(data.passwordHash, 'passwordHash');
    }

    // Validate email format if provided
    if (data.email) {
      Validator.email(data.email, 'email');
    }

    // Validate username length if provided
    if (data.username) {
      Validator.minLength(data.username, 3, 'username');
      Validator.maxLength(data.username, 50, 'username');
    }

    // Validate role if provided
    if (data.role) {
      const validRoles = Object.values(UserRole);
      if (!validRoles.includes(data.role)) {
        throw new Error(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
      }
    }
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      Validator.required(email, 'email');
      Validator.email(email, 'email');

      const query = `
        SELECT ${this.getColumns().join(', ')}
        FROM ${this.tableName}
        WHERE email = $1
      `;

      const rows = await this.executeQuery<any>(query, [email]);

      if (rows.length === 0) {
        return null;
      }

      return this.mapRowToModel(rows[0]);
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  }

  /**
   * Find user by username
   */
  async findByUsername(username: string): Promise<User | null> {
    try {
      Validator.required(username, 'username');

      const query = `
        SELECT ${this.getColumns().join(', ')}
        FROM ${this.tableName}
        WHERE username = $1
      `;

      const rows = await this.executeQuery<any>(query, [username]);

      if (rows.length === 0) {
        return null;
      }

      return this.mapRowToModel(rows[0]);
    } catch (error) {
      console.error('Error finding user by username:', error);
      throw error;
    }
  }

  /**
   * Find user with statistics
   */
  async findWithStats(userId: string): Promise<User & { stats: UserStats }> {
    try {
      Validator.required(userId, 'userId');

      const query = `
        SELECT 
          u.id,
          u.username,
          u.email,
          u.password_hash,
          u.avatar_id,
          u.role,
          u.created_at,
          u.last_login,
          u.updated_at,
          COUNT(DISTINCT CASE WHEN t.publisher_id = u.id THEN t.id END) as total_tasks_published,
          COUNT(DISTINCT CASE WHEN t.assignee_id = u.id AND t.status = 'completed' THEN t.id END) as total_tasks_completed,
          COALESCE(SUM(CASE WHEN t.assignee_id = u.id AND t.is_bounty_settled = true THEN t.bounty_amount END), 0) as total_bounty_earned,
          COALESCE(SUM(CASE WHEN t.publisher_id = u.id AND t.is_bounty_settled = true THEN t.bounty_amount END), 0) as total_bounty_paid
        FROM users u
        LEFT JOIN tasks t ON t.publisher_id = u.id OR t.assignee_id = u.id
        WHERE u.id = $1
        GROUP BY u.id, u.username, u.email, u.password_hash, u.avatar_id, u.role, u.created_at, u.last_login, u.updated_at
      `;

      const rows = await this.executeQuery<any>(query, [userId]);

      if (rows.length === 0) {
        throw new Error('User not found');
      }

      const row = rows[0];
      const user = this.mapRowToModel(row);

      return {
        ...user,
        stats: {
          totalTasksPublished: parseInt(row.total_tasks_published) || 0,
          totalTasksCompleted: parseInt(row.total_tasks_completed) || 0,
          totalBountyEarned: parseFloat(row.total_bounty_earned) || 0,
          totalBountyPaid: parseFloat(row.total_bounty_paid) || 0
        }
      };
    } catch (error) {
      console.error('Error finding user with stats:', error);
      throw error;
    }
  }

  /**
   * Update user's last login timestamp
   */
  async updateLastLogin(userId: string): Promise<void> {
    try {
      Validator.required(userId, 'userId');

      const query = `
        UPDATE ${this.tableName}
        SET last_login = NOW(), updated_at = NOW()
        WHERE id = $1
      `;

      await this.executeQuery(query, [userId]);
    } catch (error) {
      console.error('Error updating last login:', error);
      throw error;
    }
  }

  /**
   * Override findById to accept string ID
   */
  async findById(id: string): Promise<User | null> {
    try {
      Validator.required(id, 'id');

      const query = `
        SELECT ${this.getColumns().join(', ')}
        FROM ${this.tableName}
        WHERE id = $1
      `;

      const rows = await this.executeQuery<any>(query, [id]);

      if (rows.length === 0) {
        return null;
      }

      return this.mapRowToModel(rows[0]);
    } catch (error) {
      console.error('Error finding user by id:', error);
      throw error;
    }
  }

  /**
   * Override update to accept string ID
   */
  async update(id: string, data: Partial<User>, client?: PoolClient): Promise<User> {
    try {
      Validator.required(id, 'id');
      this.validateData(data, true);

      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      // Build update fields
      if (data.username !== undefined) {
        updates.push(`username = $${paramIndex++}`);
        values.push(data.username);
      }
      if (data.email !== undefined) {
        updates.push(`email = $${paramIndex++}`);
        values.push(data.email);
      }
      if (data.passwordHash !== undefined) {
        updates.push(`password_hash = $${paramIndex++}`);
        values.push(data.passwordHash);
      }
      if (data.avatarId !== undefined) {
        updates.push(`avatar_id = $${paramIndex++}`);
        values.push(data.avatarId);
      }
      if (data.role !== undefined) {
        updates.push(`role = $${paramIndex++}`);
        values.push(data.role);
      }
      if (data.lastLogin !== undefined) {
        updates.push(`last_login = $${paramIndex++}`);
        values.push(data.lastLogin);
      }

      updates.push(`updated_at = NOW()`);
      values.push(id);

      const query = `
        UPDATE ${this.tableName}
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING ${this.getColumns().join(', ')}
      `;

      const rows = await this.executeQuery<any>(query, values, client);

      if (rows.length === 0) {
        throw new NotFoundError(`User with id ${id} not found`);
      }

      return this.mapRowToModel(rows[0]);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Override delete to accept string ID
   */
  async delete(id: string, client?: PoolClient): Promise<void> {
    try {
      Validator.required(id, 'id');

      const query = `
        DELETE FROM ${this.tableName}
        WHERE id = $1
      `;

      await this.executeQuery(query, [id], client);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  /**
   * Override findAll to return users
   */
  async findAll(filters?: Record<string, any>): Promise<User[]> {
    try {
      const query = `
        SELECT ${this.getColumns().join(', ')}
        FROM ${this.tableName}
        ORDER BY created_at DESC
      `;

      const rows = await this.executeQuery<any>(query, []);
      return rows.map(row => this.mapRowToModel(row));
    } catch (error) {
      console.error('Error finding all users:', error);
      throw error;
    }
  }

  /**
   * Override create to handle user creation
   */
  async create(data: Partial<User>, client?: PoolClient): Promise<User> {
    try {
      this.validateData(data, false);

      const fields: string[] = [];
      const placeholders: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (data.username) {
        fields.push('username');
        placeholders.push(`$${paramIndex++}`);
        values.push(data.username);
      }
      if (data.email) {
        fields.push('email');
        placeholders.push(`$${paramIndex++}`);
        values.push(data.email);
      }
      if (data.passwordHash) {
        fields.push('password_hash');
        placeholders.push(`$${paramIndex++}`);
        values.push(data.passwordHash);
      }
      if (data.role) {
        fields.push('role');
        placeholders.push(`$${paramIndex++}`);
        values.push(data.role);
      }
      if (data.avatarId) {
        fields.push('avatar_id');
        placeholders.push(`$${paramIndex++}`);
        values.push(data.avatarId);
      }

      const query = `
        INSERT INTO ${this.tableName} (${fields.join(', ')})
        VALUES (${placeholders.join(', ')})
        RETURNING ${this.getColumns().join(', ')}
      `;

      const rows = await this.executeQuery<any>(query, values, client);

      if (rows.length === 0) {
        throw new Error('Failed to create user');
      }

      return this.mapRowToModel(rows[0]);
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }
}

