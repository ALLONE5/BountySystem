import { createApiMethod, createApiMethodWithParams } from './createApiClient';
import { User, Task, UserRole, PositionApplication } from '../types';

// Update user request
export interface UpdateUserRequest {
  username?: string;
  email?: string;
  avatarId?: string;
  role?: UserRole;
  positionIds?: string[];
  managedPositionIds?: string[];
}

// Update task request
export interface UpdateTaskRequest {
  name?: string;
  description?: string;
  tags?: string[];
  plannedStartDate?: Date;
  plannedEndDate?: Date;
  estimatedHours?: number;
  complexity?: number;
  priority?: number;
  positionId?: string;
  visibility?: string;
}

export const adminApi = {
  // ============================================================================
  // USER MANAGEMENT
  // ============================================================================

  // Get all users (filtered by admin permissions)
  getUsers: createApiMethod<{ users: User[]; count: number }>('get', '/admin/users'),

  // Get user details
  getUserDetails: createApiMethodWithParams<{ user: User }, string>('get', (userId) => `/admin/users/${userId}`),

  // Update user
  updateUser: createApiMethodWithParams<{ message: string; user: User }, string>('put', (userId) => `/admin/users/${userId}`),

  // Delete user (super admin only)
  deleteUser: createApiMethodWithParams<{ message: string }, string>('delete', (userId) => `/admin/users/${userId}`),

  // Get user tasks
  getUserTasks: createApiMethodWithParams<{ tasks: Task[] }, string>('get', (userId) => `/admin/users/${userId}/tasks`),

  // ============================================================================
  // TASK MANAGEMENT
  // ============================================================================

  // Get all tasks (filtered by admin permissions)
  getTasks: createApiMethod<{ tasks: Task[]; count: number }>('get', '/admin/tasks'),

  // Get task details
  getTaskDetails: createApiMethodWithParams<{ task: Task }, string>('get', (taskId) => `/admin/tasks/${taskId}`),

  // Update task
  updateTask: createApiMethodWithParams<{ message: string; task: Task }, string>('put', (taskId) => `/admin/tasks/${taskId}`),

  // Delete task
  deleteTask: createApiMethodWithParams<{ message: string }, string>('delete', (taskId) => `/admin/tasks/${taskId}`),

  // ============================================================================
  // POSITION APPLICATION AUDIT
  // ============================================================================

  // Get pending applications
  getApplications: createApiMethod<{ applications: PositionApplication[]; count: number }>('get', '/admin/applications'),

  // Get application details
  getApplicationDetails: createApiMethodWithParams<{ application: PositionApplication }, string>('get', (applicationId) => `/admin/applications/${applicationId}`),

  // Review application (approve or reject)
  reviewApplication: createApiMethodWithParams<{ message: string }, string>('post', (applicationId) => `/admin/applications/${applicationId}/review`),

  // ============================================================================
  // GROUP MANAGEMENT
  // ============================================================================

  // Get all groups
  getGroups: createApiMethod<{ groups: any[]; count: number }>('get', '/admin/groups'),

  // Delete group
  deleteGroup: createApiMethodWithParams<{ message: string }, string>('delete', (groupId) => `/admin/groups/${groupId}`),
};
