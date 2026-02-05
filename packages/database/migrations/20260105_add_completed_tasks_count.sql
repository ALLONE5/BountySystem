-- Migration: Add completed_tasks_count to rankings table
-- Description: Adds completed_tasks_count field to track number of completed tasks
-- Date: 2026-01-05

BEGIN;

-- Add completed_tasks_count column to rankings table
ALTER TABLE rankings 
ADD COLUMN IF NOT EXISTS completed_tasks_count INTEGER NOT NULL DEFAULT 0 CHECK (completed_tasks_count >= 0);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_rankings_completed_tasks_count ON rankings(completed_tasks_count);

COMMIT;
