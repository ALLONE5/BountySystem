# 备份前端表格按钮调试报告

## 问题描述

在对比两个前端时发现：
- **5173端口（工作前端）**: 表格中显示完整的操作按钮（发布、编辑、删除、指派等）
- **5174端口（备份前端）**: 表格中只显示"编辑"按钮，其他按钮缺失

## 调查过程

### 第一阶段：代码对比

对比了以下关键文件，发现实现完全相同：

1. **TaskListPage.tsx** - Props 传递层
2. **TaskListContainer.tsx** - 容器组件，管理状态和业务逻辑
3. **TaskListTable.tsx** - 表格组件，渲染按钮
4. **PublishedTasksPage.tsx** - 页面组件，提供回调函数
5. **PublishedTasksActions.tsx** - 操作 Hook

结论：代码层面没有差异，问题可能出在运行时。

### 第二阶段：Props 传递链分析

```
PublishedTasksPage
  ├─ showAssignButton={true}
  ├─ onAssignTask={handleAssignTask}
  ├─ onPublishTask={taskActions.handlePublishTask}
  ├─ onCompleteTask={taskActions.handleCompleteTask}
  ├─ onEditTask={handleEdit}
  ├─ onDeleteTask={taskActions.handleDeleteTask}
  └─ isPublishedTasksPage={true}
      ↓
TaskListPage
  └─ {...props} (扩展运算符传递所有 props)
      ↓
TaskListContainer
  └─ {...actionProps} (扩展运算符传递所有 action props)
      ↓
TaskListTable
  └─ 根据 props 和任务状态渲染按钮
```

Props 传递链看起来正确，但需要运行时验证。

### 第三阶段：添加调试日志

在 `packages/frontend-bak/src/components/TaskList/TaskListTable.tsx` 中添加了三层调试日志：

#### 1. Props 级别日志
```typescript
console.log('[TaskListTable] Props:', {
  showAssignButton,
  showAcceptButton,
  hasOnCompleteTask: !!onCompleteTask,
  hasOnPublishTask: !!onPublishTask,
  hasOnEditTask: !!onEditTask,
  hasOnJoinGroup: !!onJoinGroup,
  hasOnDeleteTask: !!onDeleteTask,
  isPublishedTasksPage,
  isGroupTasksPage,
  hasUser: !!user,
  userId: user?.id,
  hasActions
});
```

这将显示组件接收到的所有 props 状态。

#### 2. 任务级别日志
```typescript
console.log(`[TaskListTable] Task ${record.id} (${record.name}):`, {
  status: record.status,
  publisherId: record.publisherId,
  assigneeId: record.assigneeId,
  isPublisher,
  isAssignee,
  isNotStarted,
  canPublish,
  canAssign,
  canAccept,
  canDelete,
  willShowEditButton: isPublishedTasksPage && isPublisher && !!onEditTask
});
```

这将显示每个任务的状态和权限判断结果。

#### 3. 按钮结果日志
```typescript
console.log(`[TaskListTable] Task ${record.id} final buttons:`, buttons.map(b => b?.key));
```

这将显示最终渲染的按钮列表。

## 按钮显示逻辑

### 发布按钮
```typescript
canPublish = onPublishTask && isPublisher && isNotStarted
```
- 需要 `onPublishTask` 回调函数
- 当前用户必须是任务发布者
- 任务状态必须是 `NOT_STARTED`

### 编辑按钮（我的悬赏页面）
```typescript
isPublishedTasksPage && isPublisher && onEditTask
```
- 必须在"我的悬赏"页面
- 当前用户必须是任务发布者
- 需要 `onEditTask` 回调函数

### 指派按钮
```typescript
canAssign = showAssignButton && !record.assigneeId && (
  record.status === TaskStatus.NOT_STARTED || 
  record.status === TaskStatus.AVAILABLE
)
```
- `showAssignButton` 必须为 true
- 任务尚未指派（无 assigneeId）
- 任务状态是 `NOT_STARTED` 或 `AVAILABLE`

