import { createApiMethod } from './createApiClient';

export interface SystemStats {
  totalUsers: number;
  onlineUsers: number;
  totalTasks: number;
  activeTasks: number;
  totalBounty: number;
  completedTasks: number;
}

export interface OnlineUser {
  id: string;
  username: string;
  avatarUrl?: string;
  lastActive: string;
  status: 'online' | 'away' | 'busy';
}

export interface SystemPerformance {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkLoad: number;
  uptime: string;
}

export interface ActivityLog {
  id: string;
  type: string;
  user: string;
  action: string;
  time: string;
  status: 'success' | 'info' | 'warning' | 'error';
}

export interface DatabaseInfo {
  connections: number;
  responseTime: number;
  status: string;
}

export interface DashboardData {
  stats: SystemStats;
  onlineUsers: OnlineUser[];
  performance: SystemPerformance;
  activities: ActivityLog[];
}

export const systemMonitorApi = {
  // Get system statistics
  getStats: createApiMethod<SystemStats>('get', '/system-monitor/stats'),

  // Get online users
  getOnlineUsers: createApiMethod<{ users: OnlineUser[]; count: number }>('get', '/system-monitor/online-users'),

  // Get system performance
  getPerformance: createApiMethod<SystemPerformance>('get', '/system-monitor/performance'),

  // Get activity logs
  getActivity: createApiMethod<{ activities: ActivityLog[]; count: number }>('get', '/system-monitor/activity'),

  // Get database info
  getDatabase: createApiMethod<DatabaseInfo>('get', '/system-monitor/database'),

  // Get comprehensive dashboard data
  getDashboard: createApiMethod<DashboardData>('get', '/system-monitor/dashboard'),
};