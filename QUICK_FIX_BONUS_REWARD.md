# 快速修复：额外奖赏功能

## 问题
添加额外奖赏时出现错误：`对于枚举notification_type的输入值无效: "bonus_reward"`

## 解决方法

### 选项 1：直接在数据库中执行 SQL（最快）

打开数据库命令行工具（psql 或其他工具），执行以下 SQL：

```sql
-- 添加缺失的通知类型
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'task_recommendation';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'account_updated';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'group_invitation';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'task_assignment_invitation';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'task_assignment_accepted';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'task_assignment_rejected';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'bonus_reward';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'admin_announcement';
```

**使用 psql 命令行**：
```bash
psql -U postgres -d task_management

# 然后在 psql 提示符下粘贴上面的 SQL
# 完成后输入 \q 退出
```

**或者一行命令**：
```bash
psql -U postgres -d task_management -c "ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'task_recommendation'; ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'account_updated'; ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'group_invitation'; ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'task_assignment_invitation'; ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'task_assignment_accepted'; ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'task_assignment_rejected'; ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'bonus_reward'; ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'admin_announcement';"
```

### 选项 2：使用迁移脚本

```bash
cd packages/backend
node scripts/add-notification-types-migration.cjs
```

### 选项 3：重建数据库（如果是开发环境）

如果这是开发环境且数据可以丢失：

```bash
cd packages/backend
npm run db:reset
# 或
node scripts/reset_db.ts
```

## 验证

执行以下 SQL 验证枚举值已添加：

```sql
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = 'notification_type'::regtype 
ORDER BY enumsortorder;
```

应该看到所有这些值：
- task_assigned
- deadline_reminder
- dependency_resolved
- status_changed
- position_approved
- position_rejected
- review_required
- broadcast
- task_recommendation
- account_updated
- group_invitation
- task_assignment_invitation
- task_assignment_accepted
- task_assignment_rejected
- **bonus_reward** ← 新增
- **admin_announcement** ← 新增

## 完成

修复完成后，刷新页面并重新尝试添加额外奖赏。

## 注意事项

- PostgreSQL 的 `ADD VALUE IF NOT EXISTS` 需要 PostgreSQL 9.1+
- 添加枚举值后无法删除（PostgreSQL 限制）
- 如果遇到权限问题，确保使用有足够权限的数据库用户
