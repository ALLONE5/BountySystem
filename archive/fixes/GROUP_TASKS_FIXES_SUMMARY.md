# 组群任务修复总结

## 修复内容

### 1. 删除按钮行为统一 ✅

**问题**: 组群任务中，进行中的任务也显示删除按钮

**解决方案**: 统一删除按钮逻辑，与普通任务保持一致
- 只有发布者可以删除任务
- 只能删除"未开始"和"可承接"状态的任务
- 进行中、已完成、已放弃的任务不能删除

**修改文件**: `packages/frontend/src/pages/TaskListPage.tsx`

**代码变更**:
```typescript
// 删除按钮逻辑
// 发布者只能删除未开始和可承接状态的任务（与普通任务保持一致）
const canDelete = onDeleteTask && isPublisher && (
  record.status === TaskStatus.NOT_STARTED || record.status === TaskStatus.AVAILABLE
);
```

### 2. 子任务数量徽章调试 🔍

**问题**: 组群任务列表中没有显示子任务数量徽章

**已添加的调试日志**:

1. **GroupsPage.tsx** - 加载组群任务时:
```typescript
console.log('[GroupsPage] Loaded group tasks:', tasks.length, 'tasks');
console.log('[GroupsPage] Tasks with parentId:', tasks.filter(t => t.parentId).length);
console.log('[GroupsPage] Top-level tasks:', tasks.filter(t => !t.parentId).length);
```

2. **TaskListPage.tsx** - 任务列表更新时:
```typescript
console.log('[TaskListPage] Total tasks:', tasks.length);
console.log('[TaskListPage] Tasks with parentId:', tasks.filter(t => t.parentId).map(...));
console.log('[TaskListPage] Top-level tasks:', tasks.filter(t => !t.parentId).length);
```

3. **TaskListPage.tsx** - 计算子任务数量时:
```typescript
console.log(`[TaskListPage] Task ${taskId} has ${count} subtasks:`, subtasks.map(...));
```

## 如何验证修复

### 验证删除按钮

1. 打开组群详情页面
2. 查看任务列表中的删除按钮
3. **预期行为**:
   - 只有发布者能看到删除按钮
   - 只有"未开始"和"可承接"状态的任务显示删除按钮
   - "进行中"、"已完成"、"已放弃"的任务不显示删除按钮

### 验证子任务数量徽章

1. 打开浏览器开发者工具（F12）
2. 切换到 Console 标签
3. 打开组群详情页面
4. 查看控制台输出

**预期输出**:
```
[GroupsPage] Loaded group tasks: X tasks
[GroupsPage] Tasks with parentId: Y
[GroupsPage] Top-level tasks: Z
[TaskListPage] Total tasks: X
[TaskListPage] Tasks with parentId: [...]
[TaskListPage] Top-level tasks: Z
```

**如果有子任务，还会看到**:
```
[TaskListPage] Task xxx-xxx-xxx has N subtasks: [...]
```

### 可能的情况

#### 情况 1: 没有子任务
如果控制台显示:
```
[GroupsPage] Tasks with parentId: 0
[TaskListPage] Tasks with parentId: []
```

**说明**: 组群任务中确实没有子任务，这是正常的。需要先创建子任务才能看到徽章。

**解决方法**: 
1. 在组群任务详情中创建子任务
2. 刷新页面查看徽章是否显示

#### 情况 2: 有子任务但徽章不显示
如果控制台显示有子任务，但徽章不显示:
```
[GroupsPage] Tasks with parentId: 3
[TaskListPage] Task xxx has 2 subtasks: [...]
```

**说明**: 数据正确，但渲染有问题。

**需要检查**:
1. Badge 组件是否正确渲染
2. CSS 样式是否被覆盖
3. 浏览器控制台是否有其他错误

#### 情况 3: 后端没有返回子任务
如果 GroupsPage 显示的任务数量与 TaskListPage 不一致:
```
[GroupsPage] Loaded group tasks: 5 tasks
[TaskListPage] Total tasks: 3
```

**说明**: 数据在传递过程中丢失。

**需要检查**:
1. 后端 API 返回的数据
2. 前端 API 客户端的数据处理
3. GroupsPage 到 TaskListPage 的 props 传递

## 后端实现确认

后端 `GroupService.getGroupTasks()` 方法已正确实现:
- 返回所有任务（包括子任务）
- 正确映射 `parent_id` 为 `parentId`
- 包含所有必要的字段

```typescript
SELECT 
  t.*,
  t.parent_id as "parentId",
  ...
FROM tasks t
WHERE t.group_id = $1
ORDER BY t.created_at DESC
```

## 下一步

1. **立即测试**: 刷新页面，查看删除按钮是否按预期工作
2. **查看控制台**: 打开开发者工具，查看调试日志
3. **报告结果**: 将控制台输出发送给我，以便进一步诊断子任务徽章问题

## 相关文件

- `packages/frontend/src/pages/TaskListPage.tsx` - 任务列表组件
- `packages/frontend/src/pages/GroupsPage.tsx` - 组群页面
- `packages/backend/src/services/GroupService.ts` - 组群服务（后端）
- `packages/backend/src/routes/group.routes.ts` - 组群路由（后端）