### 删除按钮
```typescript
canDelete = onDeleteTask && isPublisher && (
  record.status === TaskStatus.NOT_STARTED || 
  record.status === TaskStatus.AVAILABLE
)
```
- 需要 `onDeleteTask` 回调函数
- 当前用户必须是任务发布者
- 任务状态是 `NOT_STARTED` 或 `AVAILABLE`

## 可能的问题原因

基于按钮显示逻辑，可能的原因包括：

### 1. User 对象问题
- ❌ `user` 为 null 或 undefined
- ❌ `user.id` 与任务的 `publisherId` 不匹配
- ❌ 用户认证状态异常

### 2. 任务状态问题
- ❌ 任务状态不是 `NOT_STARTED`
- ❌ 任务已被指派（有 assigneeId）
- ❌ 任务状态是 `COMPLETED` 或其他终态

### 3. Props 传递问题
- ❌ 回调函数未正确传递到 TaskListTable
- ❌ `isPublishedTasksPage` 标志未设置
- ❌ `showAssignButton` 未设置为 true

### 4. 数据加载问题
- ❌ 任务数据加载失败或不完整
- ❌ 用户数据加载失败或不完整

## 调试步骤

### 1. 重启备份前端
```bash
# 使用提供的批处理脚本
restart-bak-debug.bat

# 或手动执行
cd packages/frontend-bak
npm run dev
```

### 2. 打开浏览器控制台
1. 访问 http://localhost:5174
2. 使用 admin 账号登录
3. 打开开发者工具（F12）
4. 切换到 Console 标签
5. 导航到"我的悬赏"页面

### 3. 分析日志输出

#### 检查 Props 日志
```
[TaskListTable] Props: {
  showAssignButton: true/false,
  hasOnPublishTask: true/false,
  hasOnEditTask: true/false,
  hasOnDeleteTask: true/false,
  isPublishedTasksPage: true/false,
  hasUser: true/false,
  userId: "xxx" or undefined,
  hasActions: true/false
}
```

如果所有值都是 false 或 undefined，说明 props 传递有问题。

#### 检查任务日志
```
[TaskListTable] Task xxx (任务名称): {
  status: "NOT_STARTED" or other,
  publisherId: "xxx",
  assigneeId: "xxx" or null,
  isPublisher: true/false,
  canPublish: true/false,
  canAssign: true/false,
  canDelete: true/false,
  willShowEditButton: true/false
}
```

检查每个条件是否满足。

#### 检查按钮结果
```
[TaskListTable] Task xxx final buttons: ["edit", "publish", "delete", ...]
```

查看实际渲染的按钮列表。

### 4. 对比工作前端

在 5173 端口的工作前端中执行相同的操作，对比日志输出，找出差异。

## 临时解决方案

如果确认是特定条件导致的问题，可以临时修改条件：

```typescript
// 临时放宽发布按钮显示条件
const canPublish = onPublishTask && isPublisher; // 移除 isNotStarted 检查

// 临时放宽删除按钮显示条件
const canDelete = onDeleteTask && isPublisher; // 移除状态检查
```

## 下一步

1. 运行调试脚本并查看控制台输出
2. 根据日志输出确定具体问题
3. 对比两个前端的日志差异
4. 实施针对性修复

## 相关文件

- `packages/frontend-bak/src/components/TaskList/TaskListTable.tsx` - 已添加调试日志
- `packages/frontend-bak/src/pages/PublishedTasksPage.tsx` - Props 来源
- `packages/frontend-bak/src/components/TaskList/TaskListContainer.tsx` - Props 中转
- `restart-bak-debug.bat` - 重启脚本
- `debug-buttons.html` - 浏览器端调试指南
- `FRONTEND_BAK_ISSUE_SUMMARY.md` - 问题总结

---

**创建日期**: 2026-03-12  
**状态**: 调试中  
**下一步**: 运行调试并分析日志输出
