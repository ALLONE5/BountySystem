export interface AuditLog {
  id: string;
  userId: string;
  username: string;
  action: string;
  resource: string;
  resourceId: string;
  details: any;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  success: boolean;
}

export interface AuditLogCreateDTO {
  userId: string;
  username: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: any;
  ipAddress: string;
  userAgent: string;
  success: boolean;
}

export interface AuditLogFilters {
  search?: string;
  action?: string;
  resource?: string;
  userId?: string;
  success?: boolean;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface AuditLogResponse {
  id: string;
  userId: string;
  username: string;
  action: string;
  resource: string;
  resourceId: string;
  details: any;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  success: boolean;
}

// Audit action types
export enum AuditAction {
  // User actions
  CREATE_USER = 'CREATE_USER',
  UPDATE_USER = 'UPDATE_USER',
  DELETE_USER = 'DELETE_USER',
  
  // Task actions
  CREATE_TASK = 'CREATE_TASK',
  UPDATE_TASK = 'UPDATE_TASK',
  DELETE_TASK = 'DELETE_TASK',
  PUBLISH_TASK = 'PUBLISH_TASK',
  ASSIGN_TASK = 'ASSIGN_TASK',
  COMPLETE_TASK = 'COMPLETE_TASK',
  ABANDON_TASK = 'ABANDON_TASK',
  ACCEPT_TASK = 'ACCEPT_TASK',
  TRANSFER_TASK = 'TRANSFER_TASK',
  UPDATE_TASK_PROGRESS = 'UPDATE_TASK_PROGRESS',
  ACCEPT_TASK_ASSIGNMENT = 'ACCEPT_TASK_ASSIGNMENT',
  REJECT_TASK_ASSIGNMENT = 'REJECT_TASK_ASSIGNMENT',
  CREATE_SUBTASK = 'CREATE_SUBTASK',
  PUBLISH_SUBTASK = 'PUBLISH_SUBTASK',
  
  // Position actions
  CREATE_POSITION = 'CREATE_POSITION',
  UPDATE_POSITION = 'UPDATE_POSITION',
  DELETE_POSITION = 'DELETE_POSITION',
  
  // Group actions
  CREATE_GROUP = 'CREATE_GROUP',
  UPDATE_GROUP = 'UPDATE_GROUP',
  DELETE_GROUP = 'DELETE_GROUP',
  JOIN_GROUP = 'JOIN_GROUP',
  LEAVE_GROUP = 'LEAVE_GROUP',
  
  // Authentication actions
  LOGIN = 'LOGIN',
  LOGIN_FAILED = 'LOGIN_FAILED',
  LOGOUT = 'LOGOUT',
  
  // System actions
  UPDATE_SYSTEM_CONFIG = 'UPDATE_SYSTEM_CONFIG',
  UPLOAD_FILE = 'UPLOAD_FILE',
  DELETE_FILE = 'DELETE_FILE',
  
  // Bounty actions
  ADD_BONUS_REWARD = 'ADD_BONUS_REWARD',
  DISTRIBUTE_BOUNTY = 'DISTRIBUTE_BOUNTY',
}

// Audit resource types
export enum AuditResource {
  USER = 'USER',
  TASK = 'TASK',
  POSITION = 'POSITION',
  GROUP = 'GROUP',
  AUTH = 'AUTH',
  SYSTEM = 'SYSTEM',
  BOUNTY = 'BOUNTY',
  FILE = 'FILE',
}