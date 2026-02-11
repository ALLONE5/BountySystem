-- Drop trigger and function
DROP TRIGGER IF EXISTS trigger_update_system_config_updated_at ON system_config;
DROP FUNCTION IF EXISTS update_system_config_updated_at();

-- Drop indexes
DROP INDEX IF EXISTS idx_system_config_updated_at;

-- Drop table
DROP TABLE IF EXISTS system_config;