-- P1 性能优化索引
-- 创建日期: 2026-03-10
-- 目的: 优化频繁查询的性能

-- ============================================
-- 赏金交易表索引
-- ============================================

-- 优化按接收用户查询
CREATE INDEX IF NOT EXISTS idx_bounty_transactions_to_user_id 
  ON bounty_transactions(to_user_id);

-- 优化按时间排序查询
CREATE INDEX IF NOT EXISTS idx_bounty_transactions_created_at 
  ON bounty_transactions(created_at DESC);

-- 优化按发送用户查询
CREATE INDEX IF NOT EXISTS idx_bounty_transactions_from_user_id 
  ON bounty_transactions(from_user_id);

-- 复合索引：用户 + 时间
CREATE INDEX IF NOT EXISTS idx_bounty_transactions_user_time 
  ON bounty_transactions(to_user_id, created_at DESC);

-- ============================================
-- 任务表索引
-- ============================================

-- 优化按承接人查询
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id 
  ON tasks(assignee_id) WHERE assignee_id IS NOT NULL;

-- 优化按状态查询
CREATE INDEX IF NOT EXISTS idx_tasks_status 
  ON tasks(status);

-- 复合索引：发布者 + 状态
CREATE INDEX IF NOT EXISTS idx_tasks_publisher_status 
  ON tasks(publisher_id, status);

-- 复合索引：承接人 + 状态
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_status 
  ON tasks(assignee_id, status) WHERE assignee_id IS NOT NULL;

-- 优化按项目组查询
CREATE INDEX IF NOT EXISTS idx_tasks_project_group_id 
  ON tasks(project_group_id) WHERE project_group_id IS NOT NULL;

-- 优化按截止日期查询
CREATE INDEX IF NOT EXISTS idx_tasks_deadline 
  ON tasks(deadline) WHERE deadline IS NOT NULL;

-- ============================================
-- 通知表索引
-- ============================================

-- 复合索引：用户 + 已读状态
CREATE INDEX IF NOT EXISTS idx_notifications_user_read 
  ON notifications(user_id, is_read);

-- 优化按时间排序查询
CREATE INDEX IF NOT EXISTS idx_notifications_created_at 
  ON notifications(created_at DESC);

-- 复合索引：用户 + 时间
CREATE INDEX IF NOT EXISTS idx_notifications_user_time 
  ON notifications(user_id, created_at DESC);

-- 优化按类型查询
CREATE INDEX IF NOT EXISTS idx_notifications_type 
  ON notifications(type);

-- ============================================
-- 用户表索引
-- ============================================

-- 优化按邮箱查询（如果不存在）
CREATE INDEX IF NOT EXISTS idx_users_email 
  ON users(email);

-- 优化按用户名查询（如果不存在）
CREATE INDEX IF NOT EXISTS idx_users_username 
  ON users(username);

-- 优化按角色查询
CREATE INDEX IF NOT EXISTS idx_users_role 
  ON users(role);

-- ============================================
-- 排名表索引
-- ============================================

-- 优化按用户查询
CREATE INDEX IF NOT EXISTS idx_rankings_user_id 
  ON rankings(user_id);

-- 优化按赏金排序
CREATE INDEX IF NOT EXISTS idx_rankings_bounty 
  ON rankings(bounty DESC);

-- 优化按更新时间查询
CREATE INDEX IF NOT EXISTS idx_rankings_updated_at 
  ON rankings(updated_at DESC);

-- ============================================
-- 评论表索引
-- ============================================

-- 优化按任务查询
CREATE INDEX IF NOT EXISTS idx_comments_task_id 
  ON comments(task_id);

-- 优化按用户查询
CREATE INDEX IF NOT EXISTS idx_comments_user_id 
  ON comments(user_id);

-- 复合索引：任务 + 时间
CREATE INDEX IF NOT EXISTS idx_comments_task_time 
  ON comments(task_id, created_at DESC);

-- ============================================
-- 附件表索引
-- ============================================

-- 优化按任务查询
CREATE INDEX IF NOT EXISTS idx_attachments_task_id 
  ON attachments(task_id);

-- 优化按上传者查询
CREATE INDEX IF NOT EXISTS idx_attachments_uploaded_by 
  ON attachments(uploaded_by);

-- ============================================
-- 岗位申请表索引
-- ============================================

-- 优化按用户查询
CREATE INDEX IF NOT EXISTS idx_position_applications_user_id 
  ON position_applications(user_id);

-- 优化按岗位查询
CREATE INDEX IF NOT EXISTS idx_position_applications_position_id 
  ON position_applications(position_id);

-- 优化按状态查询
CREATE INDEX IF NOT EXISTS idx_position_applications_status 
  ON position_applications(status);

-- 复合索引：用户 + 状态
CREATE INDEX IF NOT EXISTS idx_position_applications_user_status 
  ON position_applications(user_id, status);

-- ============================================
-- 审计日志表索引
-- ============================================

-- 优化按用户查询
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id 
  ON audit_logs(user_id) WHERE user_id IS NOT NULL;

-- 优化按操作类型查询
CREATE INDEX IF NOT EXISTS idx_audit_logs_action 
  ON audit_logs(action);

-- 优化按时间查询
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at 
  ON audit_logs(created_at DESC);

-- 复合索引：用户 + 时间
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_time 
  ON audit_logs(user_id, created_at DESC) WHERE user_id IS NOT NULL;

-- ============================================
-- 验证索引创建
-- ============================================

-- 查看所有新创建的索引
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- 显示完成信息
DO $$
BEGIN
  RAISE NOTICE '✅ P1 性能索引创建完成！';
  RAISE NOTICE '📊 预期性能提升: 50-80%%';
  RAISE NOTICE '📝 建议: 运行 ANALYZE 更新统计信息';
END $$;
