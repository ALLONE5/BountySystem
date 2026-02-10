const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'bounty_hunter',
  user: 'postgres',
  password: '123456'
});

async function addUniqueConstraint() {
  const client = await pool.connect();
  
  try {
    console.log('Adding unique constraint to rankings table...');
    
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '../../database/migrations/20260206_000001_add_rankings_unique_constraint.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    await client.query(sql);
    
    console.log('✓ Unique constraint added successfully');
    console.log('✓ Indexes created successfully');
    
  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addUniqueConstraint().catch(console.error);
