# 任务发布工作流实现方案

## 需求描述

修改任务状态流转逻辑，引入"发布"步骤：

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
5. **移除"放弃"功能**（UI 层面隐藏，保留数据库状态以兼容旧数据）

## 实现方案

### 1. 后端修改

#### 1.1 修改任务创建逻辑

**文件**：`packages/backend/src/services/TaskService.ts`

**修改 `createTask` 方法**：

```typescript
// 当前逻辑（第 265 行左右）
let initialStatus = TaskStatus.AVAILABLE;
if (taskData.invitedUserId) {
  initialStatus = TaskStatus.PENDING_ACCEPTANCE;
} else if (taskData.assigneeId || taskData.groupId) {
  initialStatus = TaskStatus.IN_PROGRESS;
}

// 修改为
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

**新增方法**：

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

**新增路由**：

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

**当前查询**（第 1290 行左右）：
```sql
WHERE 
  t.assignee_id IS NULL
  AND (...)
```

**保持不变**，因为：
- `NOT_STARTED` 状态的任务 `assignee_id` 也是 NULL
- 但 `NOT_STARTED` 状态的任务不应该出现在"赏金任务"列表中
- 需要添加状态过滤

**修改为**：
```sql
WHERE 
  t.assignee_id IS NULL
  AND t.status = 'available'  -- 只显示已发布的任务
  AND (...)
```

**同时修改 COUNT 查询**（第 1330 行左右）：
```sql
WHERE 
  t.assignee_id IS NULL
  AND t.status = 'available'  -- 添加状态过滤
  AND (...)
