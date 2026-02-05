import { createExtendedApi, createApiMethod, createApiMethodWithParams } from './createApiClient';

export interface Position {
  id: string;
  name: string;
  description?: string;
  requiredSkills?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PositionApplication {
  id: string;
  userId: string;
  positionId: string;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewerId?: string;
  reviewComment?: string;
  createdAt: string;
  reviewedAt?: string;
}

// 使用工厂函数创建API客户端
const baseCrudApi = createExtendedApi<Position>({
  basePath: '/positions',
  customMethods: {
    // Get user's positions
    getUserPositions: createApiMethodWithParams<Position[], string>(
      'get',
      (userId) => `/positions/users/${userId}/positions`
    ),

    // Apply for a position
    applyForPosition: createApiMethod<PositionApplication>(
      'post',
      '/positions/applications'
    ),

    // Request position replacement (remove old, add new)
    requestPositionReplacement: createApiMethod<PositionApplication[]>(
      'post',
      '/positions/applications/replacement'
    ),

    // Get user's applications
    getUserApplications: createApiMethod<PositionApplication[]>(
      'get',
      '/positions/applications/my'
    ),
  },
});

// 导出带有语义化方法名的API
export const positionApi = {
  getAllPositions: baseCrudApi.getAll,
  createPosition: baseCrudApi.create,
  updatePosition: baseCrudApi.update,
  deletePosition: baseCrudApi.delete,
  getUserPositions: baseCrudApi.getUserPositions,
  applyForPosition: baseCrudApi.applyForPosition,
  requestPositionReplacement: baseCrudApi.requestPositionReplacement,
  getUserApplications: baseCrudApi.getUserApplications,
};
