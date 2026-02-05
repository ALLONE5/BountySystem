-- 添加任务指派相关字段
-- Migration: Add task assignment invitation fields
-- Date: 2026-02-03

-- 添加被邀请用户ID字段
ALTER TABLE tasks ADD COLUMN invited_user_id UUID REFERENCES users(id);

-- 添加邀请状态字段
ALTER TABLE tasks ADD COLUMN invitation_status VARCHAR(50);

-- 添加索引以提高查询性能
CREATE INDEX idx_tasks_invited_user ON tasks(invited_user_id);
CREATE INDEX idx_tasks_invitation_status ON tasks(invitation_status);

-- 添加字段注释
COMMENT ON COLUMN tasks.invited_user_id IS '被邀请承接任务的用户ID';
COMMENT ON COLUMN tasks.invitation_status IS '邀请状态: pending, accepted, rejected, null';

-- 添加检查约束，确保 invitation_status 只能是有效值
ALTER TABLE tasks ADD CONSTRAINT check_invitation_status 
  CHECK (invitation_status IN ('pending', 'accepted', 'rejected') OR invitation_status IS NULL);
