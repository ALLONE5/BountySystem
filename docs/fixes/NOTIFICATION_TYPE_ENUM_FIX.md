# 通知类型枚举错误修复

## 问题描述
添加额外奖赏时出现错误：
```
对于枚举notification_type的输入值无效: "bonus_reward"
```

## 问题原因
代码中添加了新的通知类型 `BONUS_REWARD` 和 `ADMIN_ANNOUNCEMENT`，但数据库中的 `notification_type` 枚举还没有包含这些值。

## 解决方案

### 方法一：使用迁移脚本（推荐）

```bash
cd packages/backend
node scripts/add-notification-types-migration.cjs
```

### 方法二：手动执行 SQL

连接到数据库并执行以下 SQL：

```sql
-- 添加新的通知类型
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'bonus_reward';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'admin_announcement';
```

**使用 psql**:
```bash
psql -U postgres -d task_management -c "ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'bonus_reward';"
psql -U postgres -d task_management -c "ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'admin_announcement';"
```

**或者连接后执行**:
```bash
psql -U postgres -d task_management

# 在 psql 提示符下执行：
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'bonus_reward';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'admin_announcement';
\q
```

### 验证

执行以下 SQL 验证枚举值已添加：

```sql
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = 'notification_type'::regtype 
ORDER BY enumsortorder;
```

应该看到输出包含：
```
task_assigned
deadline_reminder
dependency_resolved
status_changed
position_approved
position_rejected
review_required
broadcast
task_recommendation
account_updated
group_invitation
task_assignment_invitation
task_assignment_accepted
task_assignment_rejected
bonus_reward              ← 新增
admin_announcement        ← 新增
```

## 完成后

迁移完成后，重新尝试添加额外奖赏功能，应该可以正常工作了。

## 相关文件

**迁移文件**:
- `packages/database/migrations/20260210_000001_add_notification_types.sql`
- `packages/database/migrations/20260210_000001_rollback_notification_types.sql`

**迁移脚本**:
- `packages/backend/scripts/add-notification-types-migration.cjs`

**代码文件**:
- `packages/backend/src/models/Notification.ts` - 通知类型定义
- `packages/backend/src/services/TaskService.ts` - 使用新通知类型
- `packages/backend/src/services/NotificationService.ts` - 通知服务

## 注意事项

1. **PostgreSQL 枚举限制**: PostgreSQL 不支持直接删除枚举值，只能添加。如果需要删除，需要重建整个枚举类型。

2. **生产环境**: 在生产环境中运行迁移前，建议先备份数据库。

3. **并发问题**: `ADD VALUE IF NOT EXISTS` 是 PostgreSQL 9.1+ 的特性，确保数据库版本支持。

4. **事务限制**: 添加枚举值不能在事务块中与其他操作一起执行（PostgreSQL 限制）。迁移脚本已经处理了这个问题。

## 修复日期
2026年2月10日

## 状态
✅ 已创建迁移文件和脚本，等待执行
