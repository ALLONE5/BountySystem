const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'bounty_hunter',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function fixConstraints() {
  try {
    console.log('🔧 Connecting to database...');
    
    // Test connection
    const testResult = await pool.query('SELECT NOW()');
    console.log('✅ Database connected');
    
    console.log('\n🔧 Fixing database constraints...');
    
    // Drop existing constraints
    console.log('  - Dropping old constraints...');
    try {
      await pool.query('ALTER TABLE system_config DROP CONSTRAINT IF EXISTS system_config_animation_style_check');
      console.log('    ✅ Dropped animation_style constraint');
    } catch (e) {
      console.log('    (animation_style constraint not found)');
    }
    
    try {
      await pool.query('ALTER TABLE system_config DROP CONSTRAINT IF EXISTS system_config_default_theme_check');
      console.log('    ✅ Dropped default_theme constraint');
    } catch (e) {
      console.log('    (default_theme constraint not found)');
    }
    
    // Add new constraints
    console.log('  - Adding new constraints...');
    
    await pool.query(`
      ALTER TABLE system_config ADD CONSTRAINT system_config_animation_style_check 
      CHECK (animation_style IN ('none', 'minimal', 'scanline', 'particles', 'hexagon', 'datastream', 'hologram', 'ripple', 'cyberpunk', 'matrix'))
    `);
    console.log('    ✅ Animation style constraint added');
    
    await pool.query(`
      ALTER TABLE system_config ADD CONSTRAINT system_config_default_theme_check 
      CHECK (default_theme IN ('light', 'dark', 'cyberpunk'))
    `);
    console.log('    ✅ Default theme constraint added');
    
    console.log('\n✅ Database constraints fixed successfully!');
    
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
    } else {
      console.log('⚠️  No system config found to update');
    }
    
    await pool.end();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    try {
      await pool.end();
    } catch (e) {
      // Ignore
    }
    
    process.exit(1);
  }
}

fixConstraints();