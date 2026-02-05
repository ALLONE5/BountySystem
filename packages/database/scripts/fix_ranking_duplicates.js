
const { Pool } = require('pg');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from backend .env
dotenv.config({ path: path.resolve(__dirname, '../../backend/.env') });

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'bounty_hunter',
  password: process.env.DB_PASSWORD || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432'),
});

async function fixRankingDuplicates() {
  const client = await pool.connect();
  try {
    console.log('Starting ranking duplicates fix...');
    await client.query('BEGIN');

    // 1. Delete duplicates, keeping the most recent calculation (highest id usually implies later insertion)
    console.log('Deleting duplicate rankings...');
    const deleteResult = await client.query(`
      DELETE FROM rankings a USING rankings b
      WHERE a.id < b.id
        AND a.user_id = b.user_id
        AND a.period = b.period
        AND a.year = b.year
        AND (a.month IS NOT DISTINCT FROM b.month)
        AND (a.quarter IS NOT DISTINCT FROM b.quarter);
    `);
    console.log(`Deleted ${deleteResult.rowCount} duplicate rows.`);

    // 2. Drop the old ineffective unique constraint
    console.log('Dropping old constraint...');
    await client.query(`
      ALTER TABLE rankings 
      DROP CONSTRAINT IF EXISTS rankings_user_id_period_year_month_quarter_key;
    `);

    // 3. Create proper partial unique indexes
    console.log('Creating new unique indexes...');
    
    // Monthly
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_rankings_unique_monthly 
      ON rankings (user_id, period, year, month) 
      WHERE period = 'monthly';
    `);
    
    // Quarterly
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_rankings_unique_quarterly 
      ON rankings (user_id, period, year, quarter) 
      WHERE period = 'quarterly';
    `);
    
    // All Time
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_rankings_unique_all_time 
      ON rankings (user_id, period, year) 
      WHERE period = 'all_time';
    `);

    await client.query('COMMIT');
    console.log('Successfully fixed ranking duplicates and updated constraints.');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error fixing ranking duplicates:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

fixRankingDuplicates();
