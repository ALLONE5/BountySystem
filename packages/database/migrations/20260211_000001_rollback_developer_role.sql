-- Rollback Migration: Remove DEVELOPER role from user role enum
-- Date: 2026-02-11
-- Description: Rollback the addition of DEVELOPER role

-- First, update any users with developer role to super_admin (to prevent data loss)
UPDATE users SET role = 'super_admin' WHERE role = 'developer';

-- Note: PostgreSQL doesn't support removing enum values directly
-- To fully remove the enum value, you would need to:
-- 1. Create a new enum without 'developer'
-- 2. Update the column to use the new enum
-- 3. Drop the old enum
-- This is complex and risky, so we just convert users back to super_admin

-- For a complete rollback, you would need to recreate the enum:
-- CREATE TYPE user_role_new AS ENUM ('user', 'position_admin', 'super_admin');
-- ALTER TABLE users ALTER COLUMN role TYPE user_role_new USING role::text::user_role_new;
-- DROP TYPE user_role;
-- ALTER TYPE user_role_new RENAME TO user_role;