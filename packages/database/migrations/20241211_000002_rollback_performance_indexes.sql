-- Rollback Migration: Remove Performance Optimization Indexes
-- Description: Removes indexes added for performance optimization
-- Date: 2024-12-11

BEGIN;

-- Drop materialized view
DROP MATERIALIZED VIEW IF EXISTS current_month_rankings;

-- Drop text search indexes
DROP INDEX IF EXISTS idx_tasks_search;
DROP INDEX IF EXISTS idx_tasks_tags;

-- Drop partial indexes
DROP INDEX IF EXISTS idx_tasks_active;
DROP INDEX IF EXISTS idx_tasks_executable;
DROP INDEX IF EXISTS idx_tasks_with_dependencies;

-- Drop composite indexes
DROP INDEX IF EXISTS idx_tasks_status_position;
DROP INDEX IF EXISTS idx_tasks_visibility_position;
DROP INDEX IF EXISTS idx_tasks_status_planned_dates;
DROP INDEX IF EXISTS idx_tasks_progress;
DROP INDEX IF EXISTS idx_tasks_bounty_settled;
DROP INDEX IF EXISTS idx_notifications_user_unread;
DROP INDEX IF EXISTS idx_position_applications_pending;
DROP INDEX IF EXISTS idx_rankings_period_year_quarter;
DROP INDEX IF EXISTS idx_tasks_group_status;
DROP INDEX IF EXISTS idx_bounty_transactions_user_created;
DROP INDEX IF EXISTS idx_task_dependencies_composite;

COMMIT;
