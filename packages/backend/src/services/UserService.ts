import bcrypt from 'bcrypt';
import { pool } from '../config/database.js';
import { User, UserCreateDTO, UserUpdateDTO, UserRole, UserResponse } from '../models/User.js';
import { IUserRepository } from '../repositories/UserRepository.js';
import { PermissionChecker } from '../utils/PermissionChecker.js';
import { UserMapper } from '../utils/mappers/UserMapper.js';
import { AuthorizationError, NotFoundError, ValidationError } from '../utils/errors.js';
import { Validator } from '../utils/Validator.js';

const SALT_ROUNDS = 10;

export class UserService {
  constructor(
    private userRepository: IUserRepository,
    private permissionChecker: PermissionChecker
  ) {}
  /**
   * Create a new user with hashed password
   */
  async createUser(userData: UserCreateDTO): Promise<User> {
    const { username, email, password, role = UserRole.USER } = userData;

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const query = `
      INSERT INTO users (username, email, password_hash, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, username, email, password_hash as "passwordHash", 
                avatar_id as "avatarId", role, created_at as "createdAt", 
                last_login as "lastLogin", updated_at as "updatedAt"
    `;

    const result = await pool.query(query, [username, email, passwordHash, role]);
    return result.rows[0];
  }

  /**
   * Find user by email
   * Uses UserRepository for data access
   * Requirement 6.1: Use UserRepository for database operations
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  /**
   * Search users by username or email
   */
  async searchUsers(query: string, limit: number = 10): Promise<User[]> {
    const sql = `
      SELECT u.id, u.username, u.email, u.password_hash as "passwordHash", 
             u.avatar_id as "avatarId", u.role, u.created_at as "createdAt", 
             u.last_login as "lastLogin", u.updated_at as "updatedAt",
             a.image_url as "avatarUrl"
      FROM users u
      LEFT JOIN avatars a ON u.avatar_id = a.id
      WHERE u.username ILIKE $1 OR u.email ILIKE $1 OR u.id::text ILIKE $1
      LIMIT $2
    `;
    const result = await pool.query(sql, [`%${query}%`, limit]);
    return result.rows;
  }

  /**
   * Find user by ID
   * Uses UserRepository for data access
   * Requirement 6.1: Use UserRepository for database operations
   */
  async findById(userId: string): Promise<User | null> {
    return this.userRepository.findById(userId);
  }

