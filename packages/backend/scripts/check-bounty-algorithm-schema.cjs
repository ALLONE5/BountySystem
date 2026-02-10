const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'bounty_hunter',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '123456',
});

async function checkSchema() {
  try {
    console.log('Checking bounty_algorithms table schema...\n');

    // Check if table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'bounty_algorithms'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('❌ bounty_algorithms table does not exist!');
      return;
    }

    console.log('✅ bounty_algorithms table exists');

    // Check all columns
    const columnsResult = await pool.query(`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' 
      AND table_name = 'bounty_algorithms'
      ORDER BY ordinal_position;
    `);

    console.log('\nTable columns:');
    console.log('─'.repeat(80));
    columnsResult.rows.forEach(col => {
      console.log(`Column: ${col.column_name}`);
      console.log(`  Type: ${col.data_type}`);
      console.log(`  Default: ${col.column_default || 'NULL'}`);
      console.log(`  Nullable: ${col.is_nullable}`);
      console.log('─'.repeat(80));
    });

    // Check specifically for remaining_days_weight
    const hasRemainingDaysWeight = columnsResult.rows.some(
      col => col.column_name === 'remaining_days_weight'
    );

    if (hasRemainingDaysWeight) {
      console.log('\n✅ remaining_days_weight column EXISTS');
    } else {
      console.log('\n❌ remaining_days_weight column MISSING');
      console.log('\nTo fix this, run the migration:');
      console.log('node packages/backend/scripts/run-remaining-days-weight-migration.cjs');
    }

    // Check existing data
    const dataResult = await pool.query('SELECT * FROM bounty_algorithms LIMIT 5;');
    console.log(`\nExisting algorithms: ${dataResult.rows.length}`);
    if (dataResult.rows.length > 0) {
      console.log('\nSample data:');
      dataResult.rows.forEach(row => {
        console.log(JSON.stringify(row, null, 2));
      });
    }

  } catch (error) {
    console.error('Error checking schema:', error);
  } finally {
    await pool.end();
  }
}

checkSchema();
