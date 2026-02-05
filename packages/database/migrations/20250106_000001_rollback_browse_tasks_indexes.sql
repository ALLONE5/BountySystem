-- Rollback Migration: Remove Browse Tasks Optimization Indexes
-- Description: Removes indexes added for Browse Tasks page optimization
-- Date: 2025-01-06
-- Spec: browse-tasks-optimization

BEGIN;

-- Drop browse tasks optimization indexes
DROP INDEX IF EXISTS idx_tasks_available_browse;
DROP INDEX IF EXISTS idx_tasks_visibility_browse;
DROP INDEX IF EXISTS idx_tasks_position_browse;
DROP INDEX IF EXISTS idx_tasks_publisher_browse;

COMMIT;
