-- Rollback: Drop Core Tables
-- Description: Rollback script for core tables migration
-- Date: 2024-12-10

BEGIN;

-- Drop triggers first
DROP TRIGGER IF EXISTS prevent_circular_dependency ON task_dependencies;
DROP TRIGGER IF EXISTS update_parent_on_child_insert ON tasks;
DROP TRIGGER IF EXISTS enforce_task_executable ON tasks;
DROP TRIGGER IF EXISTS enforce_user_position_limit ON user_positions;

-- Drop functions
DROP FUNCTION IF EXISTS check_circular_dependency();
DROP FUNCTION IF EXISTS update_parent_executable();
DROP FUNCTION IF EXISTS check_task_executable();
DROP FUNCTION IF EXISTS check_user_position_limit();

-- Drop tables in reverse order of creation
DROP TABLE IF EXISTS task_dependencies CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS position_admins CASCADE;
DROP TABLE IF EXISTS user_positions CASCADE;
DROP TABLE IF EXISTS positions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

COMMIT;
