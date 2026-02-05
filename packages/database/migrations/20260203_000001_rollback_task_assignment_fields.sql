-- 回滚任务指派相关字段
-- Rollback: Remove task assignment invitation fields
-- Date: 2026-02-03

-- 删除检查约束
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS check_invitation_status;

-- 删除索引
DROP INDEX IF EXISTS idx_tasks_invitation_status;
DROP INDEX IF EXISTS idx_tasks_invited_user;

-- 删除字段
ALTER TABLE tasks DROP COLUMN IF EXISTS invitation_status;
ALTER TABLE tasks DROP COLUMN IF EXISTS invited_user_id;
