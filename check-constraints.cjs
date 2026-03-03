const { Pool } = require('pg');

// Use the same database config as the backend
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'bounty_hunter',
  password: 'postgres',  // Try with password
  port: 5432,
});

async function checkConstraints() {
  try {
    console.log('🔍 Checking current system_config constraints...');
    
    const result = await pool.query(`
      SELECT conname, consrc 
      FROM pg_constraint 
      WHERE conrelid = 'system_config'::regclass 
      AND contype = 'c'
      ORDER BY conname
    `);
    
    console.log('📊 Current constraints:');
    result.rows.forEach(row => {
      console.log(`  - ${row.conname}: ${row.consrc}`);
    });
    
    // Check current system config values
    const configResult = await pool.query('SELECT default_theme, animation_style FROM system_config LIMIT 1');
    if (configResult.rows.length > 0) {
      console.log('📋 Current config values:', configResult.rows[0]);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkConstraints();