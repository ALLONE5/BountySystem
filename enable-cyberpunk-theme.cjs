const { Pool } = require('pg');

// Database configuration
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'bounty_hunter_platform',
  user: 'postgres',
  password: 'postgres123',
});

async function enableCyberpunkTheme() {
  try {
    console.log('🔧 Updating database constraints to support cyberpunk theme...');
    
    // Update animation style constraint
    await pool.query(`
      ALTER TABLE system_config DROP CONSTRAINT IF EXISTS system_config_animation_style_check;
    `);
    
    await pool.query(`
      ALTER TABLE system_config ADD CONSTRAINT system_config_animation_style_check 
      CHECK (animation_style IN ('none', 'minimal', 'scanline', 'particles', 'hexagon', 'datastream', 'hologram', 'ripple', 'cyberpunk', 'matrix'));
    `);
    
    // Update theme constraint
    await pool.query(`
      ALTER TABLE system_config DROP CONSTRAINT IF EXISTS system_config_default_theme_check;
    `);
    
    await pool.query(`
      ALTER TABLE system_config ADD CONSTRAINT system_config_default_theme_check 
      CHECK (default_theme IN ('light', 'dark', 'cyberpunk'));
    `);
    
    console.log('✅ Database constraints updated successfully');
    
    // Now update the system config to cyberpunk
    console.log('🎨 Setting cyberpunk theme as default...');
    
    await pool.query(`
      UPDATE system_config 
      SET 
        default_theme = 'cyberpunk',
        animation_style = 'cyberpunk',
        enable_animations = true,
        allow_theme_switch = true,
        updated_at = NOW()
      WHERE id = (SELECT id FROM system_config ORDER BY created_at DESC LIMIT 1);
    `);
    
    console.log('✅ System configuration updated to cyberpunk theme');
    
    // Verify the update
    const result = await pool.query(`
      SELECT default_theme, animation_style, enable_animations, allow_theme_switch 
      FROM system_config 
      ORDER BY created_at DESC 
      LIMIT 1
    `);
    
    if (result.rows.length > 0) {
      const config = result.rows[0];
      console.log('📋 Current configuration:');
      console.log(`  - Theme: ${config.default_theme}`);
      console.log(`  - Animation: ${config.animation_style}`);
      console.log(`  - Animations Enabled: ${config.enable_animations}`);
      console.log(`  - Theme Switch Allowed: ${config.allow_theme_switch}`);
      
      if (config.default_theme === 'cyberpunk' && config.animation_style === 'cyberpunk') {
        console.log('🎉 Cyberpunk theme is now active!');
        console.log('🚀 Please refresh your browser to see the cyberpunk UI');
      }
    }
    
    await pool.end();
    
  } catch (error) {
    console.error('❌ Error enabling cyberpunk theme:', error.message);
    await pool.end();
    process.exit(1);
  }
}

enableCyberpunkTheme();