```

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

**修改操作列**：

在 `renderActions` 方法中，为 `NOT_STARTED` 状态的任务添加"发布"按钮：

```typescript
const renderActions = (task: Task) => {
  // 未开始状态：显示发布按钮
  if (task.status === TaskStatus.NOT_STARTED) {
    return (
      <Space>
        <Button
          type="primary"
          size="small"
          icon={<SendOutlined />}
          onClick={() => handlePublishTask(task)}
        >
          发布
        </Button>
        <Button
          size="small"
          icon={<EditOutlined />}
          onClick={() => handleEditTask(task)}
        >
          编辑
        </Button>
        <Button
          size="small"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleDeleteTask(task.id)}
        >
          删除
        </Button>
      </Space>
    );
  }

  // 可承接状态：显示编辑和删除按钮
  if (task.status === TaskStatus.AVAILABLE) {
    return (
      <Space>
        <Button
          size="small"
          icon={<EditOutlined />}
          onClick={() => handleEditTask(task)}
        >
          编辑
        </Button>
        <Button
          size="small"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleDeleteTask(task.id)}
        >
          删除
        </Button>
      </Space>
    );
  }

  // 进行中状态：显示查看详情按钮
  if (task.status === TaskStatus.IN_PROGRESS) {
    return (
      <Button
        size="small"
        icon={<EyeOutlined />}
        onClick={() => handleViewDetail(task)}
      >
        查看详情
      </Button>
    );
  }

  // 已完成状态：显示查看详情按钮
  if (task.status === TaskStatus.COMPLETED) {
    return (
      <Button
        size="small"
        icon={<EyeOutlined />}
        onClick={() => handleViewDetail(task)}
      >
        查看详情
      </Button>
    );
  }

  return null;
};
```

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

**添加必要的 import**：

```typescript
import { SendOutlined } from '@ant-design/icons';
```

#### 2.3 更新任务状态显示

**文件**：`packages/frontend/src/pages/PublishedTasksPage.tsx`

**修改状态标签颜色**：

```typescript
const getStatusTag = (status: TaskStatus) => {
  const statusConfig = {
    [TaskStatus.NOT_STARTED]: { color: 'default', text: '未开始' },
    [TaskStatus.AVAILABLE]: { color: 'blue', text: '可承接' },
    [TaskStatus.PENDING_ACCEPTANCE]: { color: 'orange', text: '待接受' },
    [TaskStatus.IN_PROGRESS]: { color: 'processing', text: '进行中' },
    [TaskStatus.COMPLETED]: { color: 'success', text: '已完成' },
    // ABANDONED 状态不再显示，但保留以兼容旧数据
    [TaskStatus.ABANDONED]: { color: 'error', text: '已放弃' },
  };

  const config = statusConfig[status] || { color: 'default', text: status };
  return <Tag color={config.color}>{config.text}</Tag>;
};
```

#### 2.4 隐藏"放弃"按钮

**文件**：`packages/frontend/src/pages/TaskListPage.tsx`（承接的任务页面）

**移除或注释掉"放弃"按钮**：

```typescript
// 移除这部分代码
/*
<Button
  danger
  onClick={() => handleAbandonTask(task.id)}
>
  放弃任务
</Button>
*/
```

**文件**：`packages/frontend/src/components/TaskDetailDrawer.tsx`

**移除或注释掉"放弃"按钮**：

```typescript
// 移除这部分代码
/*
{task.status === TaskStatus.IN_PROGRESS && isAssignee && (
  <Button
    danger
    onClick={handleAbandon}
  >
    放弃任务
  </Button>
)}
*/
```

### 3. 数据库兼容性

**不需要修改数据库**：
- 保留 `ABANDONED` 状态在枚举中，以兼容旧数据
- 新创建的任务不会使用 `ABANDONED` 状态
- UI 层面隐藏"放弃"功能

### 4. 测试计划

#### 4.1 后端测试

1. **测试任务创建**：
   - 创建新任务，验证状态为 `NOT_STARTED`
   - 验证 `assignee_id` 为 NULL

2. **测试发布任务（自己承接）**：
   - 调用 `publishTask(taskId, publisherId, true)`
   - 验证状态变为 `IN_PROGRESS`
   - 验证 `assignee_id` 为发布者 ID
   - 验证 `actual_start_date` 被设置

3. **测试发布任务（发布给他人）**：
   - 调用 `publishTask(taskId, publisherId, false)`
   - 验证状态变为 `AVAILABLE`
   - 验证 `assignee_id` 为 NULL
   - 验证任务出现在"赏金任务"列表中

4. **测试权限验证**：
   - 非发布者尝试发布任务，验证返回 403 错误
   - 尝试发布非 `NOT_STARTED` 状态的任务，验证返回 400 错误

5. **测试缓存失效**：
   - 发布任务后，验证 `available_tasks:*` 缓存被清除

#### 4.2 前端测试

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
   - 验证没有"放弃"按钮
   - 验证可以完成任务

4. **测试任务详情抽屉**：
   - 验证没有"放弃"按钮
   - 验证其他功能正常

### 5. 迁移策略

#### 5.1 现有数据处理

**不需要数据迁移**：
- 现有 `AVAILABLE` 状态的任务保持不变
- 现有 `IN_PROGRESS` 状态的任务保持不变
- 现有 `COMPLETED` 状态的任务保持不变
- 现有 `ABANDONED` 状态的任务保持不变（UI 中仍然显示，但不允许新任务进入此状态）

#### 5.2 部署顺序

1. **部署后端**：
   - 修改任务创建逻辑
   - 添加发布任务 API
   - 修改 `getAvailableTasks` 查询

2. **部署前端**：
   - 添加"发布"按钮
   - 隐藏"放弃"按钮
   - 更新状态显示

3. **验证**：
   - 创建新任务，验证工作流正常
   - 验证现有任务不受影响

### 6. 用户体验改进

#### 6.1 状态说明

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

#### 6.2 发布对话框优化

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

## 实现清单

### 后端

- [ ] 修改 `TaskService.createTask()` - 默认状态改为 `NOT_STARTED`
- [ ] 添加 `TaskService.publishTask()` 方法
- [ ] 添加 `POST /api/tasks/:taskId/publish` 路由
- [ ] 修改 `TaskService.getAvailableTasks()` - 添加状态过滤
- [ ] 修改 COUNT 查询 - 添加状态过滤
- [ ] 编写单元测试

### 前端

- [ ] 添加 `taskApi.publishTask()` 方法
- [ ] 修改 `PublishedTasksPage` - 添加"发布"按钮
- [ ] 修改 `PublishedTasksPage` - 添加发布对话框
- [ ] 修改 `PublishedTasksPage` - 更新状态显示
- [ ] 修改 `TaskListPage` - 隐藏"放弃"按钮
- [ ] 修改 `TaskDetailDrawer` - 隐藏"放弃"按钮
- [ ] 添加状态说明 Alert
- [ ] 测试完整工作流

### 文档

- [ ] 更新 API 文档
- [ ] 更新用户手册
- [ ] 创建迁移指南

## 预期效果

1. **更清晰的任务生命周期**：
   - 创建 → 未开始
   - 发布 → 可承接 或 进行中
   - 承接 → 进行中
   - 完成 → 已完成

2. **更好的用户体验**：
   - 发布者可以选择自己做还是发布给他人
   - 减少误操作（不会直接创建就发布）
   - 移除"放弃"功能，简化流程

3. **向后兼容**：
   - 现有任务不受影响
   - 保留 `ABANDONED` 状态以兼容旧数据
   - 平滑过渡，无需数据迁移

## 风险和注意事项

1. **现有任务**：
   - 现有 `AVAILABLE` 状态的任务仍然可以被承接
   - 现有 `ABANDONED` 状态的任务仍然显示，但不允许新任务进入此状态

2. **子任务**：
   - 子任务的发布逻辑保持不变（使用 `publishSubtask` 方法）
   - 只有顶级任务使用新的发布流程

3. **测试覆盖**：
   - 需要全面测试新的工作流
   - 需要测试现有任务的兼容性

4. **用户培训**：
   - 需要通知用户新的工作流程
   - 提供清晰的状态说明和操作指引
