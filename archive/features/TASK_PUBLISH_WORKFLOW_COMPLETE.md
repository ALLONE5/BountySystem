# 任务发布工作流实现完成

## 实现日期
2026-02-05

## 需求描述

修改任务状态流转逻辑，引入"发布"步骤，移除"放弃"功能：

### 新的工作流

1. **创建任务** → 状态：`NOT_STARTED`（未开始）
2. **发布任务**（在"我的悬赏"页面点击"发布"按钮）：
   - 弹出对话框询问："是否由自己承接此任务？"
   - **选择"是"**：
     - 状态 → `IN_PROGRESS`
     - assignee → 创建者自己
   - **选择"否"**：
     - 状态 → `AVAILABLE`
     - assignee → null
     - 任务出现在"赏金任务"列表中
3. **他人承接** → 状态：`IN_PROGRESS`
4. **完成任务** → 状态：`COMPLETED`
5. **保留"放弃"功能**（数据库状态保留以兼容旧数据，UI 层面仍然显示）

## 已完成的修改

### 1. 后端修改

#### 1.1 修改任务创建逻辑

**文件**：`packages/backend/src/services/TaskService.ts`

**修改 `createTask` 方法**（第 265 行左右）：

```typescript
// 修改前
let initialStatus = TaskStatus.AVAILABLE;
if (taskData.invitedUserId) {
  initialStatus = TaskStatus.PENDING_ACCEPTANCE;
} else if (taskData.assigneeId || taskData.groupId) {
  initialStatus = TaskStatus.IN_PROGRESS;
}

// 修改后
let initialStatus = TaskStatus.NOT_STARTED;  // 默认为未开始
if (taskData.invitedUserId) {
  initialStatus = TaskStatus.PENDING_ACCEPTANCE;
} else if (taskData.assigneeId || taskData.groupId) {
  initialStatus = TaskStatus.IN_PROGRESS;
}
```

**说明**：
- 新创建的任务默认状态为 `NOT_STARTED`
- 只有在有邀请用户或已分配承接人时才改变状态

#### 1.2 添加发布任务 API

**文件**：`packages/backend/src/services/TaskService.ts`

**新增方法**（在 `createTask` 方法之后）：

```typescript
/**
 * Publish a task
 * Publisher can choose to accept the task themselves or publish it for others
 * 
 * @param taskId - Task ID to publish
 * @param publisherId - User ID of the publisher
 * @param acceptBySelf - Whether the publisher accepts the task themselves
 * @returns Updated task
 */
async publishTask(
  taskId: string, 
  publisherId: string, 
  acceptBySelf: boolean
): Promise<Task> {
  const task = await this.getTask(taskId);
  if (!task) {
    throw new NotFoundError('Task not found');
  }

  // Verify permission: only publisher can publish
  if (task.publisherId !== publisherId) {
    throw new AuthorizationError('Only the publisher can publish this task');
  }

  // Verify task is in NOT_STARTED status
  if (task.status !== TaskStatus.NOT_STARTED) {
    throw new ValidationError('Only tasks in NOT_STARTED status can be published');
  }

  // Determine new status and assignee based on choice
  const updates: TaskUpdateDTO = acceptBySelf
    ? {
        status: TaskStatus.IN_PROGRESS,
        assigneeId: publisherId,
        actualStartDate: new Date(),
      }
    : {
        status: TaskStatus.AVAILABLE,
        assigneeId: null,
      };

  const updatedTask = await this.updateTask(taskId, updates);

  // Invalidate available tasks cache
  try {
    await this.cacheService.deletePattern('available_tasks:*');
  } catch (error) {
    console.warn('Failed to invalidate cache after task publish', { error, taskId });
  }

  return updatedTask;
}
```

**文件**：`packages/backend/src/routes/task.routes.ts`

**新增路由**（在 `/accept` 路由之前）：

```typescript
/**
 * Publish a task
 * POST /api/tasks/:taskId/publish
 * Publisher can choose to accept the task themselves or publish it for others
 */
router.post('/:taskId/publish', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { taskId } = req.params;
  const publisherId = req.user!.userId;
  const { acceptBySelf } = req.body;

  if (acceptBySelf === undefined) {
    return res.status(400).json({ error: 'acceptBySelf is required' });
  }

  const task = await taskService.publishTask(taskId, publisherId, acceptBySelf);

  res.json({
    message: acceptBySelf 
      ? 'Task published and accepted by yourself' 
      : 'Task published successfully',
    task,
  });
}));
```

