const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'bounty_hunter',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '123456',
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Running system config migration...\n');
    
    // Read migration file
    const migrationPath = path.join(__dirname, '../../database/migrations/20260210_000003_create_system_config.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute migration
    await client.query(migrationSQL);
    
    console.log('✅ System config migration completed successfully!');
    
    // Verify the table was created
    const result = await client.query(`
      SELECT COUNT(*) as count 
      FROM system_config
    `);
    
    console.log(`📊 System config records: ${result.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch(console.error);