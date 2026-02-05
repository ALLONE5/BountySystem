-- Rollback: Drop Auxiliary Tables
-- Description: Rollback script for auxiliary tables migration
-- Date: 2024-12-10

BEGIN;

-- Drop triggers first
DROP TRIGGER IF EXISTS deduct_budget_on_review ON task_reviews;
DROP TRIGGER IF EXISTS validate_budget_usage ON admin_budgets;
DROP TRIGGER IF EXISTS validate_task_assistant_allocation ON task_assistants;

-- Drop functions
DROP FUNCTION IF EXISTS deduct_extra_bounty_from_budget();
DROP FUNCTION IF EXISTS validate_admin_budget();
DROP FUNCTION IF EXISTS validate_assistant_allocation();

-- Drop tables in reverse order of creation
DROP TABLE IF EXISTS task_reviews CASCADE;
DROP TABLE IF EXISTS admin_budgets CASCADE;
DROP TABLE IF EXISTS bounty_algorithms CASCADE;
DROP TABLE IF EXISTS rankings CASCADE;
DROP TABLE IF EXISTS avatars CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS position_applications CASCADE;
DROP TABLE IF EXISTS task_assistants CASCADE;
DROP TABLE IF EXISTS group_members CASCADE;
DROP TABLE IF EXISTS task_groups CASCADE;

-- Remove foreign key constraints that were added
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS fk_tasks_group_id;
ALTER TABLE users DROP CONSTRAINT IF EXISTS fk_users_avatar_id;

COMMIT;
