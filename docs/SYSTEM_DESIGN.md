# 系统设计文档

本文档整合了赏金猎人平台的核心系统设计，包括赏金交易系统、用户余额系统、排名系统和关键设计决策。

---

## 目录

1. [赏金交易记录系统](#赏金交易记录系统)
2. [用户余额系统](#用户余额系统)
3. [排名系统](#排名系统)
4. [关键设计决策](#关键设计决策)

---

## 赏金交易记录系统

### 系统概述

赏金交易记录系统负责管理平台上所有的赏金流转，包括任务完成奖励、助手分成、额外奖励和退款等。系统确保每一笔赏金的流动都有完整的记录和追溯。

### 核心组件

#### 数据模型

**BountyTransaction (赏金交易记录)**

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

**TransactionType (交易类型)**

```typescript
enum TransactionType {
  TASK_COMPLETION = 'task_completion',  // 任务完成奖励
  EXTRA_REWARD = 'extra_reward',        // 额外奖励
  ASSISTANT_SHARE = 'assistant_share',  // 助手分成
  REFUND = 'refund',                    // 退款
}
```

### 业务流程

#### 任务完成与赏金分配

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

#### 赏金分配算法

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

### 数据库设计

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
```

---

## 用户余额系统

### 概述

用户余额系统用于管理用户的账户余额，主要用于发布任务时的赏金支付。

### 数据库字段

#### users 表新增字段

```sql
balance DECIMAL(10, 2) DEFAULT 0.00 NOT NULL
```

- **类型**: DECIMAL(10, 2) - 最多支持 8 位整数和 2 位小数
- **默认值**: 0.00
- **约束**: 
  - NOT NULL - 不能为空
  - CHECK (balance >= 0) - 余额不能为负数
- **索引**: idx_users_balance - 用于优化余额查询

### 功能说明

#### 发布子任务扣款

当用户发布子任务到公开市场时：
- 系统会从发布者的账户余额中扣除设置的赏金金额
- 如果余额不足，发布操作会失败
- 扣除的金额会在任务完成后支付给承接者

#### 余额查询

用户可以在个人信息中查看当前余额。

#### 余额充值（待实现）

未来可以添加余额充值功能：
- 管理员手动充值
- 在线支付充值
- 任务完成后自动到账

### 安全考虑

1. **余额验证**: 所有余额操作都在后端进行验证
2. **事务处理**: 余额扣除使用数据库事务确保一致性
3. **负数保护**: 数据库约束防止余额变为负数
4. **审计日志**: 建议记录所有余额变动（待实现）

---

## 排名系统

### 系统概述

排名系统是一个基于用户完成任务赚取赏金的排行榜功能，支持三种统计周期：
- **月度排名** (monthly): 统计当月完成任务的赏金总额
- **季度排名** (quarterly): 统计当季度完成任务的赏金总额
- **总累积排名** (all_time): 统计所有时间完成任务的赏金总额

### 核心特性
- 实时更新：任务完成后 2 秒内更新排名
- 防抖机制：多个任务快速完成时批量更新，避免重复计算
- 相同赏金相同排名：赏金相同的用户获得相同排名
- 多周期支持：可查看历史月份、季度的排名数据

### 数据库设计

#### Rankings 表结构

```sql
CREATE TABLE rankings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period ranking_period NOT NULL,  -- 'monthly', 'quarterly', 'all_time'
  year INTEGER NOT NULL CHECK (year > 2000),
  month INTEGER CHECK (month >= 1 AND month <= 12),
  quarter INTEGER CHECK (quarter >= 1 AND quarter <= 4),
  total_bounty DECIMAL(10, 2) NOT NULL DEFAULT 0,
  completed_tasks_count INTEGER DEFAULT 0,  -- 完成任务数量
  rank INTEGER NOT NULL CHECK (rank > 0),
  calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, period, year, month, quarter)
);
```

#### 索引设计

```sql
-- 用户查询自己的排名
CREATE INDEX idx_rankings_user_period_year_month 
  ON rankings(user_id, period, year, month);

-- 获取排行榜列表（按排名排序）
CREATE INDEX idx_rankings_period_year_month_rank 
  ON rankings(period, year, month, rank);

-- 用户相关查询
CREATE INDEX idx_rankings_user_id ON rankings(user_id);
```

### 排名算法

#### 相同赏金相同排名算法

```typescript
let currentRank = 1;
let previousBounty: number | null = null;

for (let i = 0; i < users.length; i++) {
  const currentBounty = users[i].totalBounty;
  
  // 只有当赏金不同时才更新排名
  if (previousBounty !== null && currentBounty !== previousBounty) {
    currentRank = i + 1;
  }
  
  users[i].rank = currentRank;
  previousBounty = currentBounty;
}
```

**示例**:
```
位置  赏金   排名
0     $100   1
1     $100   1  (相同赏金，保持排名1)
2     $80    3  (不同赏金，跳到位置3)
3     $80    3  (相同赏金，保持排名3)
4     $50    5  (不同赏金，跳到位置5)
```

### 更新机制

#### 防抖机制

排名更新使用防抖（Debounce）机制，避免频繁计算：

```typescript
class RankingUpdateQueue {
  private readonly DEBOUNCE_DELAY = 2000; // 2秒延迟
  private updateTimer: NodeJS.Timeout | null = null;
  private pendingUpdate: boolean = false;
  private isUpdating: boolean = false;
}
```

**防抖效果**:
- 如果 2 秒内有多个任务完成，定时器会被重置
- 只有在最后一个任务完成后 2 秒，才会真正执行更新
- 这样可以将多个任务的完成批量处理

---

## 关键设计决策

### is_bounty_settled 字段的必要性

#### 问题背景

在赏金猎人平台中，`is_bounty_settled` 是 tasks 表中的一个布尔字段，用于标记任务的赏金是否已经结算。

#### 核心原因

##### 1. 防止重复结算 (最重要)

**问题场景**：
```
时间线：
T1: 任务完成，触发赏金分配
T2: 系统创建交易记录，赏金已发放
T3: 由于某种原因（bug、手动操作、重试机制），再次触发赏金分配
T4: 如果没有 is_bounty_settled 标志，会重复发放赏金！
```

**有这个字段的保护**：
```typescript
// 安全代码 - 有防护
async distributeBounty(taskId: string) {
  const task = await getTask(taskId);
  
  // 检查是否已结算
  if (task.is_bounty_settled) {
    throw new ValidationError('Bounty already settled for this task');
  }
  
  // ... 执行分配逻辑
  
  // 标记为已结算
  await updateTask(taskId, { is_bounty_settled: true });
}
```

##### 2. 控制赏金重新计算

**业务需求**：任务属性变化时，赏金应该重新计算

```typescript
// 系统行为
if (!task.is_bounty_settled) {
  // 允许重新计算
  newBounty = calculateBounty(task);
  task.bountyAmount = newBounty;
} else {
  // 已结算，不允许修改
  throw new Error('Cannot modify bounty for settled tasks');
}
```

##### 3. 数据一致性保证

**性能对比**：

#### 方案A：没有 is_bounty_settled（不推荐）
```typescript
// 每次都要查询交易表
async canDistributeBounty(taskId: string): boolean {
  const transactions = await db.query(
    'SELECT * FROM bounty_transactions WHERE task_id = $1',
    [taskId]
  );
  return transactions.length === 0;  // 慢！需要额外查询
}
```

#### 方案B：使用 is_bounty_settled（推荐）
```typescript
// 直接查看任务状态
async canDistributeBounty(taskId: string): boolean {
  const task = await getTask(taskId);
  return !task.is_bounty_settled;  // 快！不需要额外查询
}
```

##### 4. 幂等性保证

**什么是幂等性**：同一个操作执行多次，结果与执行一次相同

```typescript
// 幂等的赏金分配
async distributeBounty(taskId: string) {
  const task = await getTask(taskId);
  
  // 第一次调用：settled=false，执行分配
  // 第二次调用：settled=true，直接返回
  // 第N次调用：settled=true，直接返回
  if (task.is_bounty_settled) {
    return { message: 'Already settled', taskId };
  }
  
  // ... 执行分配逻辑
}
```

#### 结论

`is_bounty_settled` 不是可有可无的字段，而是系统设计中的**关键防护机制**和**性能优化手段**。它：

1. ✅ **防止重复结算** - 最重要的功能，避免财务损失
2. ✅ **控制赏金修改** - 已结算的任务不能修改赏金
3. ✅ **提升查询性能** - 避免频繁 JOIN 交易表
4. ✅ **保证幂等性** - 支持安全的重试机制
5. ✅ **简化业务逻辑** - 清晰的状态标识
6. ✅ **便于审计追溯** - 快速查询结算状态
7. ✅ **数据一致性** - 与交易记录配合使用

---

## 相关文件

### 服务层
- `packages/backend/src/services/BountyDistributionService.ts`
- `packages/backend/src/services/BountyHistoryService.ts`
- `packages/backend/src/services/BountyService.ts`
- `packages/backend/src/services/TaskService.ts`
- `packages/backend/src/services/RankingService.ts`
- `packages/backend/src/services/RankingUpdateQueue.ts`

### 模型层
- `packages/backend/src/models/BountyTransaction.ts`
- `packages/backend/src/models/TaskAssistant.ts`
- `packages/backend/src/models/Task.ts`
- `packages/backend/src/models/User.ts`
- `packages/backend/src/models/Ranking.ts`

### 路由层
- `packages/backend/src/routes/bountyHistory.routes.ts`
- `packages/backend/src/routes/ranking.routes.ts`

### 数据库
- `packages/database/migrations/20241212_000001_update_bounty_transactions_schema.sql`
- `packages/database/migrations/20260203_000002_add_user_balance.sql`

---

**文档版本**: 1.0  
**最后更新**: 2026-03-05  
**维护者**: 开发团队