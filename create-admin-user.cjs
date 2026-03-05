const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'bounty_hunter',
  user: 'postgres',
  password: '123456'
});

async function createAdminUser() {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // 删除已存在的测试admin用户
    await pool.query("DELETE FROM users WHERE username = 'testadmin'");
    
    // 创建新的测试admin用户
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, role) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, username, email, role`,
      ['testadmin', 'testadmin@example.com', hashedPassword, 'super_admin']
    );
    
    console.log('Test admin user created:', result.rows[0]);
    
    // 为这个用户添加排行数据
    const userId = result.rows[0].id;
    
    // 删除可能存在的旧排行数据
    await pool.query(
      "DELETE FROM rankings WHERE user_id = $1",
      [userId]
    );
    
    // 插入排行数据
    await pool.query(
      `INSERT INTO rankings (user_id, period, year, month, quarter, total_bounty, completed_tasks_count, rank)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [userId, 'monthly', 2026, 3, null, 1500.00, 5, 1]
    );
    
    await pool.query(
      `INSERT INTO rankings (user_id, period, year, month, quarter, total_bounty, completed_tasks_count, rank)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [userId, 'quarterly', 2026, null, 1, 1500.00, 5, 1]
    );
    
    await pool.query(
      `INSERT INTO rankings (user_id, period, year, month, quarter, total_bounty, completed_tasks_count, rank)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [userId, 'all_time', 2026, null, null, 1500.00, 5, 1]
    );
    
    console.log('Ranking data added for test admin user');
    
    await pool.end();
  } catch (error) {
    console.error('Error creating test admin user:', error);
    process.exit(1);
  }
}

createAdminUser();