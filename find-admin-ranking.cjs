const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'bounty_hunter',
  user: 'postgres',
  password: '123456'
});

async function findAdminUser() {
  try {
    // 查找admin用户
    const result = await pool.query("SELECT id, username FROM users WHERE username LIKE '%admin%' LIMIT 1");
    if (result.rows.length > 0) {
      console.log('Admin user found:', result.rows[0]);
      
      // 检查这个用户是否在排行榜中
      const rankingResult = await pool.query(
        'SELECT * FROM rankings WHERE user_id = $1 AND period = $2 AND year = $3 AND month = $4 LIMIT 1',
        [result.rows[0].id, 'monthly', 2026, 3]
      );
      
      if (rankingResult.rows.length > 0) {
        console.log('Admin user ranking:', rankingResult.rows[0]);
      } else {
        console.log('Admin user not found in rankings');
      }
    }
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
  }
}

findAdminUser();