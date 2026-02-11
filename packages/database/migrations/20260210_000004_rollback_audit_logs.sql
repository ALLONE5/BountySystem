-- Drop indexes
DROP INDEX IF EXISTS idx_audit_logs_failed;
DROP INDEX IF EXISTS idx_audit_logs_details;
DROP INDEX IF EXISTS idx_audit_logs_resource_timestamp;
DROP INDEX IF EXISTS idx_audit_logs_action_timestamp;
DROP INDEX IF EXISTS idx_audit_logs_user_timestamp;
DROP INDEX IF EXISTS idx_audit_logs_ip_address;
DROP INDEX IF EXISTS idx_audit_logs_success;
DROP INDEX IF EXISTS idx_audit_logs_timestamp;
DROP INDEX IF EXISTS idx_audit_logs_resource;
DROP INDEX IF EXISTS idx_audit_logs_action;
DROP INDEX IF EXISTS idx_audit_logs_user_id;

-- Drop table
DROP TABLE IF EXISTS audit_logs;