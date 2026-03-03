-- Update animation style constraints to include cyberpunk and matrix
-- Migration: 20260212_000002_update_animation_constraints.sql

-- Drop the existing constraint
ALTER TABLE system_config DROP CONSTRAINT IF EXISTS system_config_animation_style_check;

-- Add the new constraint with cyberpunk and matrix options
ALTER TABLE system_config ADD CONSTRAINT system_config_animation_style_check 
CHECK (animation_style IN ('none', 'minimal', 'scanline', 'particles', 'hexagon', 'datastream', 'hologram', 'ripple', 'cyberpunk', 'matrix'));

-- Drop the existing theme constraint if it exists
ALTER TABLE system_config DROP CONSTRAINT IF EXISTS system_config_default_theme_check;

-- Add the new constraint with cyberpunk theme option
ALTER TABLE system_config ADD CONSTRAINT system_config_default_theme_check 
CHECK (default_theme IN ('light', 'dark', 'cyberpunk'));