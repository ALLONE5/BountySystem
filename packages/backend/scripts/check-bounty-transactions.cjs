const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'bounty_hunter',
  user: 'postgres',
  password: '123456',
});

async function checkTransactions() {
  try {
    console.log('Checking bounty_transactions table...\n');
    
    // Check table structure
    const structureResult = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'bounty_transactions'
      ORDER BY ordinal_position
    `);
    
    console.log('Table structure:');
    console.table(structureResult.rows);
    
    // Check total count
    const countResult = await pool.query('SELECT COUNT(*) FROM bounty_transactions');
    console.log(`\nTotal transactions: ${countResult.rows[0].count}`);
    
    // Check sample data
    const sampleResult = await pool.query(`
      SELECT 
        id,
        task_id,
        from_user_id,
        to_user_id,
        amount,
        type,
        description,
        created_at
      FROM bounty_transactions
      ORDER BY created_at DESC
      LIMIT 5
    `);
    
    console.log('\nSample transactions:');
    console.table(sampleResult.rows);
    
    // Check users
    const usersResult = await pool.query('SELECT id, username FROM users LIMIT 5');
    console.log('\nSample users:');
    console.table(usersResult.rows);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkTransactions();
