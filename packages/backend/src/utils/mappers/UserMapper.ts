import type { User, UserResponse } from '../../models/User.js';

/**
 * User data mapper
 * Centralizes user data mapping logic to reduce code duplication
 */
export class UserMapper {
  /**
   * Map database row to UserResponse
   */
  static toUserResponse(row: any): UserResponse {
    if (!row) return null as any;

    return {
      id: row.id,
      username: row.username,
      email: row.email,
      avatarId: row.avatarId || row.avatar_id,
      avatarUrl: row.avatarUrl || row.avatar_url,
      role: row.role,
      createdAt: row.createdAt || row.created_at,
      lastLogin: row.lastLogin || row.last_login,
    };
  }

  /**
   * Map database row to full User (including password hash)
   */
  static toUser(row: any): User {
    if (!row) return null as any;

    return {
      ...this.toUserResponse(row),
      passwordHash: row.passwordHash || row.password_hash,
      updatedAt: row.updatedAt || row.updated_at,
    };
  }

  /**
   * Extract user from joined query with prefix
   * Example: extractUserFromJoin(row, 'publisher') extracts publisher.id, publisher.username, etc.
   */
  static extractUserFromJoin(row: any, prefix: string): UserResponse | undefined {
    const idKey = `${prefix}.id`;
    if (!row[idKey]) return undefined;

    return {
      id: row[idKey],
      username: row[`${prefix}.username`],
      email: row[`${prefix}.email`],
      avatarId: row[`${prefix}.avatarId`],
      avatarUrl: row[`${prefix}.avatarUrl`],
      role: row[`${prefix}.role`],
      createdAt: row[`${prefix}.createdAt`],
      lastLogin: row[`${prefix}.lastLogin`],
    };
  }

  /**
   * Map array of rows to UserResponse array
   */
  static toUserResponseArray(rows: any[]): UserResponse[] {
    return rows.map(row => this.toUserResponse(row));
  }

  /**
   * Get SELECT fields for user query
   */
  static getSelectFields(alias: string = 'u', includePasswordHash: boolean = false): string[] {
    const fields = [
      `${alias}.id`,
      `${alias}.username`,
      `${alias}.email`,
      `${alias}.avatar_id as "avatarId"`,
      `${alias}.role`,
      `${alias}.created_at as "createdAt"`,
      `${alias}.last_login as "lastLogin"`,
      `${alias}.updated_at as "updatedAt"`,
    ];

    if (includePasswordHash) {
      fields.push(`${alias}.password_hash as "passwordHash"`);
    }

    return fields;
  }
}
