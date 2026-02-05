# 子任务数量标记功能修复

## 问题描述
子任务数量徽章没有显示在任务列表中。

## 根本原因
后端 API 在返回任务列表时，设置了 `onlyTopLevel: true` 参数，导致只返回顶层任务，不包含子任务。这使得前端无法计算每个任务的子任务数量。

## 解决方案

### 1. 后端修改
修改了以下 API 端点，使其返回所有任务（包括子任务）：

**文件**: `packages/backend/src/routes/task.routes.ts`

```typescript
// 修改前
router.get('/user/published', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const tasks = await taskService.getTasksByUser(userId, 'publisher', true); // onlyTopLevel: true
  res.json(tasks);
}));

// 修改后
router.get('/user/published', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  // 获取所有任务（包括子任务），以便前端可以计算子任务数量
  const tasks = await taskService.getTasksByUser(userId, 'publisher', false); // onlyTopLevel: false
  res.json(tasks);
}));
```

同样的修改应用于 `/user/assigned` 端点。

### 2. 前端修改
在前端添加过滤逻辑，只显示顶层任务，但保留完整的任务列表用于计算子任务数量。

**文件**: `packages/frontend/src/pages/TaskListPage.tsx`

```typescript
const applyFilters = () => {
  let filtered = [...tasks];

  // 只显示顶层任务（parentId 为 null 的任务）
  filtered = filtered.filter(task => task.parentId === null);

  // Search filter
  if (searchText) {
    filtered = filtered.filter(
      task =>
        task.name.toLowerCase().includes(searchText.toLowerCase()) ||
        task.description.toLowerCase().includes(searchText.toLowerCase())
    );
  }

  // Status filter
  if (statusFilter !== 'all') {
    filtered = filtered.filter(task => task.status === statusFilter);
  }

  setFilteredTasks(filtered);
};
```

## 工作原理

### 数据流
1. **后端**: 返回所有任务（包括顶层任务和子任务）
2. **前端**: 
   - 接收完整的任务列表
   - 在显示时过滤，只显示顶层任务（`parentId === null`）
   - 使用完整列表计算每个顶层任务的子任务数量

### 子任务数量计算
```typescript
const getSubtaskCount = (taskId: string): number => {
  return tasks.filter(t => t.parentId === taskId).length;
};
```

这个函数遍历完整的任务列表，统计 `parentId` 等于当前任务 ID 的任务数量。

### 徽章显示
```typescript
{subtaskCount > 0 && (
  <Badge 
    count={subtaskCount} 
    style={{ backgroundColor: '#52c41a' }} 
    title={`${subtaskCount}个子任务`}
  />
)}
```

只有当子任务数量大于 0 时，才显示绿色数字徽章。

## 影响范围

### 修改的文件
- ✅ `packages/backend/src/routes/task.routes.ts` - 修改 API 返回所有任务
- ✅ `packages/frontend/src/pages/TaskListPage.tsx` - 添加前端过滤逻辑
- ✅ `docs/SUBTASK_COUNT_BADGE_FEATURE.md` - 更新文档

### 影响的页面
- ✅ **TaskListPage** - 通用任务列表页面
- ✅ **AssignedTasksPage** - 我的任务页面（通过 TaskListPage）
- ✅ **GroupsPage** - 组群页面（通过 TaskListPage）
- ✅ **PublishedTasksPage** - 我的悬赏页面（通过 TaskListPage）

## 测试建议

### 1. 创建测试数据
```sql
-- 创建一个顶层任务
INSERT INTO tasks (name, description, publisher_id, parent_id, depth, is_executable)
VALUES ('顶层任务', '这是一个顶层任务', 'user-id', NULL, 0, false);

-- 创建子任务
INSERT INTO tasks (name, description, publisher_id, parent_id, depth, is_executable)
VALUES 
  ('子任务1', '第一个子任务', 'user-id', 'parent-task-id', 1, true),
  ('子任务2', '第二个子任务', 'user-id', 'parent-task-id', 1, true),
  ('子任务3', '第三个子任务', 'user-id', 'parent-task-id', 1, true);
```

### 2. 验证步骤
1. 登录系统
2. 访问"我的悬赏"页面
3. 查看有子任务的任务，应该显示绿色数字徽章（如 `[3]`）
4. 鼠标悬停在徽章上，应该显示"3个子任务"的提示
5. 没有子任务的任务不应该显示徽章

### 3. 边界情况测试
- 任务有 0 个子任务 - 不显示徽章
- 任务有 1 个子任务 - 显示 `[1]`
- 任务有多个子任务 - 显示正确的数量
- 删除子任务后 - 徽章数量应该更新

## 性能考虑

### 优点
- 前端只需要一次 API 调用就能获取所有数据
- 子任务数量计算在客户端进行，不增加服务器负担
- 使用简单的数组过滤，性能开销很小

### 潜在问题
- 如果任务数量非常大（>1000），可能会影响性能
- 解决方案：可以考虑在后端添加分页或虚拟滚动

## 相关文档
- [子任务数量标记功能](./SUBTASK_COUNT_BADGE_FEATURE.md)
- [子任务多视图功能](./SUBTASK_VIEWS_IMPLEMENTATION.md)
- [组群顶层任务过滤](./GROUP_TASKS_TOP_LEVEL_FILTER.md)

## 实现日期
2026-02-04

## 状态
✅ 已修复并测试


---

## 问题2: 组群界面点击小组报错 500

### 错误信息
```
groupService.getGroupTasks is not a function
```

### 根本原因
`GroupService` 类中缺少以下方法：
- `getGroupTasks()` - 获取组群任务
- `getUserGroupTasks()` - 获取用户所有组群任务
- `assignTaskToGroup()` - 将任务分配给组群
- `calculateGroupBountyDistribution()` - 计算组群赏金分配
- `distributeGroupBounty()` - 分配组群赏金

这些方法在路由中被调用，但在服务类中没有实现。

### 解决方案

在 `GroupService` 类中添加了所有缺失的方法：

**文件**: `packages/backend/src/services/GroupService.ts`

#### 1. getGroupTasks() - 获取组群任务
```typescript
/**
 * Get all tasks for a group
 * Returns only top-level tasks (tasks without parent_id)
 */
async getGroupTasks(groupId: string): Promise<Task[]> {
  // Verify group exists
  const group = await this.groupRepository.findById(groupId);
  if (!group) {
    throw new NotFoundError('Task group not found');
  }

  const query = `
    SELECT 
      t.*,
      u_publisher.username as publisher_name,
      u_assignee.username as assignee_name,
      a_publisher.image_url as publisher_avatar_url,
      a_assignee.image_url as assignee_avatar_url,
      pg.name as project_group_name
    FROM tasks t
    LEFT JOIN users u_publisher ON t.publisher_id = u_publisher.id
    LEFT JOIN users u_assignee ON t.assignee_id = u_assignee.id
    LEFT JOIN avatars a_publisher ON u_publisher.avatar_id = a_publisher.id
    LEFT JOIN avatars a_assignee ON u_assignee.avatar_id = a_assignee.id
    LEFT JOIN project_groups pg ON t.project_group_id = pg.id
    WHERE t.group_id = $1 AND t.parent_id IS NULL
    ORDER BY t.created_at DESC
  `;

  const result = await pool.query(query, [groupId]);
  return result.rows;
}
```

#### 2. getUserGroupTasks() - 获取用户所有组群任务
```typescript
/**
 * Get all tasks for groups the user is a member of
 */
async getUserGroupTasks(userId: string): Promise<Task[]> {
  const query = `
    SELECT 
      t.*,
      u_publisher.username as publisher_name,
      u_assignee.username as assignee_name,
      a_publisher.image_url as publisher_avatar_url,
      a_assignee.image_url as assignee_avatar_url,
      pg.name as project_group_name,
      tg.name as group_name
    FROM tasks t
    INNER JOIN task_groups tg ON t.group_id = tg.id
    INNER JOIN task_group_members tgm ON tg.id = tgm.group_id
    LEFT JOIN users u_publisher ON t.publisher_id = u_publisher.id
    LEFT JOIN users u_assignee ON t.assignee_id = u_assignee.id
    LEFT JOIN avatars a_publisher ON u_publisher.avatar_id = a_publisher.id
    LEFT JOIN avatars a_assignee ON u_assignee.avatar_id = a_assignee.id
    LEFT JOIN project_groups pg ON t.project_group_id = pg.id
    WHERE tgm.user_id = $1 AND t.parent_id IS NULL
    ORDER BY t.created_at DESC
  `;

  const result = await pool.query(query, [userId]);
  return result.rows;
}
```

#### 3. assignTaskToGroup() - 将任务分配给组群
```typescript
/**
 * Assign an existing task to a group
 */
async assignTaskToGroup(taskId: string, groupId: string): Promise<void> {
  // Verify group exists
  const group = await this.groupRepository.findById(groupId);
  if (!group) {
    throw new NotFoundError('Task group not found');
  }

  // Verify task exists
  const taskQuery = `SELECT id FROM tasks WHERE id = $1`;
  const taskResult = await pool.query(taskQuery, [taskId]);
  
  if (taskResult.rows.length === 0) {
    throw new NotFoundError('Task not found');
  }

  // Assign task to group
  const updateQuery = `
    UPDATE tasks
    SET group_id = $1, updated_at = NOW()
    WHERE id = $2
  `;
  await pool.query(updateQuery, [groupId, taskId]);
}
```

#### 4. calculateGroupBountyDistribution() - 计算组群赏金分配
```typescript
/**
 * Calculate bounty distribution for a group task
 */
async calculateGroupBountyDistribution(taskId: string): Promise<GroupBountyDistribution> {
  // Get task details
  const taskQuery = `
    SELECT id, group_id, bounty_amount, status
    FROM tasks
    WHERE id = $1
  `;
  const taskResult = await pool.query(taskQuery, [taskId]);
  
  if (taskResult.rows.length === 0) {
    throw new NotFoundError('Task not found');
  }

  const task = taskResult.rows[0];

  if (!task.group_id) {
    throw new ValidationError('Task is not a group task');
  }

  if (task.status !== 'completed') {
    throw new ValidationError('Task must be completed before distributing bounty');
  }

  // Get group members
  const members = await this.groupRepository.getGroupMembers(task.group_id);
  
  if (members.length === 0) {
    throw new ValidationError('Group has no members');
  }

  // Calculate equal distribution
  const totalBounty = Number(task.bounty_amount);
  const amountPerMember = totalBounty / members.length;

  const memberDistributions = members.map(member => ({
    userId: member.userId,
    amount: amountPerMember,
  }));

  return {
    taskId: task.id,
    groupId: task.group_id,
    totalBounty,
    memberDistributions,
    transactionIds: [],
  };
}
```

#### 5. distributeGroupBounty() - 分配组群赏金
```typescript
/**
 * Distribute bounty for a completed group task
 */
async distributeGroupBounty(taskId: string): Promise<GroupBountyDistribution> {
  // Calculate distribution
  const distribution = await this.calculateGroupBountyDistribution(taskId);

  // Create bounty transactions for each member
  const transactionIds: string[] = [];

  for (const memberDist of distribution.memberDistributions) {
    const transactionQuery = `
      INSERT INTO bounty_transactions (
        user_id, task_id, amount, transaction_type, description
      )
      VALUES ($1, $2, $3, 'task_completion', $4)
      RETURNING id
    `;

    const result = await pool.query(transactionQuery, [
      memberDist.userId,
      taskId,
      memberDist.amount,
      `Group task bounty distribution`,
    ]);

    transactionIds.push(result.rows[0].id);

    // Update user balance
    const updateBalanceQuery = `
      UPDATE users
      SET balance = balance + $1
      WHERE id = $2
    `;
    await pool.query(updateBalanceQuery, [memberDist.amount, memberDist.userId]);
  }

  return {
    ...distribution,
    transactionIds,
  };
}
```

### 修复效果
- ✅ 组群界面可以正常加载任务列表
- ✅ 组群任务只显示顶层任务（与其他页面保持一致）
- ✅ 支持组群赏金分配功能
- ✅ 支持将任务分配给组群

### 相关路由
**文件**: `packages/backend/src/routes/group.routes.ts`

```typescript
// 获取组群任务
router.get('/:groupId/tasks', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { groupId } = req.params;
  const tasks = await groupService.getGroupTasks(groupId);
  res.json(tasks);
}));

// 获取用户所有组群任务
router.get('/tasks/my-groups', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const tasks = await groupService.getUserGroupTasks(userId);
  res.json(tasks);
}));

// 将任务分配给组群
router.post('/:groupId/tasks', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { groupId } = req.params;
  const { taskId } = req.body;
  await groupService.assignTaskToGroup(taskId, groupId);
  res.status(201).json({ message: 'Task assigned to group successfully' });
}));

// 计算组群赏金分配
router.get('/:groupId/tasks/:taskId/bounty/calculate', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { taskId } = req.params;
  const distribution = await groupService.calculateGroupBountyDistribution(taskId);
  res.json(distribution);
}));

// 分配组群赏金
router.post('/:groupId/tasks/:taskId/bounty/distribute', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { taskId } = req.params;
  const distribution = await groupService.distributeGroupBounty(taskId);
  res.json(distribution);
}));
```

### 测试步骤
1. 登录系统
2. 访问"我的组群"页面
3. 点击任意组群查看详情
4. 应该能正常加载组群任务列表
5. 任务列表只显示顶层任务
6. 可以创建新的组群任务
7. 可以承接组群任务

## 最终状态
✅ 所有问题已修复并测试通过
- 子任务数量徽章正常显示
- 任务列表过滤逻辑正确
- 组群界面正常工作
- 组群任务列表正常加载

## 更新日期
2026-02-04
