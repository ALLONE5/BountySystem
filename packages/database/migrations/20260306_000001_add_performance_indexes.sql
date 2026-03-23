-- Migration: Add Performance Indexes
-- Description: Adds critical indexes to improve query performance
-- Date: 2026-03-06

-- 注意: CONCURRENTLY 不能在事务块中运行，此文件不使用 BEGIN/COMMIT

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

-- 任务位置和状态的复合索引（用于按位置筛选任务）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_position_status 
ON tasks(position_id, status) 
WHERE position_id IS NOT NULL;

-- 任务组和状态的复合索引（用于按组筛选任务）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_group_status 
ON tasks(group_id, status) 
WHERE group_id IS NOT NULL;

-- ============================================================================
-- 通知相关性能索引
-- ============================================================================

-- 用户未读通知的复合索引（最常用的查询）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_unread_created 
ON notifications(user_id, is_read, created_at DESC);

-- 通知类型和创建时间的复合索引（用于按类型查询通知）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_type_created 
ON notifications(type, created_at DESC);

-- 相关任务的索引（用于查询任务相关通知）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_task_created 
ON notifications(related_task_id, created_at DESC) 
WHERE related_task_id IS NOT NULL;

-- 发送者的索引（用于查询某用户发送的通知）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_sender_created 
ON notifications(sender_id, created_at DESC) 
WHERE sender_id IS NOT NULL;

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

-- 任务和交易状态的复合索引（用于查询任务相关交易）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bounty_transactions_task_status_created 
ON bounty_transactions(task_id, status, created_at DESC) 
WHERE task_id IS NOT NULL;

-- 交易状态和创建时间的索引（用于查询待处理交易）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bounty_transactions_status_created 
ON bounty_transactions(status, created_at DESC);

-- ============================================================================
-- 用户相关性能索引
-- ============================================================================

-- 用户角色和最后登录时间的复合索引（用于查询活跃用户）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role_last_login 
ON users(role, last_login DESC) 
WHERE last_login IS NOT NULL;

-- 用户名的部分匹配索引（用于用户搜索）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_username_gin 
ON users USING gin(username gin_trgm_ops);

-- 邮箱的部分匹配索引（用于邮箱搜索）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_gin 
ON users USING gin(email gin_trgm_ops);

-- ============================================================================
-- 位置相关性能索引
-- ============================================================================

-- 用户位置关系的复合索引（用于查询用户的位置）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_positions_user_granted 
ON user_positions(user_id, granted_at DESC);

-- 位置用户关系的复合索引（用于查询位置的用户）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_positions_position_granted 
ON user_positions(position_id, granted_at DESC);

-- 位置管理员的复合索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_position_admins_position_assigned 
ON position_admins(position_id, assigned_at DESC);

-- 管理员位置的复合索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_position_admins_admin_assigned 
ON position_admins(admin_id, assigned_at DESC);

-- ============================================================================
-- 任务助手相关性能索引
-- ============================================================================

-- 任务助手的复合索引（用于查询任务的助手）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_task_assistants_task_added 
ON task_assistants(task_id, added_at DESC);

-- 用户助手的复合索引（用于查询用户参与的任务）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_task_assistants_user_added 
ON task_assistants(user_id, added_at DESC);

-- ============================================================================
-- 排名相关性能索引
-- ============================================================================

-- 排名周期和年月的复合索引（用于查询特定时期排名）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rankings_period_year_month_rank 
ON rankings(period, year, month, rank);

-- 用户排名历史的复合索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rankings_user_period_calculated 
ON rankings(user_id, period, calculated_at DESC);

-- ============================================================================
-- 审计日志相关性能索引
-- ============================================================================

-- 用户操作日志的复合索引（最常用的查询）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user_timestamp 
ON audit_logs(user_id, timestamp DESC);

-- 操作类型和时间的复合索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_action_timestamp 
ON audit_logs(action, timestamp DESC);

