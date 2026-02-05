import apiClient from './client';
import { createApiMethod, createApiMethodWithParams } from './createApiClient';
import { Task, TaskStats } from '../types';

export interface TaskQueryParams {
  role?: 'publisher' | 'assignee';
  status?: string;
  positionId?: string;
  visibility?: string;
}

export interface ReportParams {
  type: 'daily' | 'weekly' | 'monthly' | 'total';
  startDate?: string;
  endDate?: string;
}

export const taskApi = {
  // 获取用户发布的任务
  getPublishedTasks: createApiMethod<Task[]>('get', '/tasks/user/published'),

  // 获取用户承接的任务
  getAssignedTasks: createApiMethod<Task[]>('get', '/tasks/user/assigned'),

  // 获取任务统计
  getTaskStats: createApiMethod<TaskStats>('get', '/tasks/stats'),

  // 获取任务详情
  getTask: createApiMethodWithParams<Task, string>('get', (taskId) => `/tasks/${taskId}`),

  // 创建任务
  createTask: createApiMethod<Task>('post', '/tasks'),

  // 更新任务
  updateTask: createApiMethodWithParams<Task, string>('put', (taskId) => `/tasks/${taskId}`),

  // 删除任务
  deleteTask: createApiMethodWithParams<void, string>('delete', (taskId) => `/tasks/${taskId}`),

  // 承接任务
  acceptTask: createApiMethodWithParams<Task, string>('post', (taskId) => `/tasks/${taskId}/accept`),

  // 放弃任务
  abandonTask: createApiMethodWithParams<Task, string>('post', (taskId) => `/tasks/${taskId}/abandon`),

  // 完成任务
  completeTask: createApiMethodWithParams<{ message: string; resolvedTaskIds: string[] }, string>('post', (taskId) => `/tasks/${taskId}/complete`),

  // 更新任务进度
  updateProgress: async (taskId: string, progress: number): Promise<Task> => {
    const response = await createApiMethodWithParams<any, string>('put', (id) => `/tasks/${id}/progress`)(taskId, { progress });
    console.log('[taskApi.updateProgress] Raw response:', response);
    // The response might be the task directly, or wrapped in { task, completionPrompt, message }
    if (response.task) {
      console.log('[taskApi.updateProgress] Returning response.task:', response.task);
      return response.task;
    }
    console.log('[taskApi.updateProgress] Returning response directly:', response);
    return response;
  },

  // 生成报告
  generateReport: async (params: ReportParams): Promise<Blob> => {
    const response = await apiClient.post('/tasks/report', params, {
      responseType: 'blob',
    });
    return response.data;
  },

  // 浏览可承接任务
  browseTasks: async (params?: { 
    sortBy?: 'bounty' | 'deadline' | 'priority' | 'createdAt' | 'updatedAt';
    sortOrder?: 'asc' | 'desc';
    search?: string;
    page?: number;
    pageSize?: number;
  }): Promise<Task[]> => {
    const queryParams = new URLSearchParams();
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    
    const queryString = queryParams.toString();
    const url = queryString ? `/tasks/available?${queryString}` : '/tasks/available';
    
    const response = await apiClient.get(url);
    
    // Backend returns paginated response when page/pageSize are provided
    // Otherwise returns plain array for backward compatibility
    if (response.data.data && response.data.pagination) {
      return response.data.data;
    }
    
    return response.data;
  },

  // Comments
  getComments: createApiMethodWithParams('get', (taskId: string) => `/tasks/${taskId}/comments`),

  addComment: async (taskId: string, content: string) => {
    return createApiMethodWithParams('post', (id: string) => `/tasks/${id}/comments`)(taskId, { content });
  },

  // Attachments
  getAttachments: createApiMethodWithParams('get', (taskId: string) => `/tasks/${taskId}/attachments`),

  addAttachment: async (taskId: string, data: { fileName: string; fileUrl: string; fileType?: string; fileSize?: number }) => {
    return createApiMethodWithParams('post', (id: string) => `/tasks/${id}/attachments`)(taskId, data);
  },

  // Assistants
  getAssistants: createApiMethodWithParams('get', (taskId: string) => `/tasks/${taskId}/assistants`),

  addAssistant: async (taskId: string, assistantId: string, bountyAllocation: number) => {
    return createApiMethodWithParams('post', (id: string) => `/tasks/${id}/assistants`)(taskId, { assistantId, bountyAllocation });
  },

  removeAssistant: async (taskId: string, assistantId: string) => {
    await createApiMethodWithParams('delete', (params: { taskId: string; assistantId: string }) => `/tasks/${params.taskId}/assistants/${params.assistantId}`)({ taskId, assistantId });
  },

  // 发布任务
  publishTask: async (taskId: string, acceptBySelf: boolean) => {
    return createApiMethodWithParams<{ message: string; task: Task }, string>(
      'post',
      (id) => `/tasks/${id}/publish`
    )(taskId, { acceptBySelf });
  },

  // 获取子任务
  getSubtasks: createApiMethodWithParams<Task[], string>('get', (taskId) => `/tasks/${taskId}/subtasks`),

  // 发布子任务
  publishSubtask: async (subtaskId: string, data: { visibility: string; bountyAmount: number; positionId?: string }) => {
    return createApiMethodWithParams<Task, string>('post', (id) => `/tasks/${id}/publish`)(subtaskId, data);
  },

  // 指派任务给用户
  assignTaskToUser: async (taskId: string, invitedUserId: string) => {
    return createApiMethodWithParams<{ message: string; task: Task }, string>(
      'post',
      (id) => `/tasks/${id}/assign-to-user`
    )(taskId, { invitedUserId });
  },

  // 获取任务邀请
  getTaskInvitations: createApiMethod<Task[]>('get', '/tasks/invitations'),

  // 接受任务指派
  acceptTaskAssignment: createApiMethodWithParams<{ message: string; task: Task }, string>(
    'post',
    (taskId) => `/tasks/${taskId}/accept-assignment`
  ),

  // 拒绝任务指派
  rejectTaskAssignment: async (taskId: string, reason?: string) => {
    return createApiMethodWithParams<{ message: string; task: Task }, string>(
      'post',
      (id) => `/tasks/${id}/reject-assignment`
    )(taskId, { reason });
  },
};
