// Direct database constraint fix using the backend's database connection
const path = require('path');
const fs = require('fs');

// Import the database pool from backend
const { pool } = require('./packages/backend/src/config/database.js');

async function fixConstraints() {
  try {
    console.log('🔧 Fixing database constraints...');
    
    // Drop existing constraints
    console.log('  - Dropping old constraints...');
    try {
      await pool.query('ALTER TABLE system_config DROP CONSTRAINT IF EXISTS system_config_animation_style_check');
    } catch (e) {
      console.log('    (animation_style constraint not found, continuing...)');
    }
    
    try {
      await pool.query('ALTER TABLE system_config DROP CONSTRAINT IF EXISTS system_config_default_theme_check');
    } catch (e) {
      console.log('    (default_theme constraint not found, continuing...)');
    }
    
    // Add new constraints
    console.log('  - Adding new constraints...');
    
    await pool.query(`
      ALTER TABLE system_config ADD CONSTRAINT system_config_animation_style_check 
      CHECK (animation_style IN ('none', 'minimal', 'scanline', 'particles', 'hexagon', 'datastream', 'hologram', 'ripple', 'cyberpunk', 'matrix'))
    `);
    console.log('    ✅ Animation style constraint updated');
    
    await pool.query(`
      ALTER TABLE system_config ADD CONSTRAINT system_config_default_theme_check 
      CHECK (default_theme IN ('light', 'dark', 'cyberpunk'))
    `);
    console.log('    ✅ Default theme constraint updated');
    
    console.log('✅ Database constraints fixed successfully!');
    
    // Now try to update the system config to cyberpunk
    console.log('\n🎨 Updating system configuration to cyberpunk...');
    
    const updateResult = await pool.query(`
      UPDATE system_config 
      SET 
        default_theme = 'cyberpunk',
        animation_style = 'cyberpunk',
        enable_animations = true,
        allow_theme_switch = true,
        updated_at = NOW()
      WHERE id = (SELECT id FROM system_config ORDER BY created_at DESC LIMIT 1)
      RETURNING default_theme, animation_style, enable_animations, allow_theme_switch
    `);
    
    if (updateResult.rows.length > 0) {
      const config = updateResult.rows[0];
      console.log('✅ System configuration updated:');
      console.log(`  - Theme: ${config.default_theme}`);
      console.log(`  - Animation: ${config.animation_style}`);
      console.log(`  - Animations Enabled: ${config.enable_animations}`);
      console.log(`  - Theme Switch Allowed: ${config.allow_theme_switch}`);
      
      if (config.default_theme === 'cyberpunk' && config.animation_style === 'cyberpunk') {
        console.log('\n🎉 Cyberpunk theme is now active!');
        console.log('🚀 Please refresh your browser to see the cyberpunk UI');
      }
    }
    
    await pool.end();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error fixing constraints:', error.message);
    console.error('Full error:', error);
    
    try {
      await pool.end();
    } catch (e) {
      // Ignore
    }
    
    process.exit(1);
  }
}

fixConstraints();