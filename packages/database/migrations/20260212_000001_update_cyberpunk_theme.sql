-- Update system config to support cyberpunk theme and set it as default
-- Migration: 20260212_000001_update_cyberpunk_theme.sql

-- Update the default theme to cyberpunk and animation style to cyberpunk
UPDATE system_config 
SET 
  default_theme = 'cyberpunk',
  animation_style = 'cyberpunk',
  updated_at = NOW()
WHERE id = (SELECT id FROM system_config ORDER BY created_at DESC LIMIT 1);

-- If no system config exists, create one with cyberpunk defaults
INSERT INTO system_config (
  site_name,
  site_description,
  logo_url,
  allow_registration,
  maintenance_mode,
  debug_mode,
  max_file_size,
  default_user_role,
  email_enabled,
  smtp_host,
  smtp_port,
  smtp_user,
  smtp_password,
  smtp_secure,
  default_theme,
  allow_theme_switch,
  animation_style,
  enable_animations,
  reduced_motion,
  created_at,
  updated_at
)
SELECT 
  '赏金猎人平台',
  '基于任务的协作平台',
  '',
  true,
  false,
  false,
  10,
  'user',
  false,
  '',
  587,
  '',
  '',
  true,
  'cyberpunk',
  true,
  'cyberpunk',
  true,
  false,
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM system_config);