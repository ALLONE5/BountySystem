# 任务指派分离式工作流

## 更新日期
2026-02-03

## 概述

将任务创建和用户指派分离，提供更灵活的任务管理方式。发布者可以先创建任务，然后在"我的悬赏"页面对已创建的任务进行指派操作。

## 改进原因

### 之前的流程问题
- 创建任务时必须立即决定是否指派
- 无法对已创建的任务进行指派
- 流程不够灵活

### 新流程优势
- ✅ 创建和指派分离，流程更清晰
- ✅ 可以先创建任务，稍后再决定是否指派
- ✅ 可以对已创建的未承接任务进行指派
- ✅ 更符合实际工作流程

## 功能实现

### 1. 后端实现

#### 1.1 新增 API 方法

**文件**: `packages/backend/src/services/TaskService.ts`

```typescript
/**
 * Assign an existing task to a user
 * Only the publisher can assign the task
 */
async assignTaskToUser(taskId: string, publisherId: string, invitedUserId: string): Promise<Task> {
  const task = await this.getTask(taskId);
  if (!task) {
    throw new NotFoundError('Task not found');
  }

  // Verify permission: only publisher can assign
  if (task.publisherId !== publisherId) {
    throw new ValidationError('Only the publisher can assign this task');
  }

  // Verify task is not already assigned
  if (task.assigneeId) {
    throw new ValidationError('Task is already assigned');
  }

  // Verify task status is appropriate for assignment
  if (task.status !== TaskStatus.NOT_STARTED && task.status !== TaskStatus.AVAILABLE) {
    throw new ValidationError('Task cannot be assigned in its current status');
  }

  // Cannot invite yourself
  if (invitedUserId === publisherId) {
    throw new ValidationError('Cannot invite yourself');
  }

  // Verify invited user exists
  const invitedUser = await this.userRepository.findById(invitedUserId);
  if (!invitedUser) {
    throw new NotFoundError('Invited user not found');
  }

  // Update task with invitation
  const updatedTask = await this.updateTask(taskId, {
    invitedUserId,
    invitationStatus: InvitationStatus.PENDING,
    status: TaskStatus.PENDING_ACCEPTANCE,
    visibility: Visibility.PRIVATE, // Make task private when assigned to specific user
  });

  // Send notification to invited user
  await this.notificationService.createNotification({
    userId: invitedUserId,
    type: NotificationType.TASK_ASSIGNMENT_INVITATION,
    title: '您收到了一个任务指派',
    message: `${task.publisher?.username || '某用户'} 邀请您承接任务 "${task.name}"`,
    relatedTaskId: task.id,
    senderId: publisherId,
  });

  return updatedTask;
}
```

#### 1.2 新增 API 路由

**文件**: `packages/backend/src/routes/task.routes.ts`

```typescript
/**
 * Assign an existing task to a user
 * POST /api/tasks/:taskId/assign-to-user
 */
router.post('/:taskId/assign-to-user', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { taskId } = req.params;
  const publisherId = req.user!.userId;
  const { invitedUserId } = req.body;

  if (!invitedUserId) {
    return res.status(400).json({ error: 'invitedUserId is required' });
  }

  const task = await taskService.assignTaskToUser(taskId, publisherId, invitedUserId);

  res.json({
    message: 'Task assigned successfully',
    task,
  });
}));
```

### 2. 前端实现

#### 2.1 新增 API 方法

**文件**: `packages/frontend/src/api/task.ts`

```typescript
// 指派任务给用户
assignTaskToUser: async (taskId: string, invitedUserId: string) => {
  return createApiMethodWithParams<{ message: string; task: Task }, string>(
    'post',
    (id) => `/tasks/${id}/assign-to-user`
  )(taskId, { invitedUserId });
},
```

#### 2.2 更新任务列表页面

**文件**: `packages/frontend/src/pages/PublishedTasksPage.tsx`

**主要改动**：

1. **移除创建时的指派选项**
   - 删除 `assignmentType` 状态
   - 删除创建表单中的"任务分配方式"选项
   - 简化创建流程

2. **添加独立的指派功能**
   - 新增 `assignModalVisible` 状态
   - 新增 `assigningTask` 状态
   - 新增 `handleAssignTask` 方法
   - 新增 `handleAssignConfirm` 方法
   - 新增 `canAssign` 判断方法

3. **更新任务列表操作列**
   - 添加"指派"按钮
   - 只对未承接且状态合适的任务显示指派按钮

4. **新增指派模态框**
   - 显示任务名称
   - 用户搜索和选择
   - 确认指派操作

## 使用流程

### 发布者流程

```
1. 进入"我的悬赏"页面
   ↓
2. 点击"创建任务"按钮
   ↓
3. 填写任务信息（名称、描述、时间等）
   ↓
4. 点击"确定"创建任务
   ↓
5. 任务创建成功，显示在任务列表中
   ↓
6. 找到要指派的任务，点击"指派"按钮
   ↓
7. 在弹出的模态框中搜索并选择目标用户
   ↓
8. 点击"确认指派"
   ↓
9. 系统发送邀请通知给被指派用户
   ↓
10. 任务状态变为"待接受"，可见性变为"私有"
```

### 被指派用户流程

```
1. 收到任务指派通知
   ↓
2. 进入"任务邀请"页面或点击通知
   ↓
3. 查看任务详情
   ↓
4. 选择：接受 / 拒绝
   ↓
5. 系统发送结果通知给发布者
```

## API 端点

### 指派任务给用户

```
POST /api/tasks/:taskId/assign-to-user
Headers: Authorization: Bearer <token>
Body: {
  invitedUserId: string  // 被邀请用户ID
}

Response: {
  message: "Task assigned successfully",
  task: Task
}
```

### 其他相关端点

```
GET /api/tasks/invitations - 获取任务邀请
POST /api/tasks/:taskId/accept-assignment - 接受任务指派
POST /api/tasks/:taskId/reject-assignment - 拒绝任务指派
```

## 权限控制

### 指派任务
- ✅ 只有任务发布者可以指派任务
- ✅ 只能指派未承接的任务
- ✅ 只能指派状态为 NOT_STARTED 或 AVAILABLE 的任务
- ✅ 不能指派给自己
- ✅ 被指派用户必须存在

### 接受/拒绝任务
- ✅ 只有被邀请的用户可以接受或拒绝
- ✅ 只能对状态为 PENDING_ACCEPTANCE 的任务操作

## 状态流转

```
创建任务
  status: NOT_STARTED / AVAILABLE
  visibility: PUBLIC / POSITION_ONLY / PRIVATE
  invitedUserId: null
  invitationStatus: null
    ↓
指派给用户
  status: PENDING_ACCEPTANCE
  visibility: PRIVATE (自动设置)
  invitedUserId: <user_id>
  invitationStatus: PENDING
    ↓
用户接受
  status: IN_PROGRESS
  assigneeId: <user_id>
  invitationStatus: ACCEPTED
    ↓
用户拒绝
  status: AVAILABLE
  invitedUserId: null (清空)
  invitationStatus: REJECTED
```

## 测试

### 测试脚本

**文件**: `test-task-assignment-separate.js`

测试场景：
1. 管理员登录
2. 用户登录
3. 管理员创建任务（不指派）
4. 管理员指派任务给用户
5. 用户查看任务邀请
6. 用户接受任务指派
7. 创建第二个任务
8. 指派第二个任务
9. 用户拒绝第二个任务

### 运行测试

```bash
node test-task-assignment-separate.js
```

## 前后对比

### 之前的流程

```
创建任务 → 选择"指定用户" → 搜索用户 → 创建并指派
```

**问题**：
- 必须在创建时决定是否指派
- 无法对已创建的任务进行指派

### 现在的流程

```
创建任务 → 任务列表 → 点击"指派" → 搜索用户 → 确认指派
```

**优势**：
- 创建和指派分离
- 可以随时对未承接的任务进行指派
- 流程更灵活

## 兼容性

### 保留的功能
- ✅ 任务邀请列表页面
- ✅ 接受/拒绝任务指派
- ✅ 通知系统
- ✅ 任务详情中的邀请状态显示

### 移除的功能
- ❌ 创建任务时的"任务分配方式"选项
- ❌ 创建任务时的用户搜索和选择

## 文件清单

### 后端
- `packages/backend/src/services/TaskService.ts` - 添加 assignTaskToUser 方法
- `packages/backend/src/routes/task.routes.ts` - 添加 /assign-to-user 路由

### 前端
- `packages/frontend/src/api/task.ts` - 添加 assignTaskToUser API 方法
- `packages/frontend/src/pages/PublishedTasksPage.tsx` - 重构指派流程，移除冗余列

### 测试
- `test-task-assignment-separate.js` - 新的测试脚本

### 文档
- `docs/TASK_ASSIGNMENT_SEPARATE_WORKFLOW.md` - 本文档
- `TASK_ASSIGNMENT_BUTTON_FIX.md` - 指派按钮显示问题修复说明
- `QUICK_FIX_SUMMARY.md` - 快速修复总结

## 最近更新（2026-02-03）

### UI 优化
- ✅ 移除了冗余的"承接人"列（该列仅显示"已承接"/"未承接"）
- ✅ "承接者"列已提供更详细的信息（头像、用户名、组名或"未分配"）
- ✅ 增加操作列宽度从 250px 到 280px，确保所有按钮正常显示
- ✅ 指派按钮在符合条件的任务上正确显示

### 表格列结构
| 列名 | 宽度 | 说明 |
|------|------|------|
| 任务名称 | 200px | 显示任务名称和组标签 |
| 项目组 | 150px | 显示项目组名称 |
| 状态 | 100px | 显示任务状态徽章 |
| 赏金 | 120px | 显示赏金金额 |
| 复杂度 | 100px | 显示复杂度（1-5） |
| 优先级 | 100px | 显示优先级（1-5） |
| 承接者 | 150px | 显示承接者信息或"未分配" |
| 进度 | 150px | 显示进度条 |
| 计划结束时间 | 120px | 显示结束日期 |
| 操作 | 280px | 查看、指派、编辑、删除按钮 |

## 总结

通过将任务创建和用户指派分离，我们提供了更加灵活和符合实际工作流程的任务管理方式。发布者可以先创建任务，然后根据需要随时对未承接的任务进行指派，大大提高了任务管理的灵活性。
