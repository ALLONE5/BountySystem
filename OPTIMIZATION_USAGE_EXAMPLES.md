# 优化工具使用示例

本文档展示如何使用新创建的优化工具来重构现有代码。

## 1. 前端错误处理 Hook 使用示例

### 原始代码（重复的错误处理）
```typescript
// packages/frontend/src/pages/TaskListPage.tsx
const fetchTasks = async () => {
  try {
    setLoading(true);
    const tasks = await taskApi.getAll();
    setTasks(tasks);
  } catch (error) {
    console.error('Failed to fetch tasks:', error);
    message.error('获取任务列表失败');
  } finally {
    setLoading(false);
  }
};
```

### 优化后的代码（使用 useErrorHandler）
```typescript
// packages/frontend/src/pages/TaskListPage.tsx
import { useErrorHandler } from '../hooks/useErrorHandler';

const { handleAsyncError } = useErrorHandler();

const fetchTasks = async () => {
  setLoading(true);
  try {
    const tasks = await handleAsyncError(
      () => taskApi.getAll(),
      'TaskListPage.fetchTasks',
      '任务列表加载成功',
      '获取任务列表失败'
    );
    setTasks(tasks);
  } finally {
    setLoading(false);
  }
};
```

## 2. 前端数据获取 Hook 使用示例

### 原始代码（重复的数据加载逻辑）
```typescript
// packages/frontend/src/pages/GroupsPage.tsx
const [groups, setGroups] = useState([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

useEffect(() => {
  const fetchGroups = async () => {
    try {
      setLoading(true);
      const data = await groupApi.getAll();
      setGroups(data);
    } catch (err) {
      setError(err);
      message.error('获取项目组失败');
    } finally {
      setLoading(false);
    }
  };
  
  fetchGroups();
}, []);
```

### 优化后的代码（使用 useDataFetch）
```typescript
// packages/frontend/src/pages/GroupsPage.tsx
import { useDataFetch } from '../hooks/useDataFetch';

const { data: groups, loading, error, refetch } = useDataFetch(
  () => groupApi.getAll(),
  [],
  {
    errorMessage: '获取项目组失败',
    context: 'GroupsPage.fetchGroups'
  }
);
```

## 3. 后端错误处理装饰器使用示例

### 原始代码（重复的错误处理）
```typescript
// packages/backend/src/services/UserService.ts
async createUser(userData: CreateUserDTO): Promise<User> {
  try {
    // 业务逻辑
    const user = await this.userRepository.create(userData);
    return user;
  } catch (error) {
    logger.error('Failed to create user', {
      context: 'UserService.createUser',
      error: error.message,
      userData: { ...userData, password: '[REDACTED]' }
    });
    throw error;
  }
}
```

### 优化后的代码（使用 HandleError 装饰器）
```typescript
// packages/backend/src/services/UserService.ts
import { HandleError } from '../utils/decorators/handleError.js';

@HandleError({ 
  context: 'UserService.createUser',
  includeArgs: true 
})
async createUser(userData: CreateUserDTO): Promise<User> {
  // 业务逻辑
  const user = await this.userRepository.create(userData);
  return user;
}
```

## 4. Repository 层优化示例

### 原始代码（使用旧的 BaseRepository）
```typescript
// packages/backend/src/repositories/TaskRepository.ts
export class TaskRepository extends BaseRepository<Task> {
  async findByAssignee(assigneeId: string): Promise<Task[]> {
    try {
      const query = `
        SELECT * FROM tasks 
        WHERE assignee_id = $1 
        ORDER BY created_at DESC
      `;
      const result = await pool.query(query, [assigneeId]);
      return result.rows.map(row => this.mapRowToModel(row));
    } catch (error) {
      logger.error('Error finding tasks by assignee', {
        assigneeId,
        error: error.message
      });
      throw error;
    }
  }
}
```

### 优化后的代码（使用 ImprovedBaseRepository）
```typescript
// packages/backend/src/repositories/TaskRepository.ts
import { ImprovedBaseRepository } from './ImprovedBaseRepository.js';

export class TaskRepository extends ImprovedBaseRepository<Task> {
  protected tableName = 'tasks';

  async findByAssignee(assigneeId: string): Promise<Task[]> {
    return this.executeQuery('findByAssignee', async () => {
      const query = `
        SELECT * FROM tasks 
        WHERE assignee_id = $1 
        ORDER BY created_at DESC
      `;
      const result = await this.pool.query(query, [assigneeId]);
      return result.rows.map(row => this.mapRowToModel(row));
    }, { assigneeId });
  }

  protected mapRowToModel(row: any): Task {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      // ... 其他字段映射
    };
  }
}
```

## 5. 批量重构示例

### 重构前（多个页面的重复代码）
```typescript
// 在多个页面中重复出现的模式
const handleDelete = async (id: string) => {
  try {
    await api.delete(id);
    message.success('删除成功');
    refetch();
  } catch (error) {
    console.error('Delete failed:', error);
    message.error('删除失败');
  }
};
```

