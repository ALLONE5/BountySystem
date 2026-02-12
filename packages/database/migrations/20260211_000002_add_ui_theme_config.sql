-- Migration: Add UI theme and animation configuration to system_config
-- Date: 2026-02-11
-- Description: Add fields for UI theme, animation style, and accessibility options

-- Add new columns to system_config table
ALTER TABLE system_config 
ADD COLUMN default_theme VARCHAR(10) DEFAULT 'dark' CHECK (default_theme IN ('light', 'dark')),
ADD COLUMN allow_theme_switch BOOLEAN DEFAULT true,
ADD COLUMN animation_style VARCHAR(20) DEFAULT 'scanline' CHECK (animation_style IN ('none', 'minimal', 'scanline', 'particles', 'hexagon', 'datastream', 'hologram', 'ripple')),
ADD COLUMN enable_animations BOOLEAN DEFAULT true,
ADD COLUMN reduced_motion BOOLEAN DEFAULT false;

-- Update existing records with default values
UPDATE system_config 
SET 
  default_theme = 'dark',
  allow_theme_switch = true,
  animation_style = 'scanline',
  enable_animations = true,
  reduced_motion = false
WHERE default_theme IS NULL;