import { pool } from '../config/database.js';
import { UserRole } from '../models/User.js';
import { AuthorizationError } from '../utils/errors.js';

export enum PageAccess {
  PERSONAL = 'personal',
  PUBLISHED_TASKS = 'published_tasks',
  ACCEPTED_TASKS = 'accepted_tasks',
  BOUNTY_TASKS = 'bounty_tasks',
  RANKING = 'ranking',
  USER_MANAGEMENT = 'user_management',
  TASK_MANAGEMENT = 'task_management',
  AUDIT_OPERATIONS = 'audit_operations',
}

export class PermissionService {
  /**
   * Check if user has access to a specific page
   * Based on requirements 6.1, 6.2, 6.3
   */
  canAccessPage(userRole: UserRole, page: PageAccess): boolean {
    // Pages accessible to all users
    const commonPages = [
      PageAccess.PERSONAL,
      PageAccess.PUBLISHED_TASKS,
      PageAccess.ACCEPTED_TASKS,
      PageAccess.BOUNTY_TASKS,
      PageAccess.RANKING,
    ];

    // Pages accessible to position admins and super admins
    const adminPages = [
      PageAccess.USER_MANAGEMENT,
      PageAccess.TASK_MANAGEMENT,
      PageAccess.AUDIT_OPERATIONS,
    ];

    switch (userRole) {
      case UserRole.USER:
        return commonPages.includes(page);

      case UserRole.POSITION_ADMIN:
        return commonPages.includes(page) || adminPages.includes(page);

      case UserRole.SUPER_ADMIN:
        return true; // Super admin has access to all pages

      default:
        return false;
    }
  }

  /**
   * Check if user can manage a specific position
   * Position admins can only manage their assigned positions
   * Super admins can manage all positions
   */
  async canManagePosition(userId: string, positionId: string): Promise<boolean> {
    const query = `
      SELECT u.role, 
             EXISTS(
               SELECT 1 FROM position_admins 
               WHERE admin_id = $1 AND position_id = $2
             ) as is_position_admin
      FROM users u
      WHERE u.id = $1
    `;

    const result = await pool.query(query, [userId, positionId]);

    if (result.rows.length === 0) {
      return false;
    }

    const { role, is_position_admin } = result.rows[0];

    // Super admin can manage all positions
    if (role === UserRole.SUPER_ADMIN) {
      return true;
    }

    // Position admin can only manage their assigned positions
    if (role === UserRole.POSITION_ADMIN && is_position_admin) {
      return true;
    }

    return false;
  }

  /**
   * Get all positions managed by a user
   */
  async getManagedPositions(userId: string): Promise<string[]> {
    const query = `
      SELECT u.role, COALESCE(array_agg(pa.position_id), ARRAY[]::uuid[]) as position_ids
      FROM users u
      LEFT JOIN position_admins pa ON pa.admin_id = u.id
      WHERE u.id = $1
      GROUP BY u.role
    `;

    const result = await pool.query(query, [userId]);

    if (result.rows.length === 0) {
      return [];
    }

    const { role, position_ids } = result.rows[0];

    // Super admin manages all positions
    if (role === UserRole.SUPER_ADMIN) {
      const allPositionsQuery = `SELECT id FROM positions`;
      const allPositions = await pool.query(allPositionsQuery);
      return allPositions.rows.map((row) => row.id);
    }

    // Return managed positions for position admin
    return position_ids.filter((id: string) => id !== null);
  }

  /**
   * Check if user can view/edit another user's data
   * Based on requirements 6.4, 6.5
   */
  async canAccessUserData(
    requestingUserId: string,
    targetUserId: string
  ): Promise<boolean> {
    // Users can always access their own data
    if (requestingUserId === targetUserId) {
      return true;
    }

    const query = `
      SELECT u.role
      FROM users u
      WHERE u.id = $1
    `;

    const result = await pool.query(query, [requestingUserId]);

    if (result.rows.length === 0) {
      return false;
    }

    const { role } = result.rows[0];

    // Super admin can access all user data
    if (role === UserRole.SUPER_ADMIN) {
      return true;
    }

    // Position admin can only access users with their managed positions
    if (role === UserRole.POSITION_ADMIN) {
      const managedPositions = await this.getManagedPositions(requestingUserId);

      if (managedPositions.length === 0) {
        return false;
      }

      // Check if target user has any of the managed positions
      const checkQuery = `
        SELECT EXISTS(
          SELECT 1 FROM user_positions
          WHERE user_id = $1 AND position_id = ANY($2)
        ) as has_managed_position
      `;

      const checkResult = await pool.query(checkQuery, [targetUserId, managedPositions]);
      return checkResult.rows[0].has_managed_position;
    }

    return false;
  }

  /**
   * Check if user can view/edit a task
   * Based on requirements 6.5
   */
  async canAccessTask(userId: string, taskId: string): Promise<boolean> {
    const query = `
      SELECT u.role, t.publisher_id, t.assignee_id, t.position_id
      FROM users u
      CROSS JOIN tasks t
      WHERE u.id = $1 AND t.id = $2
    `;

    const result = await pool.query(query, [userId, taskId]);

    if (result.rows.length === 0) {
      return false;
    }

    const { role, publisher_id, assignee_id, position_id } = result.rows[0];

    // Super admin can access all tasks
    if (role === UserRole.SUPER_ADMIN) {
      return true;
    }

    // Users can access tasks they published or are assigned to
    if (publisher_id === userId || assignee_id === userId) {
      return true;
    }

    // Position admin can access tasks related to their managed positions
    if (role === UserRole.POSITION_ADMIN && position_id) {
      const canManage = await this.canManagePosition(userId, position_id);
      return canManage;
    }

    return false;
  }

  /**
   * Verify user has required role
   */
  verifyRole(userRole: UserRole, requiredRoles: UserRole[]): void {
    if (!requiredRoles.includes(userRole)) {
      throw new AuthorizationError('Insufficient permissions');
    }
  }

  /**
   * Verify user can access page
   */
  verifyPageAccess(userRole: UserRole, page: PageAccess): void {
    if (!this.canAccessPage(userRole, page)) {
      throw new AuthorizationError(`Access denied to ${page}`);
    }
  }
}
