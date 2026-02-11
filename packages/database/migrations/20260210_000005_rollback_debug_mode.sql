-- Remove debug mode field from system_config table
ALTER TABLE system_config 
DROP COLUMN IF EXISTS debug_mode;