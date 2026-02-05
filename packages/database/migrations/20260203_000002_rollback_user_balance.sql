-- Rollback: Remove balance field from users table
-- Migration: 20260203_000002_rollback_user_balance

-- Drop index
DROP INDEX IF EXISTS idx_users_balance;

-- Drop check constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS check_balance_non_negative;

-- Drop balance column
ALTER TABLE users DROP COLUMN IF EXISTS balance;
