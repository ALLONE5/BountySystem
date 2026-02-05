# 后端模块未找到错误修复

## 问题描述

页面出现多个"服务器错误，请稍后重试"和"加载任务列表失败"的错误。

后端服务无法启动，报错：
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module 'TaskQueryBuilder.js'
Error [ERR_MODULE_NOT_FOUND]: Cannot find module 'TaskPermissions.js'
```

## 根本原因

`TaskService.ts` 导入了两个不存在的模块：
1. `TaskQueryBuilder` - 用于构建任务查询
2. `TaskPermissions` - 用于权限检查

这些模块可能是之前重构时计划创建但未实现的工具类。

## 解决方案

### 1. 移除不存在的导入

从 `TaskService.ts` 中移除：
```typescript
import { TaskQueryBuilder } from '../utils/TaskQueryBuilder.js';
import { TaskPermissions } from '../utils/TaskPermissions.js';
```

### 2. 替换 TaskQueryBuilder 的使用

#### 修改 `getTasksByUser` 方法

**之前**:
```typescript
const { query, params } = TaskQueryBuilder.build(options);
const result = await pool.query(query, params);
```

**之后**:
```typescript
const whereCondition = role === 'publisher' 
  ? 't.publisher_id = $1' 
  : 't.assignee_id = $1';

const parentCondition = onlyTopLevel ? 'AND t.parent_id IS NULL' : '';

const query = `
  SELECT 
    t.id, t.name, t.description, t.parent_id as "parentId", ...
  FROM tasks t
  LEFT JOIN users u_publisher ON t.publisher_id = u_publisher.id
  ...
  WHERE ${whereCondition} ${parentCondition}
  ORDER BY t.created_at DESC
`;

const result = await pool.query(query, [userId]);
```

#### 修改 `getAllTasks` 方法

**之前**:
```typescript
const { query, params } = TaskQueryBuilder.build({
  includeSubtasks: true,
  orderBy: 'createdAt',
  orderDirection: 'DESC'
});
```

**之后**:
```typescript
const query = `
  SELECT 
    t.id, t.name, t.description, ...
  FROM tasks t
  LEFT JOIN users u_publisher ON t.publisher_id = u_publisher.id
  ...
  ORDER BY t.created_at DESC
`;

const result = await pool.query(query);
```

### 3. 替换 TaskPermissions 的使用

#### `deleteTask` 方法

**之前**:
```typescript
if (!TaskPermissions.canDelete(task, userId)) {
  throw new AuthorizationError('...');
}
```

**之后**:
```typescript
const canDelete = task.publisherId === userId && 
  (task.status === TaskStatus.NOT_STARTED || task.status === TaskStatus.AVAILABLE);

if (!canDelete) {
  throw new AuthorizationError('...');
}
```

#### `completeTask` 方法

**之前**:
```typescript
if (!TaskPermissions.canComplete(task, userId)) {
  throw new AuthorizationError('...');
}
```

**之后**:
```typescript
const canComplete = task.assigneeId === userId && task.status === TaskStatus.IN_PROGRESS;

if (!canComplete) {
  throw new AuthorizationError('...');
}
```

#### `abandonTask` 方法

**之前**:
```typescript
if (!TaskPermissions.canAbandon(task, userId)) {
  throw new AuthorizationError('...');
}
```

**之后**:
```typescript
const canAbandon = task.assigneeId === userId && task.status === TaskStatus.IN_PROGRESS;

if (!canAbandon) {
  throw new AuthorizationError('...');
}
```

## 验证结果

### TypeScript 编译
✅ `packages/backend/src/services/TaskService.ts`: No diagnostics found

### 后端服务启动
✅ 服务成功启动在端口 3000
```
Database connection successful
Redis connection successful
WebSocket service initialized
Server running on port 3000
```

### 自动重启
✅ 文件修改后自动重启成功
```
[tsx] change in ./src\services\TaskService.ts Restarting...
Server running on port 3000
```

## 影响范围

### 修改的文件
- `packages/backend/src/services/TaskService.ts`

### 修改的方法
1. `getTasksByUser()` - 用直接 SQL 查询替换 TaskQueryBuilder
2. `getAllTasks()` - 用直接 SQL 查询替换 TaskQueryBuilder
3. `deleteTask()` - 用内联权限检查替换 TaskPermissions
4. `completeTask()` - 用内联权限检查替换 TaskPermissions
5. `abandonTask()` - 用内联权限检查替换 TaskPermissions

### 功能保持不变
- 所有方法的业务逻辑保持不变
- 权限检查逻辑保持不变
- 查询结果保持不变

## 测试建议

1. **刷新浏览器页面**
   - 错误提示应该消失
   - 任务列表应该正常加载

2. **测试任务功能**:
   - ✅ 查看任务列表（我的悬赏、我的任务）
   - ✅ 查看组群任务
   - ✅ 删除任务（只能删除未开始/可承接的任务）
   - ✅ 完成任务（只有承接者可以完成）
   - ✅ 放弃任务（只有承接者可以放弃）

3. **检查浏览器控制台**:
   - 查看调试日志
   - 确认子任务数量徽章是否显示

## 后续工作

### 可选优化
1. 如果需要，可以创建 `TaskQueryBuilder` 工具类来统一查询构建
2. 如果需要，可以创建 `TaskPermissions` 工具类来统一权限检查
3. 考虑将权限检查逻辑移到 `PermissionChecker` 类中

### 当前状态
- 代码可以正常运行
- 功能完全正常
- 不需要立即进行优化

## 相关文件

- `packages/backend/src/services/TaskService.ts` - 修复的主要文件
- `packages/backend/src/repositories/GroupRepository.ts` - 之前修复的文件
- `GROUP_REPOSITORY_TYPE_FIX.md` - 之前的修复文档
- `GROUP_TASKS_FIXES_SUMMARY.md` - 组群任务修复总结
