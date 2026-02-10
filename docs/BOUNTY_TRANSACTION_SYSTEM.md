# 赏金交易记录系统完整逻辑

## 系统概述

赏金交易记录系统负责管理平台上所有的赏金流转，包括任务完成奖励、助手分成、额外奖励和退款等。系统确保每一笔赏金的流动都有完整的记录和追溯。

## 核心组件

### 1. 数据模型

#### BountyTransaction (赏金交易记录)

```typescript
interface BountyTransaction {
  id: string;                    // 交易ID (UUID)
  taskId: string;                // 关联任务ID
  fromUserId: string | null;     // 发送方用户ID (NULL表示系统发放)
  toUserId: string;              // 接收方用户ID
  amount: number;                // 交易金额
  type: TransactionType;         // 交易类型
  description: string | null;    // 交易描述
  createdAt: Date;               // 创建时间
}
```

#### TransactionType (交易类型)

```typescript
enum TransactionType {
  TASK_COMPLETION = 'task_completion',  // 任务完成奖励
  EXTRA_REWARD = 'extra_reward',        // 额外奖励
  ASSISTANT_SHARE = 'assistant_share',  // 助手分成
  REFUND = 'refund',                    // 退款
}
```

### 2. 服务层架构

```
┌─────────────────────────────────────────────────────────────┐
│                      TaskService                             │
│  - completeTask(): 完成任务，触发赏金分配                      │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────────────────┐
│              BountyDistributionService                       │
│  - calculateDistribution(): 计算赏金分配方案                  │
│  - distributeBounty(): 执行赏金分配并创建交易记录              │
│  - addAssistant(): 添加助手                                  │
│  - removeAssistant(): 移除助手                               │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────────────────┐
│               BountyHistoryService                           │
│  - getUserTransactionHistory(): 获取用户交易历史              │
│  - getUserBountySummary(): 获取用户赏金统计                  │
└─────────────────────────────────────────────────────────────┘
```

## 完整业务流程

### 流程 1: 任务完成与赏金分配

```
1. 用户完成任务
   ↓
2. TaskService.completeTask()
   - 验证权限（只有assignee可以完成）
   - 更新任务状态为 COMPLETED
   - 锁定进度为 100%
   ↓
3. BountyDistributionService.distributeBounty()
   - 检查任务是否已结算 (is_bounty_settled)
   - 如果未结算，执行分配
   ↓
4. calculateDistribution() - 计算分配方案
   - 获取任务总赏金
   - 获取所有助手及其分配比例
   - 计算固定分配金额
   - 计算百分比分配金额
   - 计算主要执行者剩余金额
   - 获取额外奖励金额
   ↓
5. 创建交易记录（在事务中）
   - 主要执行者: task_completion 类型
   - 每个助手: assistant_share 类型
   - 额外奖励: extra_reward 类型
   ↓
6. 更新任务状态
   - 设置 is_bounty_settled = true
   ↓
7. 提交事务
   - 成功: 返回分配结果和交易ID列表
   - 失败: 回滚所有更改
```

### 流程 2: 助手管理

#### 添加助手

```
1. BountyDistributionService.addAssistant()
   ↓
2. 验证
   - 分配值必须为正数
   - 百分比不能超过100%
   - 任务必须已分配
   - 不能添加主要执行者为助手
   ↓
3. 固定金额验证
   - 计算现有固定分配总额
   - 验证新增后不超过任务总赏金
   ↓
4. 插入助手记录
   - 防止重复添加（唯一约束）
```

#### 移除助手

```
1. BountyDistributionService.removeAssistant()
   ↓
2. 删除助手记录
   - 如果不存在，抛出 NotFoundError
```

### 流程 3: 赏金分配计算逻辑

#### 分配算法

```typescript
// 1. 获取任务信息
totalBounty = task.bounty_amount
assigneeId = task.assignee_id
assistants = getTaskAssistants(taskId)

// 2. 计算固定分配
totalFixedAllocation = sum(assistants where type = 'fixed')

// 3. 计算剩余金额
remainingAfterFixed = totalBounty - totalFixedAllocation

// 4. 计算百分比分配
for each assistant:
  if type == 'fixed':
    amount = allocationValue
  else: // percentage
    amount = remainingAfterFixed * (allocationValue / 100)

// 5. 计算主要执行者金额
totalAssistantAmount = sum(all assistant amounts)
mainAssigneeAmount = totalBounty - totalAssistantAmount

// 6. 获取额外奖励
extraBounty = sum(task_reviews.extra_bounty where task_id = taskId)
```

#### 分配示例

**场景**: 任务总赏金 1000，有2个助手

- 助手A: 固定分配 200
- 助手B: 百分比分配 20%

**计算过程**:

```
1. totalBounty = 1000
2. totalFixedAllocation = 200
3. remainingAfterFixed = 1000 - 200 = 800
4. 助手A金额 = 200 (固定)
5. 助手B金额 = 800 * 0.2 = 160 (百分比)
6. totalAssistantAmount = 200 + 160 = 360
7. mainAssigneeAmount = 1000 - 360 = 640
```

**最终分配**:
- 主要执行者: 640
- 助手A: 200
- 助手B: 160
- 总计: 1000 ✓

### 流程 4: 交易历史查询

```
1. 用户请求交易历史
   ↓
2. BountyHistoryService.getUserTransactionHistory()
   - 验证分页参数 (page, limit)
   - 验证交易类型过滤器（可选）
   - 验证权限（只能查看自己的或管理员）
   ↓
3. 构建查询
   - WHERE: (from_user_id = userId OR to_user_id = userId)
   - 可选: AND type = transactionType
   - ORDER BY: created_at DESC
   - LIMIT + OFFSET: 分页
   ↓
4. 执行查询
   - 使用窗口函数获取总数
   - LEFT JOIN tasks 获取任务名称
   ↓
5. 计算统计信息
   - totalEarned: 收入总额
   - totalSpent: 支出总额
   - netBalance: 净余额
   - transactionCount: 交易数量
   ↓
6. 返回结果
   - transactions: 交易列表
   - pagination: 分页信息
   - summary: 统计摘要
```

## 数据库 Schema

### bounty_transactions 表

```sql
CREATE TABLE bounty_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  from_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
  type transaction_type NOT NULL,
  description TEXT,
  status transaction_status NOT NULL DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_bounty_transactions_task_id ON bounty_transactions(task_id);
CREATE INDEX idx_bounty_transactions_from_user_id ON bounty_transactions(from_user_id);
CREATE INDEX idx_bounty_transactions_to_user_id ON bounty_transactions(to_user_id);
CREATE INDEX idx_bounty_transactions_created_at ON bounty_transactions(created_at DESC);
CREATE INDEX idx_bounty_transactions_type ON bounty_transactions(type);
CREATE INDEX idx_bounty_transactions_user_history ON bounty_transactions(from_user_id, to_user_id, created_at DESC);
```

### task_assistants 表

```sql
CREATE TABLE task_assistants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  allocation_type allocation_type NOT NULL,
  allocation_value DECIMAL(10, 2) NOT NULL CHECK (allocation_value > 0),
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(task_id, user_id)
);
```

## API 端点

### 1. 获取用户交易历史

```
GET /api/bounty-history/:userId?page=1&limit=20&type=task_completion

Response:
{
  "transactions": [
    {
      "id": "uuid",
      "taskId": "uuid",
      "fromUserId": null,
      "toUserId": "uuid",
      "amount": 640.00,
      "type": "task_completion",
      "description": "Task completion bounty",
      "createdAt": "2026-02-09T...",
      "taskName": "实现用户登录功能"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "pageSize": 20,
    "totalCount": 45,
    "totalPages": 3
  },
  "summary": {
    "totalEarned": 12500.00,
    "totalSpent": 3200.00,
    "netBalance": 9300.00,
    "transactionCount": 45
  }
}
```

### 2. 获取用户赏金统计

```
GET /api/bounty-history/:userId/summary?type=task_completion

Response:
{
  "totalEarned": 12500.00,
  "totalSpent": 3200.00,
  "netBalance": 9300.00,
  "transactionCount": 45
}
```

## 错误处理

### 1. 赏金分配错误

```typescript
// 任务未分配
if (!assigneeId) {
  throw new ValidationError('Cannot distribute bounty for unassigned task');
}

// 赏金已结算
if (task.is_bounty_settled) {
  throw new ValidationError('Bounty already settled for this task');
}

// 固定分配超出总额
if (remainingAfterFixed < 0) {
  throw new ValidationError('Fixed allocations exceed total bounty');
}
```

### 2. 助手管理错误

```typescript
// 分配值无效
if (allocationValue <= 0) {
  throw new ValidationError('Allocation value must be positive');
}

// 百分比超出范围
if (allocationType === 'PERCENTAGE' && allocationValue > 100) {
  throw new ValidationError('Percentage allocation cannot exceed 100%');
}

// 主要执行者不能是助手
if (userId === assigneeId) {
  throw new ValidationError('Main assignee cannot be added as assistant');
}

// 重复添加
if (error.code === '23505') {
  throw new ValidationError('User is already an assistant on this task');
}
```

### 3. 软失败策略

在 `TaskService.completeTask()` 中，赏金分配失败不会阻止任务完成：

```typescript
try {
  if (!task.isBountySettled) {
    await this.bountyDistributionService.distributeBounty(taskId);
    logger.info('Bounty distributed successfully', { taskId, userId });
  }
} catch (error) {
  // 记录错误但不阻止任务完成
  logger.error('Failed to distribute bounty after task completion', { 
    error, 
    taskId, 
    userId 
  });
}
```

## 事务管理

赏金分配使用数据库事务确保原子性：

```typescript
const client = await pool.connect();
try {
  await client.query('BEGIN');
  
  // 1. 创建所有交易记录
  // 2. 更新任务状态
  
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
}
```

## 权限控制

### 查看交易历史

- 用户只能查看自己的交易历史
- super_admin 可以查看任何用户的交易历史

```typescript
if (user.id !== userId && user.role !== 'super_admin') {
  throw new AppError('FORBIDDEN', 'No permission to view transaction history', 403);
}
```

## 性能优化

### 1. 数据库索引

- `task_id`: 快速查询任务相关交易
- `from_user_id`, `to_user_id`: 快速查询用户交易
- `created_at DESC`: 优化时间排序
- `type`: 优化类型过滤
- 复合索引 `(from_user_id, to_user_id, created_at)`: 优化用户历史查询

### 2. 分页查询

- 使用 LIMIT + OFFSET 实现分页
- 使用窗口函数 `COUNT(*) OVER()` 一次查询获取总数
- 限制每页最大 100 条记录

### 3. 查询优化

```sql
-- 使用 LEFT JOIN 而不是多次查询
SELECT bt.*, t.name as task_name
FROM bounty_transactions bt
LEFT JOIN tasks t ON bt.task_id = t.id
WHERE ...
```

## 数据一致性

### 1. 防止重复结算

```typescript
// 检查 is_bounty_settled 标志
if (task.is_bounty_settled) {
  throw new ValidationError('Bounty already settled for this task');
}
```

### 2. 防止重复助手

```sql
-- 唯一约束
UNIQUE(task_id, user_id)
```

### 3. 金额验证

```sql
-- 检查约束
CHECK (amount >= 0)
CHECK (allocation_value > 0)
```

## 监控与日志

### 关键日志点

```typescript
// 成功分配
logger.info('Bounty distributed successfully', { 
  taskId, 
  userId, 
  transactionIds 
});

// 分配失败
logger.error('Failed to distribute bounty after task completion', { 
  error, 
  taskId, 
  userId,
  message: error.message 
});

// 查询错误
logger.error('Error fetching transaction history:', error);
```

## 未来扩展

### 1. 交易状态管理

当前所有交易默认为 `completed` 状态，未来可以支持：

- `pending`: 待处理
- `locked`: 锁定中
- `cancelled`: 已取消

### 2. 用户余额系统

当前交易记录独立存在，未来可以：

- 维护用户余额表
- 实现余额实时更新
- 支持余额不足检查

### 3. 交易撤销

支持特定条件下的交易撤销：

- 任务被取消
- 发现作弊行为
- 管理员手动干预

### 4. 批量操作

支持批量赏金分配：

- 批量完成任务
- 批量发放奖励
- 批量退款

## 相关文件

### 服务层
- `packages/backend/src/services/BountyDistributionService.ts`
- `packages/backend/src/services/BountyHistoryService.ts`
- `packages/backend/src/services/BountyService.ts`
- `packages/backend/src/services/TaskService.ts`

### 模型层
- `packages/backend/src/models/BountyTransaction.ts`
- `packages/backend/src/models/TaskAssistant.ts`
- `packages/backend/src/models/Task.ts`

### 路由层
- `packages/backend/src/routes/bountyHistory.routes.ts`

### 数据库
- `packages/database/migrations/20241212_000001_update_bounty_transactions_schema.sql`

### 文档
- `docs/fixes/BOUNTY_TRANSACTION_MISSING_FIX.md`
- `docs/FEATURES_GUIDE.md`

## 总结

赏金交易记录系统是平台的核心功能之一，确保了：

1. ✅ **完整性**: 每笔赏金流转都有记录
2. ✅ **准确性**: 使用事务保证数据一致性
3. ✅ **可追溯**: 完整的交易历史和统计
4. ✅ **灵活性**: 支持多种分配方式（固定/百分比）
5. ✅ **可靠性**: 软失败策略保证核心流程
6. ✅ **性能**: 优化的索引和查询
7. ✅ **安全性**: 严格的权限控制和验证

系统已经过修复，现在能够正确地在任务完成时创建赏金交易记录，并提供完整的交易历史查询功能。
