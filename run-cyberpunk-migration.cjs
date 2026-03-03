const { pool } = require('./packages/backend/src/config/database.js');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    const migrationPath = path.join(__dirname, 'packages/database/migrations/20260212_000001_update_cyberpunk_theme.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('Running cyberpunk theme migration...');
    await pool.query(sql);
    console.log('✅ Cyberpunk theme migration completed successfully');
    
    // Verify the update
    const result = await pool.query('SELECT default_theme, animation_style FROM system_config ORDER BY created_at DESC LIMIT 1');
    if (result.rows.length > 0) {
      console.log('Current system config:', result.rows[0]);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();