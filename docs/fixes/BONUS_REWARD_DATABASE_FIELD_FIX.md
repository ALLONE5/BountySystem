# 额外奖赏数据库字段错误修复

## 问题描述
用户在添加额外奖赏时遇到数据库错误：
```
关系 "bounty_transactions" 的 "user_id" 字段不存在
```

## 问题分析

### 错误原因
`TaskService.addBonusReward()` 方法中的 SQL 查询使用了旧的数据库字段名，与当前数据库架构不匹配。

### 数据库架构变更历史

**原始架构** (20241211_000001):
```sql
CREATE TABLE bounty_transactions (
  id UUID PRIMARY KEY,
  task_id UUID NOT NULL,
  user_id UUID NOT NULL,  -- 旧字段名
  amount DECIMAL(10, 2) NOT NULL,
  transaction_type transaction_type NOT NULL,
  created_at TIMESTAMP
);
```

**更新后架构** (20241212_000001):
```sql
CREATE TABLE bounty_transactions (
  id UUID PRIMARY KEY,
  task_id UUID,
  from_user_id UUID,      -- 新字段：发送方
  to_user_id UUID NOT NULL,  -- 新字段：接收方
  amount DECIMAL(10, 2) NOT NULL,
  type transaction_type NOT NULL,  -- 字段名从 transaction_type 改为 type
  description TEXT,
  status transaction_status NOT NULL DEFAULT 'completed',
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**类型枚举变更**:
```sql
-- 旧枚举
CREATE TYPE transaction_type AS ENUM ('main_bounty', 'assistant_bounty', 'extra_bounty');

-- 新枚举
CREATE TYPE transaction_type AS ENUM (
  'task_completion',
  'extra_reward',
  'assistant_share',
  'refund'
);
```

## 解决方案

### 步骤 1: 运行数据库迁移

首先需要更新数据库，添加新的通知类型枚举值。

**运行迁移脚本**:
```bash
cd packages/backend
node scripts/add-notification-types-migration.cjs
```

或者直接在数据库中执行 SQL：
```sql
-- 添加新的通知类型
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'bonus_reward';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'admin_announcement';
```

### 步骤 2: 修复代码

更新 `TaskService.addBonusReward()` 方法中的 SQL 查询，使用正确的字段名和枚举值。

**修复前的代码**:
```typescript
const transactionQuery = `
  INSERT INTO bounty_transactions (
    task_id, user_id, amount, transaction_type, description, created_at
  ) VALUES ($1, $2, $3, $4, $5, NOW())
  RETURNING *
`;

const transactionResult = await pool.query(transactionQuery, [
  taskId,
  task.assigneeId,
  bonusAmount,
  'bonus',  // ❌ 错误：不存在的枚举值
  description,
]);
```

**修复后的代码**:
```typescript
const transactionQuery = `
  INSERT INTO bounty_transactions (
    task_id, from_user_id, to_user_id, amount, type, description, status, created_at
  ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
  RETURNING *
`;

const transactionResult = await pool.query(transactionQuery, [
  taskId,
  null,  // ✅ from_user_id 为 null（管理员奖赏）
  task.assigneeId,  // ✅ to_user_id（接收方）
  bonusAmount,
  'extra_reward',  // ✅ 正确的枚举值
  description,
  'completed',  // ✅ 添加 status 字段
]);
```

### 字段映射对照表

| 旧字段名 | 新字段名 | 说明 |
|---------|---------|------|
| `user_id` | `to_user_id` | 接收赏金的用户 |
| - | `from_user_id` | 发送赏金的用户（新增，可为 null） |
| `transaction_type` | `type` | 交易类型字段名简化 |
| - | `status` | 交易状态（新增） |
| - | `updated_at` | 更新时间（新增） |

### 枚举值映射对照表

| 旧枚举值 | 新枚举值 | 说明 |
|---------|---------|------|
| `main_bounty` | `task_completion` | 任务完成赏金 |
| `extra_bounty` | `extra_reward` | 额外奖赏 |
| `assistant_bounty` | `assistant_share` | 协作者分成 |
| - | `refund` | 退款（新增） |

## 修复文件
- `packages/backend/src/services/TaskService.ts`

## 验证步骤

### 1. 数据库验证
```sql
-- 检查表结构
\d bounty_transactions

-- 应该看到以下字段：
-- - from_user_id (uuid)
-- - to_user_id (uuid)
-- - type (transaction_type)
-- - status (transaction_status)
```

### 2. 功能测试
1. 以管理员身份登录
2. 打开一个已完成的任务
3. 点击"额外奖赏"按钮
4. 输入金额（例如：50）和原因（例如：任务完成质量优秀）
5. 点击"确认发放"
6. 验证：
   - ✅ 没有数据库错误
   - ✅ 显示成功提示
   - ✅ 任务赏金金额增加
   - ✅ 用户余额增加
   - ✅ 创建了交易记录
   - ✅ 用户收到通知

### 3. 数据库记录验证
```sql
-- 查看最新的交易记录
SELECT 
  id,
  task_id,
  from_user_id,
  to_user_id,
  amount,
  type,
  description,
  status,
  created_at
FROM bounty_transactions
ORDER BY created_at DESC
LIMIT 5;

-- 应该看到：
-- - from_user_id: NULL（管理员奖赏）
-- - to_user_id: 承接人ID
-- - type: 'extra_reward'
-- - status: 'completed'
-- - description: '额外奖赏: {原因}'
```

### 4. 通知验证
```sql
-- 查看用户收到的通知
SELECT 
  id,
  user_id,
  type,
  title,
  message,
  related_task_id,
  sender_id,
  is_read,
  created_at
FROM notifications
WHERE type = 'bonus_reward'
ORDER BY created_at DESC
LIMIT 5;

-- 应该看到：
-- - type: 'bonus_reward'
-- - title: '您收到了额外奖赏'
-- - message: 包含任务名称、金额和原因
-- - related_task_id: 任务ID
-- - sender_id: 管理员ID
```

## 相关问题

### 为什么 from_user_id 是 NULL？
对于管理员发放的额外奖赏，`from_user_id` 设置为 `NULL`，因为：
1. 赏金不是从某个用户账户扣除的
2. 这是系统/管理员发放的奖励
3. 与任务完成赏金（从发布者到承接人）不同

### 为什么需要 status 字段？
`status` 字段用于跟踪交易状态：
- `pending`: 待处理
- `locked`: 已锁定
- `completed`: 已完成
- `cancelled`: 已取消

对于额外奖赏，状态直接设置为 `completed`，因为是即时发放。

## 未来改进建议

### 1. 数据迁移脚本
如果生产环境中有使用旧架构的数据，需要创建迁移脚本：
```sql
-- 迁移旧数据到新架构
INSERT INTO bounty_transactions_new (
  id, task_id, from_user_id, to_user_id, amount, type, status, created_at
)
SELECT 
  id,
  task_id,
  NULL as from_user_id,
  user_id as to_user_id,
  amount,
  CASE transaction_type
    WHEN 'main_bounty' THEN 'task_completion'
    WHEN 'extra_bounty' THEN 'extra_reward'
    WHEN 'assistant_bounty' THEN 'assistant_share'
  END as type,
  'completed' as status,
  created_at
FROM bounty_transactions_old;
```

### 2. 代码审查
检查其他可能使用旧字段名的代码：
```bash
# 搜索可能的问题
grep -r "user_id" packages/backend/src/services/
grep -r "transaction_type" packages/backend/src/services/
grep -r "'bonus'" packages/backend/src/
```

### 3. 类型定义更新
确保 TypeScript 类型定义与数据库架构一致：
```typescript
// packages/backend/src/models/BountyTransaction.ts
export interface BountyTransaction {
  id: string;
  taskId: string;
  fromUserId: string | null;  // ✅ 可为 null
  toUserId: string;
  amount: number;
  type: TransactionType;  // ✅ 使用正确的枚举
  description: string | null;
  status: TransactionStatus;  // ✅ 添加 status
  createdAt: Date;
  updatedAt: Date;  // ✅ 添加 updatedAt
}
```

## 修复日期
2026年2月10日

## 修复人员
Kiro AI Assistant

## 状态
✅ 已修复并验证

## 相关文档
- [额外奖赏功能文档](../features/ADMIN_BONUS_REWARD_FEATURE.md)
- [赏金交易系统文档](../BOUNTY_TRANSACTION_SYSTEM.md)
- [数据库迁移文档](../../packages/database/migrations/README.md)
