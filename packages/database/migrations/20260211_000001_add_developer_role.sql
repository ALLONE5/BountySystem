-- Migration: Add DEVELOPER role to user role enum
-- Date: 2026-02-11
-- Description: Add new DEVELOPER role that has same permissions as SUPER_ADMIN but is separate for organizational purposes

-- Add DEVELOPER to the user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'developer';

-- Update any existing super_admin users to developer if needed (optional - can be done manually)
-- This is commented out as it should be done manually based on business requirements
-- UPDATE users SET role = 'developer' WHERE role = 'super_admin' AND username IN ('specific_developer_usernames');