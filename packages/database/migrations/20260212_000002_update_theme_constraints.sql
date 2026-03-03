-- Update system config constraints to support cyberpunk theme and new animation styles
-- Migration: 20260212_000002_update_theme_constraints.sql

-- Drop existing constraints
ALTER TABLE system_config DROP CONSTRAINT IF EXISTS system_config_default_theme_check;
ALTER TABLE system_config DROP CONSTRAINT IF EXISTS system_config_animation_style_check;

-- Add updated constraints with cyberpunk support
ALTER TABLE system_config ADD CONSTRAINT system_config_default_theme_check 
  CHECK (default_theme IN ('light', 'dark', 'cyberpunk'));

ALTER TABLE system_config ADD CONSTRAINT system_config_animation_style_check 
  CHECK (animation_style IN ('none', 'minimal', 'scanline', 'particles', 'hexagon', 'datastream', 'hologram', 'ripple', 'cyberpunk', 'matrix'));