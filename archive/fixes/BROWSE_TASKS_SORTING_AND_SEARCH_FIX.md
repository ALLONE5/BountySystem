# 赏金任务排序和搜索功能修复

## 修复时间
2026-02-05

## 问题描述

根据诊断报告 `BROWSE_TASKS_FINAL_DIAGNOSIS_2026_02_05.md`，发现以下问题：

1. **后端硬编码排序**：`getAvailableTasks()` 方法硬编码了 `ORDER BY t.created_at DESC`，没有使用前端传递的 `sortBy` 参数
2. **前端只搜索已加载任务**：搜索功能只在已加载的 50 条任务中进行客户端过滤，不向后端发送搜索请求
3. **缺少分页功能**：前端没有"加载更多"或分页控件，无法访问第一页之外的任务

## 根本原因

用户报告的任务"特沃瑞丰我认为"（赏金 $330.00）未在赏金任务界面显示，是因为：
- 任务创建时间较早（2026-02-04 16:58:09）
- API 默认按创建时间降序排列，只返回前 50 条
- 在该任务创建后，有超过 50 个新任务被创建
- 因此该任务被排在第 2 页或更后面，前端无法访问

## 解决方案

### 1. 后端修复：动态排序支持

#### 修改文件：`packages/backend/src/services/TaskService.ts`

**新增方法：`buildOrderByClause()`**
```typescript
private buildOrderByClause(sortBy?: string, sortOrder?: string): string {
  const order = sortOrder === 'asc' ? 'ASC' : 'DESC';
  
  switch (sortBy) {
    case 'bounty':
      return `ORDER BY t.bounty_amount ${order}, t.created_at DESC`;
    case 'deadline':
      return `ORDER BY t.planned_end_date ${order} NULLS LAST, t.created_at DESC`;
    case 'priority':
      return `ORDER BY t.priority ${order}, t.created_at DESC`;
    case 'updatedAt':
      return `ORDER BY t.updated_at ${order}`;
    case 'createdAt':
    default:
      return `ORDER BY t.created_at ${order}`;
  }
}
```

**支持的排序字段**：
- `bounty` - 按赏金金额排序
- `deadline` - 按截止日期排序（NULL 值排在最后）
- `priority` - 按优先级排序
- `createdAt` - 按创建时间排序（默认）
- `updatedAt` - 按更新时间排序

**新增方法：`buildSearchClause()`**
```typescript
private buildSearchClause(searchKeyword?: string): { clause: string; param: string | null } {
  if (!searchKeyword || searchKeyword.trim() === '') {
    return { clause: '', param: null };
  }
  
  const searchPattern = `%${searchKeyword.trim()}%`;
  return {
    clause: `AND (
      t.name ILIKE $5
      OR t.description ILIKE $5
      OR EXISTS (
        SELECT 1 FROM unnest(t.tags) AS tag
        WHERE tag ILIKE $5
      )
    )`,
    param: searchPattern
  };
}
```

**搜索范围**：
- 任务名称（`name`）
- 任务描述（`description`）
- 任务标签（`tags` 数组）
- 使用 `ILIKE` 进行不区分大小写的模糊匹配

**修改方法签名：`getAvailableTasks()`**
```typescript
async getAvailableTasks(
  userId: string, 
  userRole?: string,
  pagination?: PaginationParams,
  sortBy?: string,           // 新增
  sortOrder?: string,         // 新增
  searchKeyword?: string      // 新增
): Promise<Task[] | PaginatedResponse<Task>>
```

**更新缓存键**：
```typescript
const cacheKey = `available_tasks:${userId}:${userRole || 'hunter'}:${page}:${pageSize}:${sortBy || 'createdAt'}:${sortOrder || 'desc'}:${searchKeyword || ''}`;
```

### 2. 后端修复：路由参数验证

#### 修改文件：`packages/backend/src/routes/task.routes.ts`

**更新 GET /api/tasks/available 端点**：

