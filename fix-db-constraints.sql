-- Fix database constraints to support cyberpunk theme and matrix animation
-- This script updates the CHECK constraints in the system_config table

-- Drop existing constraints
ALTER TABLE system_config DROP CONSTRAINT IF EXISTS system_config_animation_style_check;
ALTER TABLE system_config DROP CONSTRAINT IF EXISTS system_config_default_theme_check;

-- Add new constraints with cyberpunk and matrix options
ALTER TABLE system_config ADD CONSTRAINT system_config_animation_style_check 
CHECK (animation_style IN ('none', 'minimal', 'scanline', 'particles', 'hexagon', 'datastream', 'hologram', 'ripple', 'cyberpunk', 'matrix'));

ALTER TABLE system_config ADD CONSTRAINT system_config_default_theme_check 
CHECK (default_theme IN ('light', 'dark', 'cyberpunk'));

-- Verify the constraints were created
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'system_config' 
AND constraint_name LIKE '%animation%' OR constraint_name LIKE '%theme%';