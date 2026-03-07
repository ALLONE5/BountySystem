import { PoolClient } from 'pg';
import { ImprovedBaseRepository } from './ImprovedBaseRepository.js';
import { User, UserRole } from '../models/User.js';
import { Validator } from '../utils/Validator.js';
import { NotFoundError } from '../utils/errors.js';
import { logger } from '../config/logger.js';

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
export class UserRepository extends ImprovedBaseRepository<User> implements IUserRepository {
  protected tableName = 'users';

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
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.executeQuery('findByEmail', async () => {
      Validator.required(email, 'email');
      Validator.email(email, 'email');

      const query = `SELECT * FROM ${this.tableName} WHERE email = $1`;
      const result = await this.pool.query(query, [email]);
      return result.rows.length > 0 ? this.mapRowToModel(result.rows[0]) : null;
    }, { email });
  }

  /**
   * Find user by username
   */
  async findByUsername(username: string): Promise<User | null> {
    return this.executeQuery('findByUsername', async () => {
      Validator.required(username, 'username');

      const query = `SELECT * FROM ${this.tableName} WHERE username = $1`;
      const result = await this.pool.query(query, [username]);
      return result.rows.length > 0 ? this.mapRowToModel(result.rows[0]) : null;
    }, { username });
  }

  /**
   * Find user with statistics
   */
  async findWithStats(userId: string): Promise<User & { stats: UserStats }> {
    return this.executeQuery('findWithStats', async () => {
      Validator.required(userId, 'userId');

      const query = `
        SELECT 
          u.*,
          COUNT(DISTINCT CASE WHEN t.publisher_id = u.id THEN t.id END) as total_tasks_published,
          COUNT(DISTINCT CASE WHEN t.assignee_id = u.id AND t.status = 'completed' THEN t.id END) as total_tasks_completed,
          COALESCE(SUM(CASE WHEN t.assignee_id = u.id AND t.is_bounty_settled = true THEN t.bounty_amount END), 0) as total_bounty_earned,
          COALESCE(SUM(CASE WHEN t.publisher_id = u.id AND t.is_bounty_settled = true THEN t.bounty_amount END), 0) as total_bounty_paid
        FROM users u
        LEFT JOIN tasks t ON t.publisher_id = u.id OR t.assignee_id = u.id
        WHERE u.id = $1
        GROUP BY u.id
      `;

      const result = await this.pool.query(query, [userId]);
      if (result.rows.length === 0) {
        throw new NotFoundError('User not found');
      }

      const row = result.rows[0];
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
    }, { userId });
  }

  /**
   * Update user's last login timestamp
   */
  async updateLastLogin(userId: string): Promise<void> {
    return this.executeQuery('updateLastLogin', async () => {
      Validator.required(userId, 'userId');

      const query = `
        UPDATE ${this.tableName}
        SET last_login = NOW(), updated_at = NOW()
        WHERE id = $1
      `;

      await this.pool.query(query, [userId]);
    }, { userId });
  }

}

