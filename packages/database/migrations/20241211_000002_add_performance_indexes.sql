-- Migration: Add Performance Optimization Indexes
-- Description: Adds additional indexes for query optimization based on design document recommendations
-- Date: 2024-12-11

BEGIN;

-- ============================================================================
-- Additional Indexes for Performance Optimization
-- ============================================================================

-- Composite indexes for common query patterns
-- Tasks: Filter by status and position together (common in task browsing)
CREATE INDEX IF NOT EXISTS idx_tasks_status_position ON tasks(status, position_id) WHERE status = 'available';

-- Tasks: Filter by visibility and position (for access control queries)
CREATE INDEX IF NOT EXISTS idx_tasks_visibility_position ON tasks(visibility, position_id);

-- Tasks: Composite index for task scheduling queries (status + planned dates)
CREATE INDEX IF NOT EXISTS idx_tasks_status_planned_dates ON tasks(status, planned_start_date, planned_end_date);

-- Tasks: Index for progress tracking queries
CREATE INDEX IF NOT EXISTS idx_tasks_progress ON tasks(progress) WHERE progress < 100;

-- Tasks: Index for bounty settlement status
CREATE INDEX IF NOT EXISTS idx_tasks_bounty_settled ON tasks(is_bounty_settled) WHERE is_bounty_settled = FALSE;

-- Notifications: Composite index for unread notifications query (very common)
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC) WHERE is_read = FALSE;

-- Position Applications: Index for pending applications (admin review queries)
CREATE INDEX IF NOT EXISTS idx_position_applications_pending ON position_applications(status, position_id) WHERE status = 'pending';

-- Rankings: Composite index for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_rankings_period_year_quarter ON rankings(period, year, quarter, rank) WHERE quarter IS NOT NULL;

-- Task Groups: Index for group task queries
CREATE INDEX IF NOT EXISTS idx_tasks_group_status ON tasks(group_id, status) WHERE group_id IS NOT NULL;

-- Bounty Transactions: Composite index for user transaction history
CREATE INDEX IF NOT EXISTS idx_bounty_transactions_user_created ON bounty_transactions(user_id, created_at DESC);

-- Task Dependencies: Composite index for dependency resolution queries
CREATE INDEX IF NOT EXISTS idx_task_dependencies_composite ON task_dependencies(depends_on_task_id, task_id);

-- ============================================================================
-- Partial Indexes for Specific Query Patterns
-- ============================================================================

-- Index only active (non-completed) tasks for performance
CREATE INDEX IF NOT EXISTS idx_tasks_active ON tasks(id, status, assignee_id) 
  WHERE status IN ('not_started', 'available', 'in_progress');

-- Index only executable tasks (leaf nodes) for task browsing
CREATE INDEX IF NOT EXISTS idx_tasks_executable ON tasks(id, status, position_id, visibility) 
  WHERE is_executable = TRUE;

-- Index tasks with dependencies for scheduling queries
-- CREATE INDEX IF NOT EXISTS idx_tasks_with_dependencies ON tasks(id, status) 
--   WHERE id IN (SELECT task_id FROM task_dependencies);

-- ============================================================================
-- Text Search Indexes (for task search functionality)
-- ============================================================================

-- Full-text search index for task name and description
CREATE INDEX IF NOT EXISTS idx_tasks_search ON tasks USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- GIN index for tags array search
CREATE INDEX IF NOT EXISTS idx_tasks_tags ON tasks USING gin(tags);

-- ============================================================================
-- Query Optimization: Materialized View for Rankings
-- ============================================================================

-- Create materialized view for current month rankings (frequently accessed)
CREATE MATERIALIZED VIEW IF NOT EXISTS current_month_rankings AS
SELECT 
  r.user_id,
  r.period,
  r.total_bounty,
  r.rank,
  u.username,
  u.avatar_id,
  r.calculated_at
FROM rankings r
JOIN users u ON r.user_id = u.id
WHERE r.year = EXTRACT(YEAR FROM NOW())
  AND r.month = EXTRACT(MONTH FROM NOW())
  AND r.period = 'monthly'
ORDER BY r.rank;

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_current_month_rankings_user ON current_month_rankings(user_id);
CREATE INDEX IF NOT EXISTS idx_current_month_rankings_rank ON current_month_rankings(rank);

-- ============================================================================
-- Statistics Update
-- ============================================================================

-- Analyze tables to update statistics for query planner
ANALYZE users;
ANALYZE positions;
ANALYZE tasks;
ANALYZE task_dependencies;
ANALYZE notifications;
ANALYZE rankings;
ANALYZE bounty_transactions;

COMMIT;
