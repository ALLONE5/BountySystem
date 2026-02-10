/**
 * Script to run the bounty_transactions schema migration
 * This updates the table to support transaction history tracking
 */

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'bounty_hunter',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });

  try {
    console.log('Connecting to database...');
    console.log(`  Host: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`  Database: ${process.env.DB_NAME || 'bounty_hunter'}`);
    console.log(`  User: ${process.env.DB_USER || 'postgres'}`);
    
    const client = await pool.connect();

    console.log('Reading migration file...');
    const migrationPath = path.join(
      __dirname,
      '../../database/migrations/20241212_000001_update_bounty_transactions_schema.sql'
    );
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('Running migration...');
    await client.query(migrationSQL);

    console.log('✓ Migration completed successfully!');
    console.log('  - Dropped old bounty_transactions table');
    console.log('  - Created new transaction_type enum (task_completion, extra_reward, assistant_share, refund)');
    console.log('  - Created new transaction_status enum (pending, locked, completed, cancelled)');
    console.log('  - Created new bounty_transactions table with from_user_id, to_user_id, type, description, status');
    console.log('  - Created indexes for optimal query performance');

    client.release();
    await pool.end();
  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    console.error(error);
    await pool.end();
    process.exit(1);
  }
}

runMigration();
