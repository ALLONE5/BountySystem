import apiClient from './client';

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
  timestamp: string;
  success: boolean;
}

export interface AuditLogFilters {
  search?: string;
  action?: string;
  resource?: string;
  userId?: string;
  success?: boolean;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export interface AuditLogResponse {
  logs: AuditLog[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export interface AuditStatistics {
  totalLogs: number;
  successfulOperations: number;
  failedOperations: number;
  uniqueUsers: number;
  topActions: Array<{ action: string; count: number }>;
  topResources: Array<{ resource: string; count: number }>;
}

export const auditLogApi = {
  // Get audit logs with filtering and pagination
  async getLogs(filters: AuditLogFilters = {}): Promise<AuditLogResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await apiClient.get(`/admin/audit/logs?${params.toString()}`);
    return response.data.data;
  },

  // Get audit logs for developers (limited access)
  async getDevLogs(filters: AuditLogFilters = {}): Promise<AuditLogResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await apiClient.get(`/dev/audit/logs?${params.toString()}`);
    return response.data.data;
  },

  // Get specific audit log by ID
  async getLogById(id: string): Promise<AuditLog> {
    const response = await apiClient.get(`/admin/audit/logs/${id}`);
    return response.data.data;
  },

  // Get specific audit log by ID (developer access)
  async getDevLogById(id: string): Promise<AuditLog> {
    const response = await apiClient.get(`/dev/audit/logs/${id}`);
    return response.data.data;
  },

  // Get audit logs for a specific user
  async getLogsByUser(userId: string, limit: number = 50): Promise<AuditLog[]> {
    const response = await apiClient.get(`/admin/audit/users/${userId}/logs?limit=${limit}`);
    return response.data.data;
  },

  // Get audit logs for a specific resource
  async getLogsByResource(resource: string, resourceId: string, limit: number = 50): Promise<AuditLog[]> {
    const response = await apiClient.get(`/admin/audit/resources/${resource}/${resourceId}/logs?limit=${limit}`);
    return response.data.data;
  },

  // Get failed operations
  async getFailedOperations(limit: number = 100): Promise<AuditLog[]> {
    const response = await apiClient.get(`/admin/audit/failed?limit=${limit}`);
    return response.data.data;
  },

  // Get audit statistics
  async getStatistics(days: number = 30): Promise<AuditStatistics> {
    const response = await apiClient.get(`/admin/audit/statistics?days=${days}`);
    return response.data.data;
  },

  // Get audit statistics (developer access)
  async getDevStatistics(days: number = 30): Promise<AuditStatistics> {
    const response = await apiClient.get(`/dev/audit/statistics?days=${days}`);
    return response.data.data;
  },

  // Export audit logs to CSV
  async exportLogs(filters: Omit<AuditLogFilters, 'page' | 'pageSize'> = {}): Promise<Blob> {
    const response = await apiClient.post('/admin/audit/export', filters, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Export audit logs to CSV (developer access - limited to 30 days)
  async exportDevLogs(filters: Omit<AuditLogFilters, 'page' | 'pageSize'> = {}): Promise<Blob> {
    const response = await apiClient.post('/dev/audit/export', filters, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Clean up old audit logs
  async cleanupOldLogs(daysToKeep: number = 365): Promise<{ deletedCount: number }> {
    const response = await apiClient.delete(`/admin/audit/cleanup?daysToKeep=${daysToKeep}`);
    return response.data.data;
  },
};