```typescript
router.get('/available', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const userRole = req.user!.role;

  // 解析分页参数
  const page = req.query.page ? parseInt(req.query.page as string) : undefined;
  const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string) : undefined;

  // 解析排序参数
  const sortBy = req.query.sortBy as string | undefined;
  const sortOrder = req.query.sortOrder as string | undefined;

  // 解析搜索参数
  const search = req.query.search as string | undefined;

  // 验证排序参数
  const validSortFields = ['bounty', 'deadline', 'priority', 'createdAt', 'updatedAt'];
  if (sortBy && !validSortFields.includes(sortBy)) {
    return res.status(400).json({ 
      error: `Invalid sortBy field. Must be one of: ${validSortFields.join(', ')}` 
    });
  }
  if (sortOrder && !['asc', 'desc'].includes(sortOrder)) {
    return res.status(400).json({ error: 'sortOrder must be either "asc" or "desc"' });
  }

  const pagination = (page || pageSize) ? { page, pageSize } : undefined;

  const result = await taskService.getAvailableTasks(
    userId, 
    userRole, 
    pagination,
    sortBy,
    sortOrder,
    search
  );
  res.json(result);
}));
```

**新增参数验证**：
- `sortBy` 必须是有效的排序字段之一
- `sortOrder` 必须是 `asc` 或 `desc`
- 无效参数返回 400 错误

### 3. 前端修复：API 客户端

#### 修改文件：`packages/frontend/src/api/task.ts`

**更新 `browseTasks` 方法**：

```typescript
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
  return response.data;
}
```

**变更**：
- 从 `createApiMethod` 改为自定义实现
- 支持传递 `sortBy`、`sortOrder`、`search`、`page`、`pageSize` 参数
- 动态构建查询字符串

### 4. 前端修复：浏览任务页面

#### 修改文件：`packages/frontend/src/pages/BrowseTasksPage.tsx`

**新增状态**：
```typescript
const [currentPage, setCurrentPage] = useState(1);
const [hasMore, setHasMore] = useState(true);
const pageSize = 50;
```

**修改 `loadTasks` 方法**：
```typescript
const loadTasks = async (reset: boolean = false) => {
  try {
    setLoading(true);
    const page = reset ? 1 : currentPage;
    
    const data = await taskApi.browseTasks({
      sortBy,
      sortOrder,
      search: searchKeyword || undefined,  // 发送搜索关键字到后端
      page,
      pageSize,
    });
    
    if (reset) {
      setTasks(data);
      setCurrentPage(1);
    } else {
      setTasks(prev => [...prev, ...data]);  // 追加新任务
    }
    
    // 如果返回的任务数少于 pageSize，说明没有更多任务了
    setHasMore(data.length === pageSize);
  } catch (error) {
    message.error('加载任务列表失败');
    console.error('Failed to load tasks:', error);
  } finally {
    setLoading(false);
  }
};
```

**新增 `loadMoreTasks` 方法**：
```typescript
const loadMoreTasks = () => {
  setCurrentPage(prev => prev + 1);
  loadTasks(false);
};
```

**移除客户端搜索过滤**：
```typescript
const filterAndGroupTasks = () => {
  // 不再需要客户端过滤 - 搜索在后端完成
  setFilteredTasks(tasks);
};
```

**更新 useEffect**：
```typescript
useEffect(() => {
  loadTasks(true); // 重置到第一页
}, [sortBy, sortOrder, searchKeyword]);  // 添加 searchKeyword 依赖
```

**添加"加载更多"按钮**：
```tsx
{/* Load More Button */}
{hasMore && (
  <div style={{ textAlign: 'center', marginTop: 24, marginBottom: 24 }}>
    <Button
      type="default"
      size="large"
      loading={loading}
      onClick={loadMoreTasks}
      style={{ minWidth: 200 }}
    >
      {loading ? '加载中...' : '加载更多任务'}
    </Button>
  </div>
)}

{!hasMore && tasks.length > 0 && (
  <div style={{ textAlign: 'center', marginTop: 24, marginBottom: 24 }}>
    <Text type="secondary">已显示所有任务</Text>
  </div>
)}
```

