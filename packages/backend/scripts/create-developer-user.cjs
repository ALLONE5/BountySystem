const { Pool } = require('pg');
const bcrypt = require('bcrypt');

// Database configuration
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'bounty_hunter',
  password: process.env.DB_PASSWORD || '123456',
  port: process.env.DB_PORT || 5432,
});

async function createDeveloperUser() {
  const client = await pool.connect();
  
  try {
    console.log('Creating developer user...');
    
    // Check if developer user already exists
    const existingUser = await client.query(
      'SELECT id, username, role FROM users WHERE username = $1',
      ['developer']
    );
    
    if (existingUser.rows.length > 0) {
      const user = existingUser.rows[0];
      console.log(`User 'developer' already exists with role: ${user.role}`);
      
      // Update role to developer if it's not already
      if (user.role !== 'developer') {
        await client.query(
          'UPDATE users SET role = $1 WHERE id = $2',
          ['developer', user.id]
        );
        console.log(`✅ Updated user 'developer' role to 'developer'`);
      }
      return;
    }
    
    // Hash password
    const password = 'Password123';
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Create developer user
    const result = await client.query(`
      INSERT INTO users (username, email, password_hash, role, balance, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING id, username, email, role
    `, [
      'developer',
      'developer@example.com',
      passwordHash,
      'developer',
      0
    ]);
    
    const newUser = result.rows[0];
    console.log('✅ Developer user created successfully:');
    console.log(`   ID: ${newUser.id}`);
    console.log(`   Username: ${newUser.username}`);
    console.log(`   Email: ${newUser.email}`);
    console.log(`   Role: ${newUser.role}`);
    console.log(`   Password: ${password}`);
    
  } catch (error) {
    console.error('❌ Failed to create developer user:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the script
createDeveloperUser().catch(console.error);