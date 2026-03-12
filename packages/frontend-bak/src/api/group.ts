import { createApiMethod, createApiMethodWithParams } from './createApiClient';
import { TaskGroup, Task } from '../types';
import apiClient from './client';

export const groupApi = {
  // 获取用户加入的组群列表
  getUserGroups: createApiMethod<TaskGroup[]>('get', '/groups'),

  // 获取组群详情
  getGroup: createApiMethodWithParams<TaskGroup, string>('get', (groupId) => `/groups/${groupId}`),

  // 获取组群成员
  getGroupMembers: createApiMethodWithParams<TaskGroup['members'], string>('get', (groupId) => `/groups/${groupId}/members`),

  // 获取组群任务
  getGroupTasks: createApiMethodWithParams<Task[], string>('get', (groupId) => `/groups/${groupId}/tasks`),

  // 创建组群
  createGroup: createApiMethod<TaskGroup>('post', '/groups'),

  // 添加成员
  addMember: async (groupId: string, userId: string): Promise<void> => {
    await createApiMethodWithParams<void, string>('post', (id) => `/groups/${id}/members`)(groupId, { userId });
  },

  // 移除成员
  removeMember: async (groupId: string, userId: string): Promise<void> => {
    await createApiMethodWithParams<void, { groupId: string; userId: string }>('delete', (params) => `/groups/${params.groupId}/members/${params.userId}`)({ groupId, userId });
  },

  // 邀请成员
  inviteMember: async (groupId: string, userId: string): Promise<void> => {
    await createApiMethodWithParams<void, string>('post', (id) => `/groups/${id}/invite`)(groupId, { userId });
  },

  // 加入组群 (接受邀请)
  joinGroup: createApiMethodWithParams<void, string>('post', (groupId) => `/groups/${groupId}/join`),

  // 为组群创建任务
  createGroupTask: async (groupId: string, taskData: any): Promise<Task> => {
    const response = await apiClient.post(`/groups/${groupId}/tasks/create`, taskData);
    return response.data;
  },

  // 承接组群任务
  acceptGroupTask: async (groupId: string, taskId: string): Promise<void> => {
    const response = await apiClient.post(`/groups/${groupId}/tasks/${taskId}/accept`);
    return response.data;
  },

  // 将任务转换为组群任务
  convertTaskToGroupTask: async (groupId: string, taskId: string): Promise<void> => {
    const response = await apiClient.post(`/groups/${groupId}/tasks/${taskId}/convert`);
    return response.data;
  },
};
