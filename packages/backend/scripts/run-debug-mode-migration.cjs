const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'bounty_hunter',
  password: '123456',
  port: 5432,
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Running debug mode migration...');
    
    // Read migration file
    const migrationPath = path.join(__dirname, '../../database/migrations/20260210_000005_add_debug_mode_to_system_config.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute migration
    await client.query(migrationSQL);
    
    console.log('✅ Debug mode migration completed successfully');
    
    // Verify the column was added
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'system_config' AND column_name = 'debug_mode'
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ debug_mode column verified:', result.rows[0]);
    } else {
      console.log('❌ debug_mode column not found');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch(console.error);