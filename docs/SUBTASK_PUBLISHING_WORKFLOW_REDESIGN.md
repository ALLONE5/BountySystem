# 子任务发布工作流重新设计

## 需求概述

重新设计任务发布逻辑，实现更灵活的子任务管理和赏金分配机制。

## 核心需求

### 1. 承接人独立性
- **旧逻辑**: 子任务自动继承母任务的承接人
- **新逻辑**: 子任务承接人可以与母任务承接人不一致

### 2. 发布权限
- 一级任务（顶级任务）：由创建者发布
- 二级任务（子任务）：由创建者和一级任务承接者创建

### 3. 子任务创建流程
1. 子任务创建后**默认为私有**（visibility = PRIVATE）
2. 默认承接人与一级任务承接人一致（可选）
3. 初始赏金为 0

### 4. 子任务发布流程
**前提条件**: 一级任务必须已被承接

**发布操作**（由一级任务承接人执行）：
1. 修改可见性为非私有状态（PUBLIC 或 POSITION_ONLY）
2. 设置赏金金额
3. 任务在赏金任务列表中可见

### 5. 赏金机制
- **一级任务**: 赏金由赏金公式自动计算
- **二级任务**: 
  - 创建时赏金为 0
  - 发布时由一级任务承接人设置赏金
  - 被承接后，从一级任务承接人账户扣除赏金转给二级任务承接人

## 数据模型变更

### Task 表需要的字段
```sql
-- 现有字段
id UUID PRIMARY KEY
parent_id UUID REFERENCES tasks(id)  -- 母任务ID
publisher_id UUID REFERENCES users(id)  -- 发布者（创建者）
assignee_id UUID REFERENCES users(id)  -- 承接人
visibility VARCHAR(20)  -- 可见性：PUBLIC, PRIVATE, POSITION_ONLY
bounty_amount DECIMAL(10,2)  -- 赏金金额
status VARCHAR(20)  -- 任务状态

-- 可能需要新增的字段
bounty_payer_id UUID REFERENCES users(id)  -- 赏金支付者（用于子任务）
is_published BOOLEAN DEFAULT false  -- 是否已发布
published_at TIMESTAMP  -- 发布时间
published_by UUID REFERENCES users(id)  -- 发布者
```

## 业务规则

### 规则 1: 子任务创建权限
**谁可以创建子任务？**
- 一级任务的创建者（publisher）
- 一级任务的承接者（assignee）- **新增**

**验证逻辑**:
```typescript
async canCreateSubtask(parentTaskId: string, userId: string): Promise<boolean> {
  const parentTask = await this.getTask(parentTaskId);
  if (!parentTask) return false;
  
  // 创建者可以创建
  if (parentTask.publisherId === userId) return true;
  
  // 承接者可以创建（新规则）
  if (parentTask.assigneeId === userId) return true;
  
  return false;
}
```

### 规则 2: 子任务创建默认值
```typescript
async createSubtask(parentId: string, subtaskData: TaskCreateDTO): Promise<Task> {
  const parent = await this.getTask(parentId);
  
  // 默认值设置
  const defaults = {
    visibility: Visibility.PRIVATE,  // 默认私有
    bountyAmount: 0,  // 初始赏金为0
    assigneeId: parent.assigneeId || null,  // 默认承接人与母任务一致
    isPublished: false,  // 未发布
    bountyPayerId: parent.assigneeId || null,  // 赏金支付者为母任务承接人
  };
  
  return this.createTask({
    ...subtaskData,
    ...defaults,
    parentId,
  });
}
```

### 规则 3: 子任务发布权限
**谁可以发布子任务？**
- 只有一级任务的承接者

**前提条件**:
- 一级任务必须已被承接（assigneeId 不为空）

**验证逻辑**:
```typescript
async canPublishSubtask(subtaskId: string, userId: string): Promise<boolean> {
  const subtask = await this.getTask(subtaskId);
  if (!subtask || !subtask.parentId) return false;
  
  const parentTask = await this.getTask(subtask.parentId);
  if (!parentTask) return false;
  
  // 只有母任务的承接者可以发布子任务
  if (parentTask.assigneeId !== userId) return false;
  
  // 母任务必须已被承接
  if (!parentTask.assigneeId) return false;
  
  return true;
}
```

### 规则 4: 子任务发布操作
```typescript
async publishSubtask(
  subtaskId: string, 
  userId: string, 
  publishData: {
    visibility: Visibility;
    bountyAmount: number;
    positionId?: string;
  }
): Promise<Task> {
  // 验证权限
  const canPublish = await this.canPublishSubtask(subtaskId, userId);
  if (!canPublish) {
    throw new ValidationError('Only the parent task assignee can publish subtasks');
  }
  
  // 验证赏金金额
  if (publishData.bountyAmount <= 0) {
    throw new ValidationError('Bounty amount must be greater than 0');
  }
  
  // 验证用户余额
  const user = await this.userService.getUser(userId);
  if (user.balance < publishData.bountyAmount) {
    throw new ValidationError('Insufficient balance to publish subtask');
  }
  
  // 更新子任务
  const updatedTask = await this.updateTask(subtaskId, {
    visibility: publishData.visibility,
    bountyAmount: publishData.bountyAmount,
    positionId: publishData.positionId,
    isPublished: true,
    publishedAt: new Date(),
    publishedBy: userId,
  });
  
  return updatedTask;
}
```

### 规则 5: 子任务承接和赏金支付
```typescript
async acceptSubtask(subtaskId: string, userId: string): Promise<Task> {
  const subtask = await this.getTask(subtaskId);
  if (!subtask || !subtask.parentId) {
    throw new NotFoundError('Subtask not found');
  }
  
  // 验证子任务已发布
  if (!subtask.isPublished || subtask.visibility === Visibility.PRIVATE) {
    throw new ValidationError('Subtask is not published');
  }
  
  // 获取母任务
  const parentTask = await this.getTask(subtask.parentId);
  if (!parentTask) {
    throw new NotFoundError('Parent task not found');
  }
  
  // 赏金支付者是母任务的承接人
  const payerId = parentTask.assigneeId;
  if (!payerId) {
    throw new ValidationError('Parent task has no assignee');
  }
  
  // 验证支付者余额
  const payer = await this.userService.getUser(payerId);
  if (payer.balance < subtask.bountyAmount) {
    throw new ValidationError('Payer has insufficient balance');
  }
  
  // 开始事务
  await this.transactionManager.executeInTransaction(async (client) => {
    // 1. 从支付者账户扣除赏金
    await this.userService.updateBalance(payerId, -subtask.bountyAmount, client);
    
    // 2. 锁定赏金（记录到 bounty_transactions）
    await this.bountyService.lockBounty({
      taskId: subtaskId,
      payerId: payerId,
      amount: subtask.bountyAmount,
    }, client);
    
    // 3. 分配任务给承接者
    await this.updateTask(subtaskId, {
      assigneeId: userId,
      status: TaskStatus.IN_PROGRESS,
    }, client);
  });
  
  return this.getTask(subtaskId);
}
```

## 工作流程图

### 一级任务工作流
```
创建者创建任务
  ↓
设置任务属性（赏金由公式计算）
  ↓
发布任务（visibility = PUBLIC/POSITION_ONLY）
  ↓
其他用户承接任务
  ↓
承接者可以创建子任务
```

### 二级任务工作流
```
创建者/母任务承接者创建子任务
  ↓
子任务默认私有（visibility = PRIVATE）
  ↓
子任务默认承接人 = 母任务承接人
  ↓
子任务赏金 = 0
  ↓
母任务承接者决定是否发布
  ↓
发布：设置可见性 + 设置赏金
  ↓
其他用户承接子任务
  ↓
赏金从母任务承接者账户扣除
```

## API 设计

### 1. 创建子任务 API
```typescript
POST /api/tasks/:parentId/subtasks
Authorization: Bearer <token>

Request Body:
{
  "name": "子任务名称",
  "description": "子任务描述",
  "estimatedHours": 10,
  "complexity": 3,
  "priority": 4,
  "plannedStartDate": "2026-02-10",
  "plannedEndDate": "2026-02-20"
  // 不需要传 visibility, bountyAmount, assigneeId
  // 这些会自动设置默认值
}

Response:
{
  "id": "uuid",
  "name": "子任务名称",
  "visibility": "PRIVATE",  // 默认私有
  "bountyAmount": 0,  // 默认0
  "assigneeId": "parent-assignee-id",  // 默认母任务承接人
  "isPublished": false,
  ...
}
```

### 2. 发布子任务 API
```typescript
POST /api/tasks/:subtaskId/publish
Authorization: Bearer <token>  // 必须是母任务承接人

Request Body:
{
  "visibility": "PUBLIC",  // 或 "POSITION_ONLY"
  "bountyAmount": 500,  // 赏金金额
  "positionId": "uuid"  // 可选，仅当 visibility = POSITION_ONLY 时需要
}

Response:
{
  "id": "uuid",
  "visibility": "PUBLIC",
  "bountyAmount": 500,
  "isPublished": true,
  "publishedAt": "2026-02-02T10:00:00Z",
  "publishedBy": "user-id",
  ...
}
```

### 3. 承接子任务 API
```typescript
POST /api/tasks/:subtaskId/accept
Authorization: Bearer <token>

Response:
{
  "id": "uuid",
  "assigneeId": "new-assignee-id",
  "status": "IN_PROGRESS",
  "bountyTransaction": {
    "id": "uuid",
    "payerId": "parent-assignee-id",
    "amount": 500,
    "status": "LOCKED"
  },
  ...
}
```

## 前端界面变更

### 1. 子任务创建表单
**移除字段**:
- 可见性选择（自动设为 PRIVATE）
- 赏金金额（自动设为 0）

