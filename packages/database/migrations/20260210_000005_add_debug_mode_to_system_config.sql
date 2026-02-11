-- Add debug mode field to system_config table
ALTER TABLE system_config 
ADD COLUMN debug_mode BOOLEAN DEFAULT FALSE;

-- Update existing records to have debug_mode = false
UPDATE system_config SET debug_mode = FALSE WHERE debug_mode IS NULL;