  /**
   * Get user by ID (returns DTO)
   * Uses UserRepository and UserMapper
   * Requirement 6.1: Use UserRepository for database operations
   * Requirement 6.4: Use Mapper classes for data transformations
   */
  async getUserById(userId: string): Promise<UserResponse> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return UserMapper.toUserResponse(user);
  }

  /**
   * Get user with statistics
   * Uses UserRepository.findWithStats and UserMapper
   * Requirement 6.1: Use UserRepository for database operations
   * Requirement 6.4: Use Mapper classes for data transformations
   */
  async getUserWithStats(userId: string): Promise<UserResponse & { stats: any }> {
    const userWithStats = await this.userRepository.findWithStats(userId);
    return {
      ...UserMapper.toUserResponse(userWithStats),
      stats: userWithStats.stats
    };
  }

  /**
   * Find multiple users by IDs
   */
  async findByIds(userIds: string[]): Promise<User[]> {
    if (!userIds.length) return [];

    const query = `
      SELECT u.id, u.username, u.email, u.password_hash as "passwordHash",
             u.avatar_id as "avatarId", u.role, u.created_at as "createdAt",
             u.last_login as "lastLogin", u.updated_at as "updatedAt",
             a.image_url as "avatarUrl"
      FROM users u
      LEFT JOIN avatars a ON u.avatar_id = a.id
      WHERE u.id = ANY($1)
    `;

    const result = await pool.query(query, [userIds]);
    return result.rows;
  }

  /**
   * Find user by username
   * Uses UserRepository for data access
   * Requirement 6.1: Use UserRepository for database operations
   */
  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findByUsername(username);
  }

  /**
   * Update user information
   * Uses UserRepository and PermissionChecker
   * Requirement 6.1: Use UserRepository for database operations
   * Requirement 6.4: Use Mapper classes for data transformations
   * Requirement 6.5: Use Permission_Checker for authorization
   * Requirement 6.8: Receive dependencies through DI Container
   */
  async updateUser(requesterId: string, userId: string, updates: UserUpdateDTO): Promise<UserResponse> {
    // Permission check: user can update their own profile, or admin can update any user
    if (requesterId !== userId) {
      const requester = await this.userRepository.findById(requesterId);
      if (!requester || requester.role !== UserRole.SUPER_ADMIN) {
        throw new AuthorizationError('You do not have permission to update this user');
      }
    }

    // Prepare update data
    const updateData: Partial<User> = {};
    
    if (updates.username !== undefined) {
      updateData.username = updates.username;
    }
    if (updates.email !== undefined) {
      updateData.email = updates.email;
    }
    if (updates.avatarId !== undefined) {
      updateData.avatarId = updates.avatarId;
    }
    if (updates.lastLogin !== undefined) {
      updateData.lastLogin = updates.lastLogin;
    }

    const updatedUser = await this.userRepository.update(userId, updateData);
    return UserMapper.toUserResponse(updatedUser);
  }

  /**
   * Verify password
   */
  async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin(userId: string): Promise<void> {
    const query = `
      UPDATE users
      SET last_login = NOW()
      WHERE id = $1
    `;

    await pool.query(query, [userId]);
  }

  /**
   * Change user password
   * Validates current password and new password strength
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    // Get user
    const user = await this.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isValid = await this.verifyPassword(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new ValidationError('Current password is incorrect', [
        {
          code: 'invalid',
          message: 'Current password is incorrect',
          path: ['currentPassword']
        }
      ]);
    }

    // Validate new password strength
    this.validatePasswordStrength(newPassword);

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update password
    const query = `
      UPDATE users
      SET password_hash = $1, updated_at = NOW()
      WHERE id = $2
    `;

    await pool.query(query, [newPasswordHash, userId]);
  }

  /**
   * Validate password strength
   * Requirements: at least 8 characters, contains uppercase, lowercase, number
   * Uses Validator utility for consistent validation
   */
  validatePasswordStrength(password: string): void {
    Validator.minLength(password, 8, 'Password');

    Validator.custom(
      password,
      (pwd) => /[A-Z]/.test(pwd),
      'Password',
      'Password must contain at least one uppercase letter'
    );

    Validator.custom(
      password,
      (pwd) => /[a-z]/.test(pwd),
      'Password',
      'Password must contain at least one lowercase letter'
    );

    Validator.custom(
      password,
      (pwd) => /[0-9]/.test(pwd),
      'Password',
      'Password must contain at least one number'
    );
  }

  /**
   * Validate email format
   * Uses Validator utility for consistent validation
   */
  validateEmailFormat(email: string): void {
    Validator.email(email, 'Email');
  }

  /**
   * Request email change
   * Validates email format and checks if email is already in use
   * In a real system, this would send a verification email
   */
  async requestEmailChange(userId: string, newEmail: string): Promise<void> {
    // Validate email format
    this.validateEmailFormat(newEmail);

    // Check if email is already in use
    const existingUser = await this.findByEmail(newEmail);
    if (existingUser && existingUser.id !== userId) {
      throw new Error('Email is already in use');
    }

    // In a real system, we would:
    // 1. Generate a verification token
    // 2. Store it in a pending_email_changes table with expiration
    // 3. Send verification email with token
    // For now, we'll just update the email directly
    // This is a simplified implementation
  }

  /**
   * Update user email
   * This would be called after email verification in a real system
   */
  async updateEmail(userId: string, newEmail: string): Promise<User> {
    // Validate email format
    this.validateEmailFormat(newEmail);

    // Check if email is already in use
    const existingUser = await this.findByEmail(newEmail);
    if (existingUser && existingUser.id !== userId) {
      throw new Error('Email is already in use');
    }

    const query = `
      UPDATE users
      SET email = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id, username, email, password_hash as "passwordHash", 
                avatar_id as "avatarId", role, created_at as "createdAt", 
                last_login as "lastLogin", updated_at as "updatedAt"
    `;

    const result = await pool.query(query, [newEmail, userId]);
    return result.rows[0];
  }

  /**
   * Convert User to UserResponse (remove sensitive data)
   * Uses UserMapper for transformation
   * Requirement 6.4: Use Mapper classes for data transformations
   */
  toUserResponse(user: User & { positions?: any[], managedPositions?: any[], avatarUrl?: string }): UserResponse & { positions?: any[], managedPositions?: any[] } {
    const baseResponse = UserMapper.toUserResponse(user);
    return {
      ...baseResponse,
      positions: user.positions || [],
      managedPositions: user.managedPositions || [],
    };
  }

  /**
   * Get all users (for super admin)
   * Requirements: 15.2
   */
  async getAllUsers(): Promise<(User & { positions: any[] })[]> {
    const query = `
      SELECT u.id, u.username, u.email, u.password_hash as "passwordHash", 
             u.avatar_id as "avatarId", u.role, u.created_at as "createdAt", 
             u.last_login as "lastLogin", u.updated_at as "updatedAt",
             COALESCE(
               json_agg(
                 json_build_object('id', p.id, 'name', p.name)
               ) FILTER (WHERE p.id IS NOT NULL),
               '[]'
             ) as positions
      FROM users u
      LEFT JOIN user_positions up ON u.id = up.user_id
      LEFT JOIN positions p ON up.position_id = p.id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `;

    const result = await pool.query(query);
    return result.rows;
  }

  /**
   * Get users by position IDs (for position admin)
   * Requirements: 15.1
   */
  async getUsersByPositions(positionIds: string[]): Promise<(User & { positions: any[] })[]> {
    if (positionIds.length === 0) {
      return [];
    }

    const query = `
      SELECT u.id, u.username, u.email, u.password_hash as "passwordHash", 
             u.avatar_id as "avatarId", u.role, u.created_at as "createdAt", 
             u.last_login as "lastLogin", u.updated_at as "updatedAt",
             COALESCE(
               json_agg(
                 json_build_object('id', p.id, 'name', p.name)
               ) FILTER (WHERE p.id IS NOT NULL),
               '[]'
             ) as positions
      FROM users u
      INNER JOIN user_positions up_filter ON u.id = up_filter.user_id
      LEFT JOIN user_positions up ON u.id = up.user_id
      LEFT JOIN positions p ON up.position_id = p.id
      WHERE up_filter.position_id = ANY($1)
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `;

    const result = await pool.query(query, [positionIds]);
    return result.rows;
  }

  /**
   * Update user by admin (can update role and other fields)
   * Requirements: 15.4
   */
  async updateUserByAdmin(userId: string, updates: Partial<User>): Promise<User> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updates.username !== undefined) {
      fields.push(`username = $${paramCount++}`);
      values.push(updates.username);
    }

    if (updates.email !== undefined) {
      fields.push(`email = $${paramCount++}`);
      values.push(updates.email);
    }

    if (updates.avatarId !== undefined) {
      fields.push(`avatar_id = $${paramCount++}`);
      values.push(updates.avatarId);
    }

    if (updates.role !== undefined) {
      fields.push(`role = $${paramCount++}`);
      values.push(updates.role);
    }

    if (fields.length === 0) {
      // No updates, just return the user
      const user = await this.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }
      return user;
    }

    fields.push(`updated_at = NOW()`);
    values.push(userId);

    const query = `
      UPDATE users
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, username, email, password_hash as "passwordHash", 
                avatar_id as "avatarId", role, created_at as "createdAt", 
                last_login as "lastLogin", updated_at as "updatedAt"
    `;

    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    return result.rows[0];
  }

  /**
   * Delete user (soft delete by marking as inactive or hard delete)
   * Requirements: 15.5
   * Note: This is a hard delete. In production, consider soft delete.
   */
  async deleteUser(userId: string): Promise<void> {
    // First, check if user exists
    const user = await this.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // In a real system, we should handle related data:
    // - Reassign or delete tasks published by this user
    // - Reassign or delete tasks assigned to this user
    // - Remove from groups
    // - etc.
    // For now, we'll do a simple delete with CASCADE handling in DB

    const query = `DELETE FROM users WHERE id = $1`;
    await pool.query(query, [userId]);
  }

  /**
   * Get user with positions
   * Requirements: 15.3
   */
  async getUserWithPositions(userId: string): Promise<User & { positions: any[], managedPositions: any[] }> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const positionsQuery = `
      SELECT p.id, p.name, p.description
      FROM positions p
      INNER JOIN user_positions up ON p.id = up.position_id
      WHERE up.user_id = $1
    `;

    const managedPositionsQuery = `
      SELECT p.id, p.name, p.description
      FROM positions p
      INNER JOIN position_admins pa ON p.id = pa.position_id
      WHERE pa.admin_id = $1
    `;

    const positionsResult = await pool.query(positionsQuery, [userId]);
    const managedPositionsResult = await pool.query(managedPositionsQuery, [userId]);

    return {
      ...user,
      positions: positionsResult.rows,
      managedPositions: managedPositionsResult.rows,
    };
  }

  /**
   * Update user positions
   */
  async updateUserPositions(userId: string, positionIds: string[]): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Delete existing positions
      await client.query('DELETE FROM user_positions WHERE user_id = $1', [userId]);

      // Insert new positions
      if (positionIds.length > 0) {
        const values = positionIds.map((_, i) => `($1, $${i + 2})`).join(', ');
        const query = `
          INSERT INTO user_positions (user_id, position_id)
          VALUES ${values}
        `;
        await client.query(query, [userId, ...positionIds]);
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Update user managed positions
   */
  async updateUserManagedPositions(userId: string, positionIds: string[]): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Delete existing managed positions
      await client.query('DELETE FROM position_admins WHERE admin_id = $1', [userId]);

      // Insert new managed positions
      if (positionIds.length > 0) {
        const values = positionIds.map((_, i) => `($${i + 2}, $1)`).join(', ');
        const query = `
          INSERT INTO position_admins (position_id, admin_id)
          VALUES ${values}
        `;
        await client.query(query, [userId, ...positionIds]);
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Update user notification preferences
   */
  async updateNotificationPreferences(userId: string, preferences: any): Promise<UserResponse> {
    const query = `
      UPDATE users
      SET notification_preferences = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id, username, email, password_hash as "passwordHash", 
                avatar_id as "avatarId", role, balance,
                notification_preferences as "notificationPreferences",
                created_at as "createdAt", last_login as "lastLogin", 
                updated_at as "updatedAt"
    `;

    const result = await pool.query(query, [JSON.stringify(preferences), userId]);
    if (result.rows.length === 0) {
      throw new NotFoundError('User not found');
    }

    return UserMapper.toUserResponse(result.rows[0]);
  }

  /**
   * Get user notification preferences
   */
  async getNotificationPreferences(userId: string): Promise<any> {
    const query = `
      SELECT notification_preferences
      FROM users
      WHERE id = $1
    `;

    const result = await pool.query(query, [userId]);
    if (result.rows.length === 0) {
      throw new NotFoundError('User not found');
    }

    return result.rows[0].notification_preferences || {
      taskAssigned: true,
      taskCompleted: true,
      taskAbandoned: true,
      bountyReceived: true,
      systemNotifications: true,
    };
  }
}
