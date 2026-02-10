const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

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
    console.log('Starting migration: Add remaining_days_weight to bounty_algorithms...\n');

    // Read migration file
    const migrationPath = path.join(
      __dirname,
      '../../database/migrations/20260206_000002_add_remaining_days_weight_to_bounty_algorithm.sql'
    );

    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found:', migrationPath);
      return;
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Start transaction
    await client.query('BEGIN');

    // Check if column already exists
    const checkResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'bounty_algorithms'
        AND column_name = 'remaining_days_weight'
      );
    `);

    if (checkResult.rows[0].exists) {
      console.log('✅ Column remaining_days_weight already exists. No migration needed.');
      await client.query('ROLLBACK');
      return;
    }

    // Run migration
    console.log('Running migration SQL...');
    await client.query(migrationSQL);

    // Commit transaction
    await client.query('COMMIT');

    console.log('\n✅ Migration completed successfully!');

    // Verify the column was added
    const verifyResult = await client.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' 
      AND table_name = 'bounty_algorithms'
      AND column_name = 'remaining_days_weight';
    `);

    if (verifyResult.rows.length > 0) {
      console.log('\n✅ Verification: Column added successfully');
      console.log('Column details:', verifyResult.rows[0]);
    }

    // Check updated data
    const dataResult = await client.query('SELECT id, version, remaining_days_weight FROM bounty_algorithms;');
    console.log(`\nUpdated algorithms (${dataResult.rows.length}):`);
    dataResult.rows.forEach(row => {
      console.log(`  - ${row.version}: remaining_days_weight = ${row.remaining_days_weight}`);
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
