-- Rollback Migration: Remove New Notification Types
-- Description: Removes bonus_reward and admin_announcement from notification_type enum
-- Date: 2026-02-10
-- Note: PostgreSQL does not support removing enum values directly.
--       This would require recreating the enum type and updating all references.
--       For production, consider keeping the enum values or using a more complex migration.

BEGIN;

-- PostgreSQL does not support ALTER TYPE ... DROP VALUE
-- To remove enum values, you would need to:
-- 1. Create a new enum type without the unwanted values
-- 2. Alter the table to use the new type
-- 3. Drop the old type
-- 4. Rename the new type to the old name

-- This is a complex operation and should be done carefully in production
-- For now, we'll just add a comment that these values are deprecated

COMMENT ON TYPE notification_type IS 'Notification types. bonus_reward and admin_announcement added 2026-02-10';

COMMIT;
