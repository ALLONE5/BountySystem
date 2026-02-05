const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'bounty_hunter_dev',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function addUserBalance() {
  const client = await pool.connect();
  
  try {
    console.log('Adding balance field to users table...');
    
    // Check if balance column already exists
    const checkResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'balance'
    `);
    
    if (checkResult.rows.length > 0) {
      console.log('Balance column already exists, skipping...');
      return;
    }
    
    // Add balance column
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN balance DECIMAL(10, 2) DEFAULT 0.00 NOT NULL
    `);
    console.log('✓ Added balance column');
    
    // Add check constraint
    await client.query(`
      ALTER TABLE users 
      ADD CONSTRAINT check_balance_non_negative CHECK (balance >= 0)
    `);
    console.log('✓ Added check constraint');
    
    // Add index
    await client.query(`
      CREATE INDEX idx_users_balance ON users(balance)
    `);
    console.log('✓ Added index');
    
    // Add comment
    await client.query(`
      COMMENT ON COLUMN users.balance IS 'User account balance for bounty payments'
    `);
    console.log('✓ Added column comment');
    
    // Set initial balance for existing users (optional - give them some starting balance)
    await client.query(`
      UPDATE users SET balance = 10000.00 WHERE balance = 0
    `);
    console.log('✓ Set initial balance for existing users (10000.00)');
    
    console.log('\n✅ Successfully added balance field to users table!');
    
  } catch (error) {
    console.error('❌ Error adding balance field:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addUserBalance().catch(console.error);
