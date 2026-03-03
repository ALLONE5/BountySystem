-- 直接更新数据库约束以支持赛博朋克主题
-- 在你的SQL工具中执行这个脚本（如pgAdmin、DBeaver等）

-- 步骤1: 删除旧的约束
ALTER TABLE system_config DROP CONSTRAINT IF EXISTS system_config_animation_style_check;
ALTER TABLE system_config DROP CONSTRAINT IF EXISTS system_config_default_theme_check;

-- 步骤2: 添加新的约束，包含cyberpunk和matrix选项
ALTER TABLE system_config 
ADD CONSTRAINT system_config_animation_style_check 
CHECK (animation_style IN ('none', 'minimal', 'scanline', 'particles', 'hexagon', 'datastream', 'hologram', 'ripple', 'cyberpunk', 'matrix'));

ALTER TABLE system_config 
ADD CONSTRAINT system_config_default_theme_check 
CHECK (default_theme IN ('light', 'dark', 'cyberpunk'));

-- 步骤3: 验证约束已创建
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'system_config';