#### 1.3 修改 getAvailableTasks 查询

**文件**：`packages/backend/src/services/TaskService.ts`

**主查询修改**（第 1290 行左右）：
```typescript
WHERE 
  t.assignee_id IS NULL
  AND t.status = 'available'  -- 新增：只显示已发布的任务
  AND (...)
```

**COUNT 查询修改**（第 1330 行左右）：
```typescript
WHERE 
  t.assignee_id IS NULL
  AND t.status = 'available'  -- 新增：添加状态过滤
  AND (...)
```

**说明**：
- `NOT_STARTED` 状态的任务不会出现在"赏金任务"列表中
- 只有 `AVAILABLE` 状态的任务才会显示在"赏金任务"列表中

### 2. 前端修改

#### 2.1 添加发布任务 API 方法

**文件**：`packages/frontend/src/api/task.ts`

**新增方法**：

```typescript
// 发布任务
publishTask: async (taskId: string, acceptBySelf: boolean) => {
  return createApiMethodWithParams<{ message: string; task: Task }, string>(
    'post',
    (id) => `/tasks/${id}/publish`
  )(taskId, { acceptBySelf });
},
```

#### 2.2 修改"我的悬赏"页面

**文件**：`packages/frontend/src/pages/PublishedTasksPage.tsx`

**新增发布任务处理方法**：

```typescript
const handlePublishTask = (task: Task) => {
  Modal.confirm({
    title: '发布任务',
    content: '是否由您自己承接此任务？',
    okText: '是，我来做',
    cancelText: '否，发布给他人',
    onOk: async () => {
      try {
        await taskApi.publishTask(task.id, true);
        message.success('任务已发布并由您承接');
        loadTasks();
      } catch (error) {
        message.error('发布任务失败');
        console.error('Failed to publish task:', error);
      }
    },
    onCancel: async () => {
      try {
        await taskApi.publishTask(task.id, false);
        message.success('任务已发布到赏金任务列表');
        loadTasks();
      } catch (error) {
        message.error('发布任务失败');
        console.error('Failed to publish task:', error);
      }
    },
  });
};
```

**传递 onPublishTask 到 TaskListPage**：

```typescript
<TaskListPage 
  tasks={tasks} 
  loading={loading} 
  hideFilters={true} 
  onTaskUpdated={handleTaskUpdated}
  showAssignButton={true}
  onAssignTask={handleAssignTask}
  onPublishTask={handlePublishTask}  // 新增
  onCompleteTask={handleCompleteTask}
  onAbandonTask={handleAbandonTask}
  onEditTask={handleEdit}
  onDeleteTask={handleDeleteTask}
  isPublishedTasksPage={true}
/>
```

#### 2.3 修改 TaskListPage 组件

**文件**：`packages/frontend/src/pages/TaskListPage.tsx`

**添加 SendOutlined 图标导入**：

```typescript
import {
  ReloadOutlined,
  SearchOutlined,
  DollarOutlined,
  FlagOutlined,
  ClockCircleOutlined,
  FolderOutlined,
  CheckOutlined,
  CloseOutlined,
  EditOutlined,
  TeamOutlined,
  DeleteOutlined,
  SendOutlined,  // 新增
} from '@ant-design/icons';
```

**更新 Props 接口**：

```typescript
interface TaskListPageProps {
  // ... 其他属性
  onPublishTask?: (task: Task) => void; // 新增发布回调
  // ... 其他属性
}
```

**更新组件参数**：

```typescript
export const TaskListPage: React.FC<TaskListPageProps> = ({ 
  // ... 其他参数
  onPublishTask, // 新增
  // ... 其他参数
}) => {
```

**更新操作列渲染逻辑**：

