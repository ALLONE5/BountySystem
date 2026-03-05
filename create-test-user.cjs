const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'bounty_hunter',
  user: 'postgres',
  password: '123456'
});

async function createTestUser() {
  try {
    const hashedPassword = await bcrypt.hash('testpass123', 10);
    
    // 删除已存在的测试用户
    await pool.query("DELETE FROM users WHERE username = 'testuser'");
    
    // 创建新的测试用户
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, role) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, username, email, role`,
      ['testuser', 'testuser@example.com', hashedPassword, 'super_admin']
    );
    
    console.log('Test user created:', result.rows[0]);
    
    await pool.end();
  } catch (error) {
    console.error('Error creating test user:', error);
    process.exit(1);
  }
}

createTestUser();