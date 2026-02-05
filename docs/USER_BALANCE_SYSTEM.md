# 用户余额系统

## 概述

用户余额系统用于管理用户的账户余额，主要用于发布任务时的赏金支付。

## 数据库字段

### users 表新增字段

```sql
balance DECIMAL(10, 2) DEFAULT 0.00 NOT NULL
```

- **类型**: DECIMAL(10, 2) - 最多支持 8 位整数和 2 位小数
- **默认值**: 0.00
- **约束**: 
  - NOT NULL - 不能为空
  - CHECK (balance >= 0) - 余额不能为负数
- **索引**: idx_users_balance - 用于优化余额查询

## 功能说明

### 1. 发布子任务扣款

当用户发布子任务到公开市场时：
- 系统会从发布者的账户余额中扣除设置的赏金金额
- 如果余额不足，发布操作会失败
- 扣除的金额会在任务完成后支付给承接者

### 2. 余额查询

用户可以在个人信息中查看当前余额。

### 3. 余额充值（待实现）

未来可以添加余额充值功能：
- 管理员手动充值
- 在线支付充值
- 任务完成后自动到账

## 初始余额

- 新用户默认余额：0.00
- 现有用户初始余额：10000.00（由迁移脚本设置）

## 使用示例

### 发布子任务

```typescript
// 前端
const result = await taskApi.publishSubtask(subtaskId, {
  visibility: 'public',
  bountyAmount: 100.00,  // 需要从余额中扣除
  positionId: undefined,
});

// 后端会检查：
// 1. 用户余额是否 >= 100.00
// 2. 如果余额足够，扣除 100.00
// 3. 如果余额不足，返回错误
```

### 查看余额

```typescript
// 用户信息中包含 balance 字段
const user = await userApi.getCurrentUser();
console.log(`当前余额: ¥${user.balance.toFixed(2)}`);
```

## 错误处理

### 余额不足错误

```
Error: Insufficient balance. Required: 100.00, Available: 50.00
```

解决方案：
1. 降低赏金金额
2. 充值账户余额
3. 联系管理员

## 迁移说明

### 添加余额字段

```bash
# 运行迁移脚本
node packages/backend/scripts/add-user-balance.cjs
```

### 回滚

```sql
-- 如需回滚，运行：
psql -U postgres -d bounty_hunter_dev -f packages/database/migrations/20260203_000002_rollback_user_balance.sql
```

## 安全考虑

1. **余额验证**: 所有余额操作都在后端进行验证
2. **事务处理**: 余额扣除使用数据库事务确保一致性
3. **负数保护**: 数据库约束防止余额变为负数
4. **审计日志**: 建议记录所有余额变动（待实现）

## 未来改进

1. **余额变动记录表**: 记录所有充值、扣款、退款操作
2. **余额冻结**: 发布任务时冻结赏金，完成后解冻并转账
3. **退款机制**: 任务取消或拒绝时自动退款
4. **余额提现**: 允许用户将余额提现到银行账户
5. **充值渠道**: 集成支付宝、微信支付等
6. **余额通知**: 余额不足时发送通知提醒

## 相关文件

- 数据库迁移: `packages/database/migrations/20260203_000002_add_user_balance.sql`
- 迁移脚本: `packages/backend/scripts/add-user-balance.cjs`
- 后端模型: `packages/backend/src/models/User.ts`
- 前端类型: `packages/frontend/src/types/index.ts`
