-- Performance Optimization Indexes
-- Adds indexes to improve query performance based on common access patterns

-- Tasks table indexes
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON tasks(assignee_id) WHERE assignee_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_publisher_id ON tasks(publisher_id);
CREATE INDEX IF NOT EXISTS idx_tasks_parent_id ON tasks(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_updated_at ON tasks(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_visibility ON tasks(visibility);
CREATE INDEX IF NOT EXISTS idx_tasks_is_published ON tasks(is_published);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_tasks_status_publisher ON tasks(status, publisher_id);
CREATE INDEX IF NOT EXISTS idx_tasks_published_status ON tasks(is_published, status) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_status ON tasks(assignee_id, status) WHERE assignee_id IS NOT NULL;

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login DESC) WHERE last_login IS NOT NULL;

-- Positions table indexes
CREATE INDEX IF NOT EXISTS idx_positions_task_id ON positions(task_id);
CREATE INDEX IF NOT EXISTS idx_positions_created_at ON positions(created_at DESC);

-- Position applications indexes
CREATE INDEX IF NOT EXISTS idx_position_applications_position_id ON position_applications(position_id);
CREATE INDEX IF NOT EXISTS idx_position_applications_user_id ON position_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_position_applications_status ON position_applications(status);
CREATE INDEX IF NOT EXISTS idx_position_applications_created_at ON position_applications(created_at DESC);

-- Composite index for position applications
CREATE INDEX IF NOT EXISTS idx_position_applications_user_status ON position_applications(user_id, status);

-- Task groups table indexes
CREATE INDEX IF NOT EXISTS idx_task_groups_name ON task_groups(name);
CREATE INDEX IF NOT EXISTS idx_task_groups_created_at ON task_groups(created_at DESC);

-- Group members table indexes (if exists)
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id) WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'group_members');
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id) WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'group_members');

-- Notifications table indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Composite index for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC) WHERE is_read = false;

-- Bounty transactions table indexes
CREATE INDEX IF NOT EXISTS idx_bounty_transactions_from_user ON bounty_transactions(from_user_id);
CREATE INDEX IF NOT EXISTS idx_bounty_transactions_to_user ON bounty_transactions(to_user_id);
CREATE INDEX IF NOT EXISTS idx_bounty_transactions_task_id ON bounty_transactions(task_id) WHERE task_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bounty_transactions_created_at ON bounty_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bounty_transactions_type ON bounty_transactions(transaction_type);

-- Composite index for bounty history queries
CREATE INDEX IF NOT EXISTS idx_bounty_transactions_user_history ON bounty_transactions(from_user_id, to_user_id, created_at DESC);

-- System config table indexes (if exists)
CREATE INDEX IF NOT EXISTS idx_system_config_key ON system_config(config_key) WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'system_config');
CREATE INDEX IF NOT EXISTS idx_system_config_updated_at ON system_config(updated_at DESC) WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'system_config');

-- Audit logs table indexes (if exists)
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id) WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs');
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action) WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs');
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC) WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs');
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name) WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs');

-- Full-text search indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_tasks_title_search ON tasks USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_tasks_description_search ON tasks USING gin(to_tsvector('english', description));
CREATE INDEX IF NOT EXISTS idx_users_username_search ON users USING gin(to_tsvector('english', username));

-- Partial indexes for better performance on filtered queries
CREATE INDEX IF NOT EXISTS idx_tasks_active ON tasks(id, created_at) WHERE status IN ('open', 'in_progress');
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(id, updated_at) WHERE status = 'completed';
CREATE INDEX IF NOT EXISTS idx_users_active ON users(id, last_login) WHERE last_login > NOW() - INTERVAL '30 days';

-- Add comments for documentation
COMMENT ON INDEX idx_tasks_assignee_id IS 'Improves queries filtering by assignee';
COMMENT ON INDEX idx_tasks_publisher_id IS 'Improves queries filtering by publisher';
COMMENT ON INDEX idx_tasks_status_publisher IS 'Composite index for status and publisher queries';
COMMENT ON INDEX idx_notifications_user_unread IS 'Optimizes unread notifications queries';
COMMENT ON INDEX idx_bounty_transactions_user_history IS 'Optimizes bounty history queries';
COMMENT ON INDEX idx_tasks_title_search IS 'Full-text search on task titles';
COMMENT ON INDEX idx_tasks_active IS 'Partial index for active tasks only';