import type { IUserRepository } from '../repositories/UserRepository.js';
import type { ITaskRepository } from '../repositories/TaskRepository.js';
import type { IGroupRepository } from '../repositories/GroupRepository.js';
import type { IPositionRepository } from '../repositories/PositionRepository.js';
import { AuthorizationError } from './errors.js';
import { UserRole } from '../models/User.js';
import { logger } from './Logger.js';
import { CacheService } from '../services/CacheService.js';
import { CACHE_CONSTANTS } from '../constants/AppConstants.js';

/**
 * Permission Checker Utility
 * Centralizes permission validation logic across all services
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7
 */
export class PermissionChecker {
  constructor(
    private userRepository: IUserRepository,
    private taskRepository: ITaskRepository,
    private groupRepository: IGroupRepository,
    private positionRepository: IPositionRepository,
    private cacheService?: CacheService
  ) {}

  /**
   * Check if user can access a task
   * Admins can access all tasks, creators can access their own tasks
   * 
   * Requirement 4.1: Validate user ownership or admin status for tasks
   */
  async canAccessTask(userId: string, taskId: string): Promise<boolean> {
    // Check cache first
    const cacheKey = `task_access_${userId}_${taskId}`;
    const cached = await this.cacheService?.get<boolean>(cacheKey);
    if (cached !== null && cached !== undefined) {
      return cached;
    }

    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        return false;
      }

      // Super admins can access all tasks
      if (user.role === UserRole.SUPER_ADMIN) {
        // Cache admin access for longer period
        await this.cacheService?.set(cacheKey, true, CACHE_CONSTANTS.USER_PERMISSIONS_TTL);
        return true;
      }

      const task = await this.taskRepository.findById(taskId);
      if (!task) {
        return false;
      }

      // Task creator can access their own tasks
      if (task.publisherId === userId) {
        await this.cacheService?.set(cacheKey, true, CACHE_CONSTANTS.USER_PERMISSIONS_TTL);
        return true;
      }

      // Task assignee can access assigned tasks
      if (task.assigneeId === userId) {
        await this.cacheService?.set(cacheKey, true, CACHE_CONSTANTS.USER_PERMISSIONS_TTL);
        return true;
      }

      // Cache negative result for shorter period
      await this.cacheService?.set(cacheKey, false, 300); // 5 minutes
      return false;
    } catch (error) {
      logger.error('Error checking task access', { 
        error: error instanceof Error ? error.message : String(error),
        userId, 
        taskId 
      });
      return false;
    }
  }

  /**
   * Check if user can modify a task
   * Throws UnauthorizedError if permission is denied
   * 
   * Requirement 4.4: Throw UnauthorizedError when permissions are denied
   * Requirement 4.7: Provide descriptive error messages
   */
  async canModifyTask(userId: string, taskId: string): Promise<void> {
    const canAccess = await this.canAccessTask(userId, taskId);
    
    if (!canAccess) {
      throw new AuthorizationError(
        `You do not have permission to modify task ${taskId}`
      );
    }
  }

  /**
   * Check if user can access a group
   * Admins can access all groups, owners and members can access their groups
   * 
   * Requirement 4.2: Validate user membership or admin status for groups
   */
  async canAccessGroup(userId: string, groupId: string): Promise<boolean> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        return false;
      }

      // Super admins can access all groups
      if (user.role === UserRole.SUPER_ADMIN) {
        return true;
      }

      const group = await this.groupRepository.findById(groupId);
      if (!group) {
        return false;
      }

      // Note: Current schema doesn't have owner_id or member relationships
      // This is a placeholder implementation that will work once schema is extended
      
      // Check if user is a member of the group
      const userGroups = await this.groupRepository.findByMember(userId);
      const isMember = userGroups.some(g => g.id === groupId);
      
      if (isMember) {
        return true;
      }

      // Check if user is the owner of the group
      // findByOwner method not available
      const ownedGroups: any[] = [];
      const isOwner = ownedGroups.filter((g: any) => g.ownerId === userId).some(g => g.id === groupId);
      
      return isOwner;
    } catch (error) {
      logger.error('Error checking group access', { 
        error: error instanceof Error ? error.message : String(error),
        userId, 
        groupId 
      });
      return false;
    }
  }

  /**
   * Check if user can modify a group
   * Throws UnauthorizedError if permission is denied
   * 
   * Requirement 4.4: Throw UnauthorizedError when permissions are denied
   * Requirement 4.7: Provide descriptive error messages
   */
  async canModifyGroup(userId: string, groupId: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AuthorizationError('User not found');
    }

    // Super admins can modify all groups
    if (user.role === UserRole.SUPER_ADMIN) {
      return;
    }

    const group = await this.groupRepository.findById(groupId);
    if (!group) {
      throw new AuthorizationError('Group not found');
    }

    // Note: Current schema doesn't have owner_id
    // This is a placeholder implementation that will work once schema is extended
    
    // Check if user is the owner of the group
    // findByOwner method not available
    const ownedGroups: any[] = [];
    const isOwner = ownedGroups.filter((g: any) => g.ownerId === userId).some(g => g.id === groupId);
    
    if (!isOwner) {
      throw new AuthorizationError(
        `You do not have permission to modify group ${groupId}`
      );
    }
  }

  /**
   * Check if user can access a position
   * Admins can access all positions, task owners can access positions for their tasks
   * 
   * Requirement 4.3: Validate task ownership or admin status for positions
   */
  async canAccessPosition(userId: string, positionId: string): Promise<boolean> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        return false;
      }

      // Super admins can access all positions
      if (user.role === UserRole.SUPER_ADMIN) {
        return true;
      }

      const position = await this.positionRepository.findById(positionId);
      if (!position) {
        return false;
      }

      // Note: In the current schema, we need to find tasks that reference this position
      // to determine if the user owns any of those tasks
      
      // For now, we'll check if the user has been granted this position
      const userPositions = await this.positionRepository.findByUser(userId);
      const hasPosition = userPositions.some(p => p.id === positionId);
      
      if (hasPosition) {
        return true;
      }

      // Check if user owns any tasks that reference this position
      // This requires querying tasks by position_id
      const tasks = await this.taskRepository.findAll({ positionId });
      const ownsTask = tasks.some(task => task.publisherId === userId);
      
      return ownsTask;
    } catch (error) {
      logger.error('Error checking position access', { 
        error: error instanceof Error ? error.message : String(error),
        userId, 
        positionId 
      });
      return false;
    }
  }

  /**
   * Check if user can modify a position
   * Throws UnauthorizedError if permission is denied
   * 
   * Requirement 4.4: Throw UnauthorizedError when permissions are denied
   * Requirement 4.7: Provide descriptive error messages
   */
  async canModifyPosition(userId: string, positionId: string): Promise<void> {
    const canAccess = await this.canAccessPosition(userId, positionId);
    
    if (!canAccess) {
      throw new AuthorizationError(
        `You do not have permission to modify position ${positionId}`
      );
    }
  }
}
