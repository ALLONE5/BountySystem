const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'bounty_hunter',
  user: 'postgres',
  password: '123456'
});

async function checkAdminUser() {
  try {
    // 检查是否有admin用户
    const result = await pool.query("SELECT id, username, email, role FROM users WHERE role = 'super_admin' OR username LIKE '%admin%' LIMIT 5");
    console.log('Admin users found:', result.rows);
    
    // 检查总用户数
    const countResult = await pool.query('SELECT COUNT(*) as count FROM users');
    console.log('Total users:', countResult.rows[0].count);
    
    // 获取前几个用户
    const sampleResult = await pool.query('SELECT id, username, email, role FROM users LIMIT 5');
    console.log('Sample users:', sampleResult.rows);
    
    await pool.end();
  } catch (error) {
    console.error('Error checking admin user:', error);
    process.exit(1);
  }
}

checkAdminUser();