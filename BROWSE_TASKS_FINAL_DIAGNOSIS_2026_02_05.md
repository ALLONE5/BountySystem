# 赏金任务可见性问题 - 最终诊断

## 诊断时间
2026-02-05

## 问题描述
用户报告：任务"特沃瑞丰我认为"（赏金 $330.00）未在赏金任务界面显示

## 根本原因

### ✅ 任务状态正常
- 任务ID: `0bfd0ac5-3cd0-4579-ace7-96a4a2c809f1`
- 名称: 特沃瑞丰我认为
- 状态: `available` ✅
- 可见性: `public` ✅
- 承接人: `null` ✅
- 赏金: $330.00
- 创建时间: **2026-02-04 16:58:09**

### ❌ 真正的问题：分页和排序

**问题**: 任务因为创建时间较早，被排除在第一页之外

**详细分析**:
1. API 默认按创建时间降序排列（`ORDER BY t.created_at DESC`）
2. API 有分页限制（默认返回 50 条）
3. 任务"特沃瑞丰我认为"创建于 **2026-02-04 16:58:09**
4. API 响应中最早的任务创建于 **2026-02-05 01:08:38**
5. 在这两个时间之间，有超过 50 个任务被创建
6. 因此，这个任务被排在第 2 页或更后面

## 验证

### API 响应分析
- 返回任务数量: 50 个
- 最新任务创建时间: 2026-02-05 02:17:00
- 最早任务创建时间: 2026-02-05 01:08:38
- 目标任务创建时间: **2026-02-04 16:58:09** ⬅️ 比所有返回的任务都早

### 数据库查询验证
```sql
SELECT COUNT(*) 
FROM tasks 
WHERE status = 'available' 
  AND assignee_id IS NULL 
  AND visibility = 'public'
  AND created_at > '2026-02-04 16:58:09';
```

结果：超过 50 个任务，导致目标任务被排除在第一页之外

## 解决方案

### 方案 1: 使用搜索功能（推荐）
在前端搜索框中输入"特沃瑞丰"或"特沃瑞丰我认为"，可以直接找到该任务。

### 方案 2: 按赏金排序
1. 在前端选择"按赏金"排序
2. 选择"降序"
3. 任务赏金 $330.00 较高，应该会出现在前面

### 方案 3: 翻页查看
向下滚动或点击"加载更多"，查看第 2 页或后续页面

### 方案 4: 更新任务（使其排在前面）
如果需要让任务出现在第一页，可以：
1. 编辑任务（任何小改动）
2. 这会更新 `updated_at` 字段
3. 如果前端按 `updated_at` 排序，任务会出现在前面

**注意**: 当前 API 按 `created_at` 排序，不是 `updated_at`

## 技术细节

### 当前 API 行为
```typescript
// packages/backend/src/services/TaskService.ts
async getAvailableTasks(
  userId: string, 
  userRole?: string,
  pagination?: PaginationParams
): Promise<Task[] | PaginatedResponse<Task>> {
  const page = pagination?.page || 1;
  const pageSize = Math.min(pagination?.pageSize || 50, 100); // 默认 50，最大 100
  
  const query = `
    SELECT ...
    FROM tasks t
    WHERE 
      t.assignee_id IS NULL
      AND (t.visibility = 'public' OR ...)
    ORDER BY t.created_at DESC  -- 按创建时间降序
    LIMIT $3 OFFSET $4
  `;
}
```

### 前端 API 调用
```typescript
// packages/frontend/src/pages/BrowseTasksPage.tsx
const loadTasks = async () => {
  const data = await taskApi.browseTasks({
    sortBy,      // 'bounty' | 'deadline' | 'priority' | 'createdAt'
    sortOrder,   // 'asc' | 'desc'
  });
  setTasks(data);
};
```

**问题**: 前端传递的 `sortBy` 参数可能没有被后端正确处理！

## 发现的代码问题

### 🔴 后端未实现动态排序

查看 `TaskService.getAvailableTasks()` 方法，发现：
- 查询**硬编码**了 `ORDER BY t.created_at DESC`
- **没有使用**前端传递的 `sortBy` 和 `sortOrder` 参数
- 前端传递 `sortBy: 'bounty'` 时，后端仍然按 `created_at` 排序

### 需要修复的代码

```typescript
// 当前代码（有问题）
const query = `
  SELECT ...
  FROM tasks t
  WHERE ...
  ORDER BY t.created_at DESC  -- ❌ 硬编码
  LIMIT $3 OFFSET $4
`;

// 应该改为（支持动态排序）
const orderByClause = this.buildOrderByClause(sortBy, sortOrder);
const query = `
  SELECT ...
  FROM tasks t
  WHERE ...
  ${orderByClause}  -- ✅ 动态排序
  LIMIT $3 OFFSET $4
`;
```

## 立即可用的解决方案

### 用户操作步骤

#### 选项 1: 搜索任务（最简单）
1. 在赏金任务页面的搜索框中输入"特沃瑞丰"
2. 任务会立即出现在搜索结果中

#### 选项 2: 按赏金排序（如果后端支持）
1. 在排序下拉框中选择"按赏金"
2. 选择"降序"
3. 任务应该出现在前面（$330.00 是较高的赏金）

**注意**: 如果选项 2 不起作用，说明后端确实没有实现动态排序，需要修复代码。

#### 选项 3: 直接访问任务
如果知道任务 ID，可以直接访问：
```
/tasks/0bfd0ac5-3cd0-4579-ace7-96a4a2c809f1
```

## 建议的代码修复

### 1. 后端支持动态排序

需要修改 `TaskService.getAvailableTasks()` 方法，支持前端传递的排序参数。

### 2. 前端显示分页信息

前端应该显示：
- 当前页码
- 总页数
- "加载更多"按钮

### 3. 添加"按更新时间排序"选项

这样最近编辑的任务会出现在前面。

## 总结

### 问题根因
**分页和排序** - 任务创建时间较早，被排除在第一页（前 50 条）之外

### 不是问题的
- ✅ 任务状态正常（available）
- ✅ 可见性正常（public）
- ✅ 无承接人（null）
- ✅ 缓存已清除
- ✅ 过滤逻辑正确

### 立即解决方案
使用搜索功能查找任务"特沃瑞丰"

### 长期解决方案
1. 修复后端动态排序功能
2. 前端添加分页控件
3. 添加"按更新时间排序"选项

## 相关文件

- `packages/backend/src/services/TaskService.ts` - getAvailableTasks 方法（需要修复）
- `packages/frontend/src/pages/BrowseTasksPage.tsx` - 前端页面（需要添加分页）
- `packages/backend/scripts/check-specific-task-status.js` - 诊断脚本

## 完成时间
2026-02-05

## 状态
✅ 问题已诊断，根因已找到
⚠️  需要代码修复以支持动态排序
💡 用户可以使用搜索功能立即找到任务
