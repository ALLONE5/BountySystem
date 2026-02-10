# 赏金任务分页响应修复

## 问题描述

在实现任务发布工作流后，赏金任务界面报错：

```
Unexpected Application Error!
groupTasks2.map is not a function
TypeError: groupTasks2.map is not a function
```

## 根本原因

在之前的"赏金任务排序和搜索功能"实现中，后端 `getAvailableTasks` 方法被修改为：
- 当提供分页参数（`page` 或 `pageSize`）时，返回分页响应对象：
  ```typescript
  {
    data: Task[],
    pagination: {
      currentPage: number,
      pageSize: number,
      totalItems: number,
      totalPages: number
    }
  }
  ```
- 当不提供分页参数时，返回普通数组 `Task[]`（向后兼容）

但是前端 `browseTasks` API 方法没有处理这种情况，直接返回 `response.data`，导致：
- 当提供分页参数时，返回的是 `{ data: Task[], pagination: {...} }` 对象
- 前端代码期望的是 `Task[]` 数组
- 导致 `.map()` 调用失败

## 解决方案

修改前端 `browseTasks` API 方法，检测响应类型并提取正确的数据：

**文件**：`packages/frontend/src/api/task.ts`

```typescript
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
```

## 修改说明

1. **检测分页响应**：检查 `response.data` 是否包含 `data` 和 `pagination` 字段
2. **提取数据数组**：如果是分页响应，返回 `response.data.data`（任务数组）
3. **向后兼容**：如果不是分页响应，直接返回 `response.data`（普通数组）

## 测试验证

1. **赏金任务页面**：
   - 访问赏金任务页面
   - 验证任务列表正常显示
   - 验证排序功能正常
   - 验证搜索功能正常
   - 验证"加载更多"按钮正常

2. **其他使用 browseTasks 的页面**：
   - 验证所有调用 `browseTasks` 的页面都正常工作

## 相关文件

- `packages/frontend/src/api/task.ts` - 修复 browseTasks 方法
- `packages/backend/src/services/TaskService.ts` - getAvailableTasks 方法（已在之前修改）
- `packages/frontend/src/pages/BrowseTasksPage.tsx` - 使用 browseTasks 的页面

## 编译状态

所有文件编译通过，无 TypeScript 错误。

## 实施日期

2026-02-05
