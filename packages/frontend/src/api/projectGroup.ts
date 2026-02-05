import { createExtendedApi } from './createApiClient';

export interface ProjectGroup {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectGroupCreateDTO {
  name: string;
  description?: string;
}

export interface ProjectGroupUpdateDTO {
  name?: string;
  description?: string;
}

export interface ProjectGroupWithTasks extends ProjectGroup {
  taskCount: number;
  completedTaskCount: number;
  totalBounty: number;
  tasks?: any[];
}

export interface ProjectGroupStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  availableTasks: number;
  totalBounty: number;
  earnedBounty: number;
  completionRate: number;
}

// 使用工厂函数创建API客户端
const baseCrudApi = createExtendedApi<ProjectGroup>({
  basePath: '/project-groups',
  customMethods: {},
});

// 导出带有语义化方法名的API
export const projectGroupApi = {
  // 基础CRUD
  getAllProjectGroups: baseCrudApi.getAll,
  getProjectGroupById: baseCrudApi.getById,
  createProjectGroup: baseCrudApi.create,
  updateProjectGroup: baseCrudApi.update,
  deleteProjectGroup: baseCrudApi.delete,

  // 扩展方法
  getProjectGroupWithTasks: async (id: string): Promise<ProjectGroupWithTasks> => {
    const response = await baseCrudApi.customRequest('get', `/project-groups/${id}/details`);
    return response.data;
  },

  getProjectGroupStats: async (id: string): Promise<ProjectGroupStats> => {
    const response = await baseCrudApi.customRequest('get', `/project-groups/${id}/stats`);
    return response.data;
  },

  getTasksByProjectGroup: async (id: string): Promise<any[]> => {
    const response = await baseCrudApi.customRequest('get', `/project-groups/${id}/tasks`);
    return response.data;
  },
};
