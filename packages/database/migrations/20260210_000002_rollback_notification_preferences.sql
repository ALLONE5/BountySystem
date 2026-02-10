-- Rollback notification preferences migration
-- Rollback: 20260210_000002_rollback_notification_preferences.sql

-- Drop the index
DROP INDEX IF EXISTS idx_users_notification_preferences;

-- Remove the notification_preferences column
ALTER TABLE users DROP COLUMN IF EXISTS notification_preferences;