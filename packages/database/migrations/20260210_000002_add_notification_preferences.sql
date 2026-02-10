-- Add notification preferences column to users table
-- Migration: 20260210_000002_add_notification_preferences.sql

ALTER TABLE users 
ADD COLUMN notification_preferences JSONB DEFAULT '{
  "taskAssigned": true,
  "taskCompleted": true,
  "taskAbandoned": true,
  "bountyReceived": true,
  "systemNotifications": true
}'::jsonb;

-- Add index for notification preferences queries
CREATE INDEX idx_users_notification_preferences ON users USING GIN (notification_preferences);

-- Update existing users to have default notification preferences
UPDATE users 
SET notification_preferences = '{
  "taskAssigned": true,
  "taskCompleted": true,
  "taskAbandoned": true,
  "bountyReceived": true,
  "systemNotifications": true
}'::jsonb
WHERE notification_preferences IS NULL;