**保留字段**:
- 任务名称
- 任务描述
- 标签
- 计划时间
- 预估工时
- 复杂度
- 优先级

**新增提示**:
```
💡 提示：
- 子任务创建后默认为私有状态
- 默认承接人为母任务承接人
- 您可以稍后决定是否发布此子任务
```

### 2. 子任务列表界面
**显示子任务状态**:
- 🔒 私有（未发布）
- 🌐 已发布（可承接）
- 👤 已承接

**操作按钮**（仅母任务承接人可见）:
- 发布子任务（仅未发布的子任务）
- 编辑子任务
- 删除子任务

### 3. 发布子任务对话框
```
┌─────────────────────────────────┐
│ 发布子任务                       │
├─────────────────────────────────┤
│ 任务名称: [显示子任务名称]       │
│                                 │
│ 可见性: [下拉选择]               │
│   ○ 公开                        │
│   ○ 仅特定岗位                  │
│                                 │
│ 岗位限制: [下拉选择]（可选）     │
│                                 │
│ 赏金金额: [输入框] 元            │
│                                 │
│ 当前余额: 1000 元                │
│ 发布后余额: 500 元               │
│                                 │
│ ⚠️ 注意：                       │
│ - 赏金将从您的账户中扣除         │
│ - 任务被承接后赏金将被锁定       │
│ - 任务完成后赏金将支付给承接者   │
│                                 │
│ [取消]  [确认发布]               │
└─────────────────────────────────┘
```

## 数据库迁移

### 新增字段
```sql
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS bounty_payer_id UUID REFERENCES users(id);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS published_at TIMESTAMP;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS published_by UUID REFERENCES users(id);

-- 为现有任务设置默认值
UPDATE tasks SET is_published = true WHERE depth = 0;  -- 顶级任务默认已发布
UPDATE tasks SET is_published = false WHERE depth = 1;  -- 子任务默认未发布
```

## 权限控制

### 权限矩阵

| 操作 | 任务创建者 | 母任务承接者 | 其他用户 |
|------|-----------|-------------|---------|
| 创建子任务 | ✅ | ✅ | ❌ |
| 发布子任务 | ❌ | ✅ | ❌ |
| 编辑未发布子任务 | ✅ | ✅ | ❌ |
| 编辑已发布子任务 | ❌ | ✅ | ❌ |
| 删除未发布子任务 | ✅ | ✅ | ❌ |
| 删除已发布子任务 | ❌ | ❌ | ❌ |
| 承接已发布子任务 | ❌ | ❌ | ✅ |

## 测试场景

### 场景 1: 创建私有子任务
1. 用户A创建一级任务
2. 用户B承接一级任务
3. 用户B创建子任务
4. ✓ 子任务默认私有
5. ✓ 子任务默认承接人为用户B
6. ✓ 子任务赏金为0

### 场景 2: 发布子任务
1. 用户B（母任务承接人）发布子任务
2. 设置可见性为公开
3. 设置赏金为500元
4. ✓ 子任务状态变为已发布
5. ✓ 子任务在赏金任务列表中可见

### 场景 3: 承接子任务并支付赏金
1. 用户C承接已发布的子任务
2. ✓ 从用户B账户扣除500元
3. ✓ 赏金被锁定
4. ✓ 子任务分配给用户C

### 场景 4: 完成子任务并结算赏金
1. 用户C完成子任务
2. ✓ 赏金从锁定状态转为已支付
3. ✓ 500元转入用户C账户

## 实施计划

### Phase 1: 数据库和模型层
- [ ] 添加新字段到 Task 模型
- [ ] 创建数据库迁移脚本
- [ ] 更新 TaskCreateDTO 和 TaskUpdateDTO

### Phase 2: 业务逻辑层
- [ ] 修改 createSubtask 方法
- [ ] 实现 publishSubtask 方法
- [ ] 修改 acceptTask 方法支持子任务
- [ ] 实现权限验证逻辑

### Phase 3: API 层
- [ ] 创建 POST /api/tasks/:subtaskId/publish 端点
- [ ] 修改 POST /api/tasks/:parentId/subtasks 端点
- [ ] 修改 POST /api/tasks/:taskId/accept 端点

### Phase 4: 前端界面
- [ ] 简化子任务创建表单
- [ ] 实现发布子任务对话框
- [ ] 更新子任务列表显示
- [ ] 添加发布状态标识

### Phase 5: 测试和文档
- [ ] 编写单元测试
- [ ] 编写集成测试
- [ ] 更新API文档
- [ ] 更新用户手册

## 注意事项

1. **向后兼容性**: 现有的顶级任务不受影响
2. **数据迁移**: 现有子任务需要标记为已发布
3. **余额验证**: 发布子任务前必须验证用户余额
4. **事务处理**: 承接子任务时的赏金扣除必须在事务中完成
5. **通知机制**: 子任务发布、承接时需要发送通知

## 日期

2026-02-02
