-- Migration: Add subtask publishing workflow fields
-- Date: 2026-02-02
-- Description: Add fields to support the new subtask publishing workflow

-- Add new fields to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS bounty_payer_id UUID REFERENCES users(id);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS published_at TIMESTAMP;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS published_by UUID REFERENCES users(id);

-- Add comments for documentation
COMMENT ON COLUMN tasks.bounty_payer_id IS 'User who pays the bounty (for subtasks, this is the parent task assignee)';
COMMENT ON COLUMN tasks.is_published IS 'Whether the task is published and visible in bounty task list';
COMMENT ON COLUMN tasks.published_at IS 'Timestamp when the task was published';
COMMENT ON COLUMN tasks.published_by IS 'User who published the task';

-- Set default values for existing tasks
-- Top-level tasks (depth 0) are considered published by default
UPDATE tasks 
SET is_published = true, 
    published_at = created_at, 
    published_by = publisher_id 
WHERE depth = 0 AND is_published IS NULL;

-- Subtasks (depth 1) need to be evaluated case by case
-- For now, mark existing subtasks as published to maintain backward compatibility
UPDATE tasks 
SET is_published = true, 
    published_at = created_at, 
    published_by = publisher_id 
WHERE depth = 1 AND is_published IS NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_tasks_is_published ON tasks(is_published);
CREATE INDEX IF NOT EXISTS idx_tasks_bounty_payer_id ON tasks(bounty_payer_id);
CREATE INDEX IF NOT EXISTS idx_tasks_published_by ON tasks(published_by);

-- Add constraint: published tasks must have published_at and published_by
-- (We'll enforce this in application logic rather than database constraint for flexibility)
