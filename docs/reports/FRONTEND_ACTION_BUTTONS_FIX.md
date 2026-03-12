# 前端操作按钮缺失问题修复报告

## 问题描述

5173（当前前端）的"我的悬赏"页面表格操作栏只显示"编辑"按钮，而备份前端（5174）显示了完整的按钮集合，包括：
- 发布
- 编辑
- 指派
- 删除
- 转移

## 问题分析

### 按钮显示条件

根据 `packages/frontend/src/components/TaskList/TaskListTable.tsx` 的代码逻辑：

1. **发布按钮**
   - 条件：`onPublishTask && isPublisher && status === 'NOT_STARTED'`
   - 只有任务状态为 `NOT_STARTED` 且用户是发布者时才显示

2. **编辑按钮**
   - 条件：`isPublishedTasksPage && isPublisher && onEditTask`
   - 在"我的悬赏"页面且用户是发布者时显示

3. **指派按钮**
   - 条件：`showAssignButton && !assigneeId && (status === 'NOT_STARTED' || status === 'AVAILABLE')`
   - 任务未被承接且状态为 `NOT_STARTED` 或 `AVAILABLE` 时显示

4. **删除按钮**
   - 条件：`onDeleteTask && isPublisher && (status === 'NOT_STARTED' || status === 'AVAILABLE')`
   - 用户是发布者且任务状态为 `NOT_STARTED` 或 `AVAILABLE` 时显示

### 可能的原因

如果只显示"编辑"按钮，说明：
1. ✅ `isPublishedTasksPage` 为 true
2. ✅ 用户是任务发布者
3. ✅ `onEditTask` prop 已传递
4. ❌ 任务状态不是 `NOT_STARTED` 或 `AVAILABLE`（导致其他按钮不显示）

## 诊断步骤

1. **打开调试工具**
   - 在浏览器中打开 `debug-action-buttons.html`
   - 或直接访问 http://localhost:5173 并打开浏览器控制台

2. **检查任务状态**
   ```javascript
   // 在浏览器控制台执行
   const token = localStorage.getItem('token');
   fetch('http://localhost:3001/api/tasks/published', {
     headers: { 'Authorization': `Bearer ${token}` }
   })
   .then(r => r.json())
   .then(data => {
     const tasks = data.data || data;
     console.table(tasks.map(t => ({
       name: t.name,
       status: t.status,
       publisherId: t.publisherId,
       assigneeId: t.assigneeId
     })));
   });
   ```

3. **查看控制台日志**
   - 查找包含 `[5173 TaskListTable]` 的日志
   - 检查每个任务的按钮渲染条件
   - 确认 `status` 字段的值

## 预期发现

如果任务状态是以下之一，则不会显示"发布"、"指派"、"删除"按钮：
- `IN_PROGRESS` - 进行中
- `PENDING_REVIEW` - 待审核
- `COMPLETED` - 已完成
- `CANCELLED` - 已取消
- `PENDING_ACCEPTANCE` - 待接受

## 解决方案

### 方案 1：修复任务状态（推荐）

如果任务应该显示这些按钮，但状态不正确，需要：

1. 检查任务创建时的默认状态
2. 确保新创建的任务状态为 `NOT_STARTED`
3. 检查任务状态转换逻辑是否正确

### 方案 2：调整按钮显示逻辑

如果需要在更多状态下显示按钮，可以修改 `TaskListTable.tsx` 中的条件：

```typescript
// 例如：允许在 PENDING_ACCEPTANCE 状态下也显示删除按钮
const canDelete = onDeleteTask && isPublisher && (
  record.status === TaskStatus.NOT_STARTED || 
  record.status === TaskStatus.AVAILABLE ||
  record.status === TaskStatus.PENDING_ACCEPTANCE  // 新增
);
```

### 方案 3：添加状态转换按钮

如果任务卡在某个状态，可以添加"重置状态"或"撤回"按钮：

```typescript
// 添加撤回按钮
if (isPublisher && record.status === TaskStatus.PENDING_ACCEPTANCE) {
  buttons.push(
    <Button
      key="recall"
      size="small"
      onClick={(e) => {
        e.stopPropagation();
        // 调用撤回 API，将状态改回 NOT_STARTED
      }}
    >
      撤回
    </Button>
  );
}
```

## 测试验证

修复后，在"我的悬赏"页面应该看到：

1. **NOT_STARTED 状态的任务**：
   - ✅ 发布按钮
   - ✅ 编辑按钮
   - ✅ 指派按钮
   - ✅ 删除按钮

2. **AVAILABLE 状态的任务**：
   - ✅ 编辑按钮
   - ✅ 指派按钮
   - ✅ 删除按钮

3. **其他状态的任务**：
   - ✅ 编辑按钮（仅此一个）

## 相关文件

- `packages/frontend/src/components/TaskList/TaskListTable.tsx` - 按钮渲染逻辑
- `packages/frontend/src/pages/PublishedTasksPage.tsx` - 页面组件
- `packages/frontend/src/types/index.ts` - 任务状态定义
- `packages/backend/src/models/Task.ts` - 后端任务模型
