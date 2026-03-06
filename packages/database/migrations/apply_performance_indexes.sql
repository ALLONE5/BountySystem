-- Apply Performance Indexes (without transaction)
-- Description: Adds critical indexes to improve query performance
-- Date: 2026-03-06

-- ============================================================================
-- 任务相关性能索引
-- ============================================================================

-- 任务分配者和状态的复合索引（用于查询用户的任务列表）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_assignee_status 
ON tasks(assignee_id, status) 
WHERE assignee_id IS NOT NULL;

-- 任务发布者和创建时间的复合索引（用于查询发布的任务）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_publisher_created 
ON tasks(publisher_id, created_at DESC);

-- 父任务和深度的复合索引（用于查询子任务）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_parent_depth 
ON tasks(parent_id, depth) 
WHERE parent_id IS NOT NULL;

-- 任务状态和计划结束时间的复合索引（用于查询即将到期的任务）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_status_planned_end 
ON tasks(status, planned_end_date) 
WHERE planned_end_date IS NOT NULL;

-- ============================================================================
-- 通知相关性能索引
-- ============================================================================

-- 用户未读通知的复合索引（最常用的查询）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_unread_created 
ON notifications(user_id, is_read, created_at DESC);

-- 通知类型和创建时间的复合索引（用于按类型查询通知）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_type_created 
ON notifications(type, created_at DESC);

-- ============================================================================
-- 赏金交易相关性能索引
-- ============================================================================

-- 接收者和交易类型的复合索引（用于查询用户收入）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bounty_transactions_to_user_type_created 
ON bounty_transactions(to_user_id, type, created_at DESC);

-- 发送者和交易类型的复合索引（用于查询用户支出）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bounty_transactions_from_user_type_created 
ON bounty_transactions(from_user_id, type, created_at DESC) 
WHERE from_user_id IS NOT NULL;

-- ============================================================================
-- 用户相关性能索引
-- ============================================================================

-- 用户角色和最后登录时间的复合索引（用于查询活跃用户）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role_last_login 
ON users(role, last_login DESC) 
WHERE last_login IS NOT NULL;

-- ============================================================================
-- 审计日志相关性能索引
-- ============================================================================

-- 用户操作日志的复合索引（最常用的查询）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user_timestamp 
ON audit_logs(user_id, timestamp DESC);

-- 操作类型和时间的复合索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_action_timestamp 
ON audit_logs(action, timestamp DESC);

-- ============================================================================
-- 排名相关性能索引
-- ============================================================================

-- 排名周期和年月的复合索引（用于查询特定时期排名）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rankings_period_year_month_rank 
ON rankings(period, year, month, rank);

-- 用户排名历史的复合索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rankings_user_period_calculated 
ON rankings(user_id, period, calculated_at DESC);