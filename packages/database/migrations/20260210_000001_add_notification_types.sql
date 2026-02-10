-- Migration: Add New Notification Types
-- Description: Adds bonus_reward and admin_announcement to notification_type enum
-- Date: 2026-02-10

BEGIN;

-- Add new values to notification_type enum
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'bonus_reward';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'admin_announcement';

COMMIT;