### 重构后（使用通用 Hook）
```typescript
// packages/frontend/src/hooks/useDeleteOperation.ts
import { useErrorHandler } from './useErrorHandler';

export const useDeleteOperation = (
  deleteFn: (id: string) => Promise<void>,
  onSuccess?: () => void
) => {
  const { handleAsyncError } = useErrorHandler();

  const handleDelete = useCallback(async (id: string) => {
    await handleAsyncError(
      () => deleteFn(id),
      'deleteOperation',
      '删除成功',
      '删除失败'
    );
    onSuccess?.();
  }, [deleteFn, onSuccess, handleAsyncError]);

  return { handleDelete };
};

// 在各个页面中使用
const { handleDelete } = useDeleteOperation(
  (id) => taskApi.delete(id),
  () => refetch()
);
```

## 6. 性能监控集成示例

### 在关键操作中添加性能监控
```typescript
// packages/backend/src/services/TaskService.ts
import { HandleError } from '../utils/decorators/handleError.js';
import { PerformanceMonitor } from '../utils/PerformanceMonitor.js';

export class TaskService {
  @HandleError({ context: 'TaskService.createTask' })
  async createTask(taskData: CreateTaskDTO): Promise<Task> {
    const monitor = PerformanceMonitor.start('task_creation');
    
    try {
      // 复杂的任务创建逻辑
      const task = await this.taskRepository.create(taskData);
      
      // 创建相关的依赖关系
      if (taskData.dependencies) {
        await this.createDependencies(task.id, taskData.dependencies);
      }
      
      // 发送通知
      await this.notificationService.notifyTaskCreated(task);
      
      monitor.end({ taskId: task.id, success: true });
      return task;
    } catch (error) {
      monitor.end({ error: error.message, success: false });
      throw error;
    }
  }
}
```

## 7. 缓存集成示例

### 在数据获取中集成缓存
```typescript
// packages/backend/src/services/RankingService.ts
import { CacheService } from './CacheService.js';
import { HandleError } from '../utils/decorators/handleError.js';

export class RankingService {
  constructor(
    private rankingRepository: RankingRepository,
    private cacheService: CacheService
  ) {}

  @HandleError({ context: 'RankingService.getUserRanking' })
  async getUserRanking(userId: string, period: RankingPeriod): Promise<UserRankingInfo> {
    const cacheKey = `user_ranking:${userId}:${period}`;
    
    // 尝试从缓存获取
    const cached = await this.cacheService.get<UserRankingInfo>(cacheKey);
    if (cached) {
      return cached;
    }
    
    // 从数据库获取
    const ranking = await this.rankingRepository.getUserRanking(userId, period);
    
    // 缓存结果（5分钟）
    await this.cacheService.set(cacheKey, ranking, 300);
    
    return ranking;
  }
}
```

## 8. 统一的 API 响应格式

### 创建统一的响应处理器
```typescript
// packages/backend/src/utils/responseHandler.ts
import { Response } from 'express';
import { logger } from '../config/logger.js';

export class ResponseHandler {
  static success<T>(res: Response, data: T, message?: string) {
    return res.json({
      success: true,
      data,
      message: message || 'Operation successful'
    });
  }

  static error(res: Response, error: Error, statusCode: number = 500) {
    logger.error('API Error', {
      error: error.message,
      stack: error.stack,
      statusCode
    });

    return res.status(statusCode).json({
      success: false,
      error: error.message,
      message: 'Operation failed'
    });
  }
}

// 在路由中使用
app.get('/api/tasks', async (req, res) => {
  try {
    const tasks = await taskService.getAllTasks();
    ResponseHandler.success(res, tasks, '任务列表获取成功');
  } catch (error) {
    ResponseHandler.error(res, error);
  }
});
```

## 9. 重构优先级

### 高优先级重构（立即执行）
1. **错误处理统一化** - 使用 `useErrorHandler` 和 `HandleError` 装饰器
2. **数据获取标准化** - 使用 `useDataFetch` Hook
3. **Repository 层升级** - 迁移到 `ImprovedBaseRepository`

### 中优先级重构（本周内）
1. **缓存集成** - 在关键数据获取点添加缓存
2. **性能监控** - 在关键操作中添加性能监控
3. **API 响应标准化** - 统一 API 响应格式

### 低优先级重构（下周）
1. **通用 Hook 创建** - 为常见操作创建专用 Hook
2. **组件优化** - 使用新的 Hook 重构现有组件
3. **测试覆盖** - 为新的工具添加测试

## 10. 重构检查清单

### 每个文件重构后检查
- [ ] 是否移除了重复的错误处理代码？
- [ ] 是否使用了统一的日志记录？
- [ ] 是否添加了适当的类型定义？
- [ ] 是否保持了原有的功能？
- [ ] 是否添加了必要的测试？

### 整体项目检查
- [ ] 代码重复率是否降低？
- [ ] 错误处理是否一致？
- [ ] 性能是否有提升？
- [ ] 日志是否结构化？
- [ ] 缓存是否有效？

通过系统性地应用这些优化工具，我们可以显著提升代码质量、减少重复、改善性能，并建立更好的开发体验。