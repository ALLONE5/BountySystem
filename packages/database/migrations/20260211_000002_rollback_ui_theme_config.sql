-- Rollback Migration: Remove UI theme and animation configuration from system_config
-- Date: 2026-02-11
-- Description: Remove UI theme and animation fields

-- Remove the added columns
ALTER TABLE system_config 
DROP COLUMN IF EXISTS default_theme,
DROP COLUMN IF EXISTS allow_theme_switch,
DROP COLUMN IF EXISTS animation_style,
DROP COLUMN IF EXISTS enable_animations,
DROP COLUMN IF EXISTS reduced_motion;