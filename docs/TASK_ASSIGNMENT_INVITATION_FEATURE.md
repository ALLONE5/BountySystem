# 任务指派邀请功能

## 更新日期
2026-02-03

## 功能概述

允许任务发布者在创建任务时直接指定某个用户来承接任务。被指定的用户会收到通知，可以查看任务详情并选择接受或拒绝。无论接受还是拒绝，发布者都会收到通知。

## 核心功能

### 1. 任务指派流程

```
发布者创建任务
    ↓
选择"指定用户承接"
    ↓
搜索并选择目标用户
    ↓
任务创建（visibility = PRIVATE, status = PENDING_ACCEPTANCE）
    ↓
系统发送通知给被指定用户
    ↓
被指定用户收到通知
    ↓
查看任务详情
    ↓
选择：接受 / 拒绝
    ↓
系统发送结果通知给发布者
```

### 2. 任务状态

新增任务状态：`PENDING_ACCEPTANCE` - 等待被指定用户接受

**状态流转**:
- 创建时：`PENDING_ACCEPTANCE`
- 接受后：`IN_PROGRESS`
- 拒绝后：`AVAILABLE` (可以重新指派或公开)

### 3. 通知类型

#### 3.1 任务指派通知（发给被指定用户）
```typescript
{
  type: 'task_assignment_invitation',
  title: '您收到了一个任务指派',
  message: '{发布者名称} 邀请您承接任务 "{任务名称}"',
  relatedTaskId: taskId,
  senderId: publisherId,
  actions: ['accept', 'reject', 'view_details']
}
```

#### 3.2 接受通知（发给发布者）
```typescript
{
  type: 'task_assignment_accepted',
  title: '任务指派已接受',
  message: '{用户名称} 已接受您的任务指派 "{任务名称}"',
  relatedTaskId: taskId,
  senderId: assigneeId
}
```

#### 3.3 拒绝通知（发给发布者）
```typescript
{
  type: 'task_assignment_rejected',
  title: '任务指派已拒绝',
  message: '{用户名称} 拒绝了您的任务指派 "{任务名称}"',
  relatedTaskId: taskId,
  senderId: assigneeId
}
```

## 数据库设计

### 1. 任务表更新

```sql
-- 添加新字段到 tasks 表
ALTER TABLE tasks ADD COLUMN invited_user_id UUID REFERENCES users(id);
ALTER TABLE tasks ADD COLUMN invitation_status VARCHAR(50);
-- invitation_status: 'pending', 'accepted', 'rejected', null

-- 添加索引
CREATE INDEX idx_tasks_invited_user ON tasks(invited_user_id);
CREATE INDEX idx_tasks_invitation_status ON tasks(invitation_status);
```

### 2. 通知表（已存在）

使用现有的 `notifications` 表，添加新的通知类型：
- `task_assignment_invitation`
- `task_assignment_accepted`
- `task_assignment_rejected`

## 后端实现

### 1. 数据模型更新

**文件**: `packages/backend/src/models/Task.ts`

```typescript
export enum TaskStatus {
  NOT_STARTED = 'not_started',
  AVAILABLE = 'available',
  PENDING_ACCEPTANCE = 'pending_acceptance',  // 新增
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  ABANDONED = 'abandoned',
}

export enum InvitationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

export interface Task {
  // ... 现有字段
  invitedUserId: string | null;  // 被邀请的用户ID
  invitationStatus: InvitationStatus | null;  // 邀请状态
}

export interface TaskCreateDTO {
  // ... 现有字段
  invitedUserId?: string;  // 可选：指定承接用户
}
```

### 2. TaskService 新增方法

**文件**: `packages/backend/src/services/TaskService.ts`

```typescript
/**
 * 创建带指派的任务
 * 如果指定了 invitedUserId，任务将设置为 PRIVATE 和 PENDING_ACCEPTANCE
 */
async createTaskWithAssignment(taskData: TaskCreateDTO): Promise<Task> {
  const { invitedUserId, ...restData } = taskData;
  
  if (invitedUserId) {
    // 验证被邀请用户存在
    const invitedUser = await this.userRepository.findById(invitedUserId);
    if (!invitedUser) {
      throw new NotFoundError('Invited user not found');
    }
    
    // 创建任务，设置为私有和等待接受状态
    const task = await this.createTask({
      ...restData,
      visibility: Visibility.PRIVATE,
      status: TaskStatus.PENDING_ACCEPTANCE,
      invitedUserId,
      invitationStatus: InvitationStatus.PENDING,
    });
    
    // 发送通知给被邀请用户
    await this.notificationService.createNotification({
      userId: invitedUserId,
      type: 'task_assignment_invitation',
      title: '您收到了一个任务指派',
      message: `${task.publisher?.username || '某用户'} 邀请您承接任务 "${task.name}"`,
      relatedTaskId: task.id,
      senderId: taskData.publisherId,
    });
    
    return task;
  }
  
  // 没有指定用户，按正常流程创建
  return this.createTask(taskData);
}

/**
 * 接受任务指派
 */
async acceptTaskAssignment(taskId: string, userId: string): Promise<Task> {
  const task = await this.getTask(taskId);
  if (!task) {
    throw new NotFoundError('Task not found');
  }
  
  // 验证权限：只有被邀请的用户可以接受
  if (task.invitedUserId !== userId) {
    throw new ValidationError('You are not invited to this task');
  }
  
  // 验证状态
  if (task.status !== TaskStatus.PENDING_ACCEPTANCE) {
    throw new ValidationError('Task is not in pending acceptance status');
  }
  
  // 更新任务状态
  const updatedTask = await this.updateTask(taskId, {
    status: TaskStatus.IN_PROGRESS,
    assigneeId: userId,
    invitationStatus: InvitationStatus.ACCEPTED,
    actualStartDate: new Date(),
  });
  
  // 发送通知给发布者
  await this.notificationService.createNotification({
    userId: task.publisherId,
    type: 'task_assignment_accepted',
    title: '任务指派已接受',
    message: `${updatedTask.assignee?.username || '某用户'} 已接受您的任务指派 "${task.name}"`,
    relatedTaskId: task.id,
    senderId: userId,
  });
  
  return updatedTask;
}

/**
 * 拒绝任务指派
 */
async rejectTaskAssignment(taskId: string, userId: string, reason?: string): Promise<Task> {
  const task = await this.getTask(taskId);
  if (!task) {
    throw new NotFoundError('Task not found');
  }
  
  // 验证权限：只有被邀请的用户可以拒绝
  if (task.invitedUserId !== userId) {
    throw new ValidationError('You are not invited to this task');
  }
  
  // 验证状态
  if (task.status !== TaskStatus.PENDING_ACCEPTANCE) {
    throw new ValidationError('Task is not in pending acceptance status');
  }
  
  // 更新任务状态
  const updatedTask = await this.updateTask(taskId, {
    status: TaskStatus.AVAILABLE,  // 变为可承接状态
    invitationStatus: InvitationStatus.REJECTED,
    invitedUserId: null,  // 清空邀请用户
  });
  
  // 发送通知给发布者
  const reasonText = reason ? `\n拒绝原因：${reason}` : '';
  await this.notificationService.createNotification({
    userId: task.publisherId,
    type: 'task_assignment_rejected',
    title: '任务指派已拒绝',
    message: `${task.invitedUser?.username || '某用户'} 拒绝了您的任务指派 "${task.name}"${reasonText}`,
    relatedTaskId: task.id,
    senderId: userId,
  });
  
  return updatedTask;
}

/**
 * 获取用户收到的任务邀请
 */
async getTaskInvitations(userId: string): Promise<Task[]> {
  const query = `
    SELECT 
      t.*,
      u.username as "publisher.username",
      u.email as "publisher.email"
    FROM tasks t
    LEFT JOIN users u ON t.publisher_id = u.id
    WHERE t.invited_user_id = $1
      AND t.status = 'pending_acceptance'
    ORDER BY t.created_at DESC
  `;
  
  const result = await pool.query(query, [userId]);
  return this.mapTasksWithUsers(result.rows);
}
```

### 3. API 路由

**文件**: `packages/backend/src/routes/task.routes.ts`

```typescript
/**
 * 接受任务指派
 * POST /api/tasks/:taskId/accept-assignment
 */
router.post('/:taskId/accept-assignment', authenticate, asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const userId = req.user!.userId;
  
  const task = await taskService.acceptTaskAssignment(taskId, userId);
  
  res.json({
    message: 'Task assignment accepted successfully',
    task,
  });
}));

/**
 * 拒绝任务指派
 * POST /api/tasks/:taskId/reject-assignment
 */
router.post('/:taskId/reject-assignment', authenticate, asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const userId = req.user!.userId;
  const { reason } = req.body;
  
  const task = await taskService.rejectTaskAssignment(taskId, userId, reason);
  
  res.json({
    message: 'Task assignment rejected successfully',
    task,
  });
}));

/**
 * 获取用户收到的任务邀请
 * GET /api/tasks/invitations
 */
router.get('/invitations', authenticate, asyncHandler(async (req, res) => {
  const userId = req.user!.userId;
  
  const invitations = await taskService.getTaskInvitations(userId);
  
  res.json(invitations);
}));
```

## 前端实现

### 1. 创建任务表单更新

**文件**: `packages/frontend/src/components/TaskCreateModal.tsx`

添加"指定用户"选项：

```tsx
<Form.Item label="任务分配方式">
  <Radio.Group value={assignmentType} onChange={(e) => setAssignmentType(e.target.value)}>
    <Radio value="public">公开承接</Radio>
    <Radio value="assign">指定用户</Radio>
  </Radio.Group>
</Form.Item>

{assignmentType === 'assign' && (
  <Form.Item
    name="invitedUserId"
    label="指定用户"
    rules={[{ required: true, message: '请选择要指定的用户' }]}
  >
    <Select
      showSearch
      placeholder="搜索用户"
      filterOption={false}
      onSearch={handleSearchUsers}
      loading={searchingUsers}
    >
      {users.map(user => (
        <Select.Option key={user.id} value={user.id}>
          <Space>
            <Avatar src={user.avatarUrl} size="small" />
            {user.username} ({user.email})
          </Space>
        </Select.Option>
      ))}
    </Select>
  </Form.Item>
)}
```

### 2. 任务邀请列表页面

**文件**: `packages/frontend/src/pages/TaskInvitationsPage.tsx`

```tsx
export const TaskInvitationsPage: React.FC = () => {
  const [invitations, setInvitations] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    loadInvitations();
  }, []);
  
  const loadInvitations = async () => {
    setLoading(true);
    try {
      const data = await taskApi.getTaskInvitations();
      setInvitations(data);
    } catch (error) {
      message.error('加载任务邀请失败');
    } finally {
      setLoading(false);
    }
  };
  
  const handleAccept = async (taskId: string) => {
    try {
      await taskApi.acceptTaskAssignment(taskId);
      message.success('已接受任务');
      loadInvitations();
    } catch (error) {
      message.error('接受任务失败');
    }
  };
  
  const handleReject = async (taskId: string) => {
    Modal.confirm({
      title: '拒绝任务指派',
      content: (
        <Form>
          <Form.Item label="拒绝原因（可选）">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      ),
      onOk: async () => {
        try {
          await taskApi.rejectTaskAssignment(taskId);
          message.success('已拒绝任务');
          loadInvitations();
        } catch (error) {
          message.error('拒绝任务失败');
        }
      },
    });
  };
  
  return (
    <Card title="任务邀请">
      <List
        loading={loading}
        dataSource={invitations}
        renderItem={(task) => (
          <List.Item
            actions={[
              <Button type="primary" onClick={() => handleAccept(task.id)}>
                接受
              </Button>,
              <Button danger onClick={() => handleReject(task.id)}>
                拒绝
              </Button>,
              <Button onClick={() => viewTaskDetails(task.id)}>
                查看详情
              </Button>,
            ]}
          >
            <List.Item.Meta
              title={task.name}
              description={
                <Space direction="vertical">
                  <Text>发布者: {task.publisher?.username}</Text>
                  <Text>赏金: {formatBounty(task.bountyAmount)}</Text>
                  <Text>预估工时: {task.estimatedHours}小时</Text>
                </Space>
              }
            />
          </List.Item>
        )}
      />
    </Card>
  );
};
```

### 3. 通知组件更新

**文件**: `packages/frontend/src/components/NotificationList.tsx`

添加任务邀请通知的特殊处理：

```tsx
const renderNotificationActions = (notification: Notification) => {
  if (notification.type === 'task_assignment_invitation') {
    return (
      <Space>
        <Button
          type="primary"
          size="small"
          onClick={() => handleAcceptInvitation(notification.relatedTaskId)}
        >
          接受
        </Button>
        <Button
          danger
          size="small"
          onClick={() => handleRejectInvitation(notification.relatedTaskId)}
        >
          拒绝
        </Button>
        <Button
          size="small"
          onClick={() => viewTaskDetails(notification.relatedTaskId)}
        >
          查看详情
        </Button>
      </Space>
    );
  }
  
  // 其他通知类型的默认操作
  return (
    <Button size="small" onClick={() => viewTaskDetails(notification.relatedTaskId)}>
      查看
    </Button>
  );
};
```

### 4. API 方法

**文件**: `packages/frontend/src/api/task.ts`

```typescript
export const taskApi = {
  // ... 现有方法
  
  // 获取任务邀请
  getTaskInvitations: createApiMethod<Task[]>('get', '/tasks/invitations'),
  
  // 接受任务指派
  acceptTaskAssignment: createApiMethodWithParams<Task, string>(
    'post',
    (taskId) => `/tasks/${taskId}/accept-assignment`
  ),
  
  // 拒绝任务指派
  rejectTaskAssignment: async (taskId: string, reason?: string) => {
    return createApiMethodWithParams<Task, string>(
      'post',
      (id) => `/tasks/${id}/reject-assignment`
    )(taskId, { reason });
  },
};
```

## 数据库迁移

**文件**: `packages/database/migrations/20260203_000001_add_task_assignment_fields.sql`

```sql
-- 添加任务指派相关字段
ALTER TABLE tasks ADD COLUMN invited_user_id UUID REFERENCES users(id);
ALTER TABLE tasks ADD COLUMN invitation_status VARCHAR(50);

-- 添加索引
CREATE INDEX idx_tasks_invited_user ON tasks(invited_user_id);
CREATE INDEX idx_tasks_invitation_status ON tasks(invitation_status);

-- 添加注释
COMMENT ON COLUMN tasks.invited_user_id IS '被邀请承接任务的用户ID';
COMMENT ON COLUMN tasks.invitation_status IS '邀请状态: pending, accepted, rejected';

-- 更新任务状态枚举（如果使用枚举类型）
-- ALTER TYPE task_status ADD VALUE 'pending_acceptance';
```

## 用户交互流程

### 发布者流程

```
1. 点击"创建任务"
   ↓
2. 填写任务信息
   ↓
3. 选择"指定用户承接"
   ↓
4. 搜索并选择目标用户
   ↓
5. 提交创建
   ↓
6. 系统提示"任务已创建，已发送邀请通知"
   ↓
7. 等待被指定用户响应
   ↓
8. 收到通知：
   - "XXX 已接受您的任务指派" ✅
   - "XXX 拒绝了您的任务指派" ❌
```

### 被指定用户流程

```
1. 收到通知："您收到了一个任务指派"
   ↓
2. 点击通知或进入"任务邀请"页面
   ↓
3. 查看任务详情：
   - 任务名称
   - 任务描述
   - 赏金金额
   - 预估工时
   - 计划时间
   - 发布者信息
   ↓
4. 做出决定：
   a) 接受 → 任务状态变为"进行中"，成为任务承接者
   b) 拒绝 → 任务状态变为"可承接"，可选填拒绝原因
   ↓
5. 系统发送结果通知给发布者
```

## 权限控制

### 1. 创建带指派的任务
- 任何用户都可以创建任务并指定其他用户
- 不能指定自己

### 2. 接受/拒绝任务
- 只有被邀请的用户可以接受或拒绝
- 只能对状态为 `PENDING_ACCEPTANCE` 的任务操作

### 3. 查看任务详情
- 被邀请用户可以查看私有任务的详情
- 发布者可以查看自己发布的任务

## 边界情况处理

### 1. 用户不存在
```
错误: "Invited user not found"
解决: 在创建任务前验证用户存在
```

### 2. 重复接受/拒绝
```
错误: "Task is not in pending acceptance status"
解决: 检查任务状态，只允许对 PENDING_ACCEPTANCE 状态的任务操作
```

### 3. 非被邀请用户尝试操作
```
错误: "You are not invited to this task"
解决: 验证操作用户是否为被邀请用户
```

### 4. 任务被拒绝后
- 任务状态变为 `AVAILABLE`
- 发布者可以：
  - 重新指定其他用户
  - 改为公开承接
  - 删除任务

## 测试建议

### 手动测试

1. **创建指派任务**
   - 创建任务并指定用户A
   - 验证用户A收到通知
   - 验证任务状态为 PENDING_ACCEPTANCE
   - 验证任务可见性为 PRIVATE

2. **接受任务**
   - 用户A接受任务
   - 验证任务状态变为 IN_PROGRESS
   - 验证用户A成为承接者
   - 验证发布者收到接受通知

3. **拒绝任务**
   - 创建新任务并指定用户B
   - 用户B拒绝任务（填写原因）
   - 验证任务状态变为 AVAILABLE
   - 验证发布者收到拒绝通知（包含原因）

4. **权限测试**
   - 用户C尝试接受指派给用户A的任务
   - 验证返回权限错误

5. **通知测试**
   - 验证所有通知都正确发送
   - 验证通知内容准确
   - 验证通知操作按钮正常工作

## 未来改进

### 1. 批量指派
- 一次指派多个用户
- 先接受的用户获得任务

### 2. 指派过期
- 设置接受期限
- 超时自动变为公开任务

### 3. 指派历史
- 记录所有指派历史
- 统计接受/拒绝率

### 4. 推荐用户
- 基于技能匹配推荐合适的用户
- 显示用户的历史完成率

### 5. 指派模板
- 保存常用的指派对象
- 快速指派给团队成员

## 总结

任务指派邀请功能为发布者提供了更灵活的任务分配方式，可以直接邀请特定用户承接任务，提高了任务分配的效率和针对性。通过完善的通知系统，确保双方都能及时了解任务状态变化。