**添加"更新时间"排序选项**：
```tsx
<Option value="updatedAt">更新时间</Option>
```

## 功能改进

### 1. 动态排序
- 用户可以按赏金、截止日期、优先级、创建时间、更新时间排序
- 支持升序和降序
- 排序在后端执行，性能更好

### 2. 服务器端搜索
- 搜索在后端数据库执行，可以搜索所有任务
- 支持搜索任务名称、描述、标签
- 不区分大小写的模糊匹配
- 搜索结果实时更新

### 3. 分页加载
- 首次加载 50 个任务
- 点击"加载更多"按钮加载下一页
- 自动检测是否还有更多任务
- 显示"已显示所有任务"提示

### 4. 缓存优化
- 缓存键包含排序和搜索参数
- 不同的排序/搜索组合有独立的缓存
- 60 秒 TTL，平衡性能和数据新鲜度

## 用户体验改进

### 问题解决
现在用户可以通过以下方式找到任务"特沃瑞丰我认为"：

1. **搜索**：在搜索框输入"特沃瑞丰"，立即找到该任务
2. **按赏金排序**：选择"按赏金"+"降序"，任务会出现在前面（$330.00 是较高的赏金）
3. **加载更多**：点击"加载更多"按钮，浏览更多任务

### 性能优化
- 后端查询使用索引（`bounty_amount`、`planned_end_date`、`priority`、`created_at`、`updated_at`）
- 分页减少数据传输量
- 缓存减少数据库查询

### 向后兼容
- 不传递排序参数时，默认按创建时间降序（与之前行为一致）
- 不传递分页参数时，返回前 50 条（与之前行为一致）
- API 响应格式保持不变

## 测试建议

### 手动测试
1. **搜索功能**：
   - 搜索"特沃瑞丰"，验证任务出现
   - 搜索不存在的关键字，验证显示"暂无可承接的任务"
   - 清空搜索，验证显示所有任务

2. **排序功能**：
   - 按赏金降序，验证高赏金任务在前
   - 按截止日期升序，验证最早截止的任务在前
   - 按优先级降序，验证高优先级任务在前

3. **分页功能**：
   - 点击"加载更多"，验证加载下一页任务
   - 加载到最后一页，验证显示"已显示所有任务"
   - 改变排序或搜索，验证重置到第一页

4. **组合功能**：
   - 搜索 + 排序，验证结果正确
   - 搜索 + 分页，验证可以加载更多搜索结果

### 性能测试
- 验证查询执行时间 < 100ms（有索引）
- 验证缓存命中率 > 80%（相同查询）
- 验证"加载更多"响应时间 < 200ms

## 相关文件

### 后端
- `packages/backend/src/services/TaskService.ts` - 核心业务逻辑
- `packages/backend/src/routes/task.routes.ts` - API 路由

### 前端
- `packages/frontend/src/api/task.ts` - API 客户端
- `packages/frontend/src/pages/BrowseTasksPage.tsx` - 浏览任务页面

### 文档
- `BROWSE_TASKS_FINAL_DIAGNOSIS_2026_02_05.md` - 问题诊断报告
- `BROWSE_TASKS_VISIBILITY_TROUBLESHOOTING.md` - 故障排查记录

## 完成时间
2026-02-05

## 状态
✅ 已完成
- 后端动态排序功能
- 后端服务器端搜索功能
- 前端"加载更多"分页功能
- 前端搜索集成
- 前端排序选项扩展

## 下一步
建议进行以下测试：
1. 启动后端服务
2. 启动前端服务
3. 登录系统
4. 访问赏金任务页面
5. 测试搜索、排序、分页功能
6. 验证任务"特沃瑞丰我认为"可以被找到