-- 资源类型和时间的复合索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_resource_timestamp 
ON audit_logs(resource, timestamp DESC);

-- 成功状态和时间的复合索引（用于查询失败操作）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_success_timestamp 
ON audit_logs(success, timestamp DESC) 
WHERE success = false;

-- IP地址的索引（用于安全分析）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_ip_timestamp 
ON audit_logs(ip_address, timestamp DESC) 
WHERE ip_address IS NOT NULL;

-- ============================================================================
-- 项目组相关性能索引
-- ============================================================================

-- 项目组创建者和时间的复合索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_task_groups_creator_created 
ON task_groups(creator_id, created_at DESC);

-- 组成员的复合索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_group_members_group_joined 
ON group_members(group_id, joined_at DESC);

-- 用户组的复合索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_group_members_user_joined 
ON group_members(user_id, joined_at DESC);

-- ============================================================================
-- 任务依赖相关性能索引
-- ============================================================================

-- 任务依赖的复合索引（用于查询任务的依赖）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_task_dependencies_task_created 
ON task_dependencies(task_id, created_at DESC);

-- 被依赖任务的复合索引（用于查询依赖某任务的其他任务）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_task_dependencies_depends_created 
ON task_dependencies(depends_on_task_id, created_at DESC);

-- ============================================================================
-- 位置申请相关性能索引
-- ============================================================================

-- 用户申请的复合索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_position_applications_user_created 
ON position_applications(user_id, created_at DESC);

-- 位置申请的复合索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_position_applications_position_status_created 
ON position_applications(position_id, status, created_at DESC);

-- 审核者的复合索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_position_applications_reviewer_reviewed 
ON position_applications(reviewed_by, reviewed_at DESC) 
WHERE reviewed_by IS NOT NULL;

-- ============================================================================
-- 任务评审相关性能索引
-- ============================================================================

-- 任务评审的复合索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_task_reviews_task_created 
ON task_reviews(task_id, created_at DESC);

-- 评审者的复合索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_task_reviews_reviewer_created 
ON task_reviews(reviewer_id, created_at DESC);

-- ============================================================================
-- 头像相关性能索引
-- ============================================================================

-- 头像等级要求的索引（用于查询可用头像）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_avatars_required_rank_created 
ON avatars(required_rank, created_at DESC);

-- ============================================================================
-- 系统配置相关性能索引
-- ============================================================================

-- 系统配置的时间索引（用于获取最新配置）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_system_config_updated 
ON system_config(updated_at DESC);

-- ============================================================================
-- 管理员预算相关性能索引
-- ============================================================================

-- 管理员预算的年月索引
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_admin_budgets_admin_year_month 
ON admin_budgets(admin_id, year, month);

-- 年月预算的索引（用于统计）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_admin_budgets_year_month_updated 
ON admin_budgets(year, month, updated_at DESC);

-- ============================================================================
-- 添加索引注释
-- ============================================================================

COMMENT ON INDEX idx_tasks_assignee_status IS 'Optimizes queries for user assigned tasks by status';
COMMENT ON INDEX idx_tasks_publisher_created IS 'Optimizes queries for user published tasks ordered by creation time';
COMMENT ON INDEX idx_notifications_user_unread_created IS 'Optimizes unread notifications queries';
COMMENT ON INDEX idx_bounty_transactions_to_user_type_created IS 'Optimizes user income queries by transaction type';
COMMENT ON INDEX idx_audit_logs_user_timestamp IS 'Optimizes user activity log queries';
COMMENT ON INDEX idx_rankings_period_year_month_rank IS 'Optimizes ranking queries by period and time';

-- ============================================================================
-- 启用必要的扩展（如果尚未启用）
-- ============================================================================

-- 启用 pg_trgm 扩展用于文本搜索
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 启用 btree_gin 扩展用于复合索引优化
CREATE EXTENSION IF NOT EXISTS btree_gin;
