-- Migration: Add Browse Tasks Optimization Indexes
-- Description: Adds indexes specifically for optimizing the Browse Tasks page (/tasks/available endpoint)
-- Date: 2025-01-06
-- Spec: browse-tasks-optimization

BEGIN;

-- ============================================================================
-- Browse Tasks Optimization Indexes
-- ============================================================================

-- Composite index for main WHERE clause in getAvailableTasks query
-- Optimizes: WHERE t.is_executable = true AND t.assignee_id IS NULL
-- Includes created_at DESC for ORDER BY optimization
CREATE INDEX IF NOT EXISTS idx_tasks_available_browse 
ON tasks(is_executable, assignee_id, created_at DESC)
WHERE is_executable = true AND assignee_id IS NULL;

-- Index for visibility filtering
-- Optimizes: WHERE t.visibility = 'public' OR t.visibility = 'position_only' OR t.visibility = 'private'
CREATE INDEX IF NOT EXISTS idx_tasks_visibility_browse 
ON tasks(visibility)
WHERE is_executable = true AND assignee_id IS NULL;

-- Index for position filtering (POSITION_ONLY visibility)
-- Optimizes: LEFT JOIN user_positions up ON t.position_id = up.position_id
CREATE INDEX IF NOT EXISTS idx_tasks_position_browse 
ON tasks(position_id) 
WHERE position_id IS NOT NULL AND is_executable = true AND assignee_id IS NULL;

-- Index for publisher filtering (PRIVATE visibility)
-- Optimizes: WHERE t.visibility = 'private' AND t.publisher_id = $1
CREATE INDEX IF NOT EXISTS idx_tasks_publisher_browse 
ON tasks(publisher_id, visibility) 
WHERE visibility = 'private' AND is_executable = true AND assignee_id IS NULL;

-- ============================================================================
-- Statistics Update
-- ============================================================================

-- Analyze tasks table to update statistics for query planner
ANALYZE tasks;

COMMIT;
