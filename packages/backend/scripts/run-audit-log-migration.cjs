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
    console.log('🔧 Running audit log migration...\n');
    
    // Read migration file
    const migrationPath = path.join(__dirname, '../../database/migrations/20260210_000004_create_audit_logs.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute migration
    await client.query(migrationSQL);
    
    console.log('✅ Audit log migration completed successfully!');
    
    // Verify the table was created
    const result = await client.query(`
      SELECT COUNT(*) as count 
      FROM audit_logs
    `);
    
    console.log(`📊 Audit log records: ${result.rows[0].count}`);
    
    // Check indexes
    const indexResult = await client.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'audit_logs'
      ORDER BY indexname
    `);
    
    console.log(`📋 Created indexes: ${indexResult.rows.length}`);
    indexResult.rows.forEach(row => {
      console.log(`  - ${row.indexname}`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch(console.error);