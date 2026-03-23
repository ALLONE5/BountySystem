-- 添加 pending_acceptance 到 task_status 枚举
ALTER TYPE task_status ADD VALUE IF NOT EXISTS 'pending_acceptance';