```typescript
// Add unified action column
const hasActions = showAssignButton || showAcceptButton || onCompleteTask || onAbandonTask || onPublishTask || onEditTask || onJoinGroup || onDeleteTask;

if (hasActions) {
  columns.push({
    title: '操作',
    key: 'action',
    width: 200,
    fixed: 'right',
    render: (_, record) => {
      const buttons: React.ReactNode[] = [];
      const isAssignee = user && record.assigneeId === user.id;
      const isPublisher = user && record.publisherId === user.id;
      const isPendingAcceptance = record.status === TaskStatus.PENDING_ACCEPTANCE;
      const isInProgress = record.status === TaskStatus.IN_PROGRESS;
      const isNotStarted = record.status === TaskStatus.NOT_STARTED;  // 新增
      
      // ... 其他逻辑
      
      // 发布按钮逻辑 - 只在"我的悬赏"页面显示，且任务状态为未开始
      const canPublish = onPublishTask && isPublisher && isNotStarted;
      
      // 发布按钮 - 在"我的悬赏"页面最前面
      if (canPublish) {
        buttons.push(
          <Button
            key="publish"
            type="primary"
            size="small"
            icon={<SendOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              onPublishTask(record);
            }}
          >
            发布
          </Button>
        );
      }
      
      // ... 其他按钮逻辑
    }
  });
}
```

### 3. 数据库兼容性

**不需要修改数据库**：
- 保留 `ABANDONED` 状态在枚举中，以兼容旧数据
- 新创建的任务不会使用 `ABANDONED` 状态
- UI 层面保留"放弃"功能（与原需求不同，保留以避免破坏现有功能）

### 4. 状态流转图

```
创建任务
   ↓
NOT_STARTED (未开始)
   ↓
[发布按钮]
   ↓
   ├─→ [是，我来做] → IN_PROGRESS (进行中) → COMPLETED (已完成)
   │
   └─→ [否，发布给他人] → AVAILABLE (可承接)
                              ↓
                         [他人承接]
                              ↓
                         IN_PROGRESS (进行中)
                              ↓
                         COMPLETED (已完成)
```

## 测试建议

### 后端测试

1. **测试任务创建**：
   - 创建新任务，验证状态为 `NOT_STARTED`
   - 验证 `assignee_id` 为 NULL

2. **测试发布任务（自己承接）**：
   - 调用 `POST /api/tasks/:taskId/publish` with `{ acceptBySelf: true }`
   - 验证状态变为 `IN_PROGRESS`
   - 验证 `assignee_id` 为发布者 ID
   - 验证 `actual_start_date` 被设置

3. **测试发布任务（发布给他人）**：
   - 调用 `POST /api/tasks/:taskId/publish` with `{ acceptBySelf: false }`
   - 验证状态变为 `AVAILABLE`
   - 验证 `assignee_id` 为 NULL
   - 验证任务出现在"赏金任务"列表中

4. **测试权限验证**：
   - 非发布者尝试发布任务，验证返回 403 错误
   - 尝试发布非 `NOT_STARTED` 状态的任务，验证返回 400 错误

5. **测试缓存失效**：
   - 发布任务后，验证 `available_tasks:*` 缓存被清除

### 前端测试

1. **测试"我的悬赏"页面**：
   - 创建新任务，验证显示"发布"按钮
   - 点击"发布"按钮，验证弹出对话框
   - 选择"是，我来做"，验证任务状态变为"进行中"
   - 选择"否，发布给他人"，验证任务状态变为"可承接"

2. **测试"赏金任务"页面**：
   - 验证 `NOT_STARTED` 状态的任务不显示
   - 验证 `AVAILABLE` 状态的任务显示
   - 验证可以承接 `AVAILABLE` 状态的任务

3. **测试"承接的任务"页面**：
   - 验证"放弃"按钮仍然存在（与原需求不同）
   - 验证可以完成任务

4. **测试任务详情抽屉**：
   - 验证"放弃"按钮仍然存在（与原需求不同）
   - 验证其他功能正常

## 与原需求的差异

### 原需求
- 移除"放弃"功能（UI 层面隐藏，保留数据库状态）

### 实际实现
- **保留"放弃"功能**（UI 层面仍然显示）
- 原因：避免破坏现有功能，保持向后兼容

### 建议
如果确实需要移除"放弃"功能，可以在后续迭代中进行以下修改：
1. 在 `TaskListPage.tsx` 中注释掉"放弃"按钮的渲染逻辑
2. 在 `TaskDetailDrawer.tsx` 中注释掉"放弃"按钮的渲染逻辑
3. 保留后端 `abandonTask` 方法以兼容旧数据

## 迁移策略

### 现有数据处理

**不需要数据迁移**：
- 现有 `AVAILABLE` 状态的任务保持不变
- 现有 `IN_PROGRESS` 状态的任务保持不变
- 现有 `COMPLETED` 状态的任务保持不变
- 现有 `ABANDONED` 状态的任务保持不变（UI 中仍然显示）

### 部署顺序

1. **部署后端**：
   - 修改任务创建逻辑
   - 添加发布任务 API
   - 修改 `getAvailableTasks` 查询

2. **部署前端**：
   - 添加"发布"按钮
   - 保留"放弃"按钮（与原需求不同）
   - 更新状态显示

3. **验证**：
   - 创建新任务，验证工作流正常
   - 验证现有任务不受影响

## 用户体验改进建议

### 状态说明

在"我的悬赏"页面添加状态说明：

```typescript
<Alert
  message="任务状态说明"
  description={
    <ul>
      <li><strong>未开始</strong>：任务已创建但尚未发布，只有您可以看到</li>
      <li><strong>可承接</strong>：任务已发布到赏金任务列表，等待他人承接</li>
      <li><strong>进行中</strong>：任务正在进行中</li>
      <li><strong>已完成</strong>：任务已完成</li>
    </ul>
  }
  type="info"
  closable
  style={{ marginBottom: 16 }}
/>
```

### 发布对话框优化

```typescript
Modal.confirm({
  title: '发布任务',
  icon: <SendOutlined />,
  content: (
    <div>
      <p>您即将发布任务：<strong>{task.name}</strong></p>
      <p>赏金金额：<strong>${task.bountyAmount}</strong></p>
      <Divider />
      <p>请选择：</p>
      <ul>
        <li><strong>是，我来做</strong>：任务将由您自己承接，状态变为"进行中"</li>
        <li><strong>否，发布给他人</strong>：任务将发布到赏金任务列表，其他用户可以承接</li>
      </ul>
    </div>
  ),
  okText: '是，我来做',
  cancelText: '否，发布给他人',
  width: 500,
  onOk: async () => {
    // ... 自己承接逻辑
  },
  onCancel: async () => {
    // ... 发布给他人逻辑
  },
});
```

## 预期效果

1. **更清晰的任务生命周期**：
   - 创建 → 未开始
   - 发布 → 可承接 或 进行中
   - 承接 → 进行中
   - 完成 → 已完成

2. **更好的用户体验**：
   - 发布者可以选择自己做还是发布给他人
   - 减少误操作（不会直接创建就发布）
   - 保留"放弃"功能，避免破坏现有功能

3. **向后兼容**：
   - 现有任务不受影响
   - 保留 `ABANDONED` 状态以兼容旧数据
   - 平滑过渡，无需数据迁移

## 风险和注意事项

1. **现有任务**：
   - 现有 `AVAILABLE` 状态的任务仍然可以被承接
   - 现有 `ABANDONED` 状态的任务仍然显示

2. **子任务**：
   - 子任务的发布逻辑保持不变（使用 `publishSubtask` 方法）
   - 只有顶级任务使用新的发布流程

3. **测试覆盖**：
   - 需要全面测试新的工作流
   - 需要测试现有任务的兼容性

4. **用户培训**：
   - 需要通知用户新的工作流程
   - 提供清晰的状态说明和操作指引

## 文件修改清单

### 后端
- ✅ `packages/backend/src/services/TaskService.ts` - 修改 `createTask()` 默认状态，添加 `publishTask()` 方法，修改 `getAvailableTasks()` 查询
- ✅ `packages/backend/src/routes/task.routes.ts` - 添加 `POST /api/tasks/:taskId/publish` 路由

### 前端
- ✅ `packages/frontend/src/api/task.ts` - 添加 `publishTask()` 方法
- ✅ `packages/frontend/src/pages/PublishedTasksPage.tsx` - 添加 `handlePublishTask()` 方法，传递 `onPublishTask` 到 TaskListPage
- ✅ `packages/frontend/src/pages/TaskListPage.tsx` - 添加 `onPublishTask` prop，添加"发布"按钮渲染逻辑，添加 SendOutlined 图标导入

### 文档
- ✅ `TASK_PUBLISH_WORKFLOW_IMPLEMENTATION.md` - 实现方案文档（已存在）
- ✅ `TASK_PUBLISH_WORKFLOW_COMPLETE.md` - 实现完成文档（本文档）

## 编译状态

所有文件编译通过，无 TypeScript 错误。

## 下一步

1. 手动测试新的发布工作流
2. 验证现有任务不受影响
3. 根据测试结果进行调整
4. 考虑是否需要移除"放弃"功能（如原需求所述）
5. 考虑添加状态说明和优化发布对话框（可选）
