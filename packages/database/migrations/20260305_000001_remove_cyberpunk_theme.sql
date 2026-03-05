-- Remove cyberpunk theme support from system configuration
-- Migration: 20260305_000001_remove_cyberpunk_theme.sql

-- Drop existing constraints
ALTER TABLE system_config DROP CONSTRAINT IF EXISTS system_config_default_theme_check;
ALTER TABLE system_config DROP CONSTRAINT IF EXISTS system_config_animation_style_check;

-- Add updated constraints without cyberpunk support
ALTER TABLE system_config ADD CONSTRAINT system_config_default_theme_check 
  CHECK (default_theme IN ('light', 'dark'));

ALTER TABLE system_config ADD CONSTRAINT system_config_animation_style_check 
  CHECK (animation_style IN ('none', 'minimal', 'scanline', 'particles', 'hexagon', 'datastream', 'hologram', 'ripple', 'matrix'));

-- Update any existing cyberpunk theme configurations to dark theme
UPDATE system_config 
SET default_theme = 'dark' 
WHERE default_theme = 'cyberpunk';

-- Update any existing cyberpunk animation styles to minimal
UPDATE system_config 
SET animation_style = 'minimal' 
WHERE animation_style = 'cyberpunk';