const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'bounty_hunter',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '123456',
});

async function checkUserRankings() {
  const client = await pool.connect();
  try {
    console.log('=== 检查用户排名数据 ===\n');

    // 获取所有用户
    const usersResult = await client.query(`
      SELECT id, username, email 
      FROM users 
      ORDER BY username
      LIMIT 10
    `);

    console.log(`找到 ${usersResult.rows.length} 个用户\n`);

    for (const user of usersResult.rows) {
      console.log(`\n用户: ${user.username} (${user.email})`);
      console.log('='.repeat(50));

      // 检查当月排名
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      const currentQuarter = Math.ceil(currentMonth / 3);

      const monthlyResult = await client.query(`
        SELECT * FROM rankings 
        WHERE user_id = $1 
          AND period = 'monthly' 
          AND year = $2 
          AND month = $3
      `, [user.id, currentYear, currentMonth]);

      const quarterlyResult = await client.query(`
        SELECT * FROM rankings 
        WHERE user_id = $1 
          AND period = 'quarterly' 
          AND year = $2 
          AND quarter = $3
      `, [user.id, currentYear, currentQuarter]);

      const allTimeResult = await client.query(`
        SELECT * FROM rankings 
        WHERE user_id = $1 
          AND period = 'all_time' 
          AND year = $2
      `, [user.id, currentYear]);

      console.log(`当月排名 (${currentYear}-${currentMonth}):`, 
        monthlyResult.rows.length > 0 
          ? `排名 ${monthlyResult.rows[0].rank}, 赏金 $${monthlyResult.rows[0].total_bounty}`
          : '无数据');

      console.log(`当季排名 (${currentYear}-Q${currentQuarter}):`, 
        quarterlyResult.rows.length > 0 
          ? `排名 ${quarterlyResult.rows[0].rank}, 赏金 $${quarterlyResult.rows[0].total_bounty}`
          : '无数据');

      console.log(`累积排名 (${currentYear}):`, 
        allTimeResult.rows.length > 0 
          ? `排名 ${allTimeResult.rows[0].rank}, 赏金 $${allTimeResult.rows[0].total_bounty}`
          : '无数据');

      // 检查完成的任务
      const tasksResult = await client.query(`
        SELECT COUNT(*) as count, COALESCE(SUM(bounty_amount), 0) as total_bounty
        FROM tasks
        WHERE assignee_id = $1 AND status = 'completed'
      `, [user.id]);

      console.log(`完成任务: ${tasksResult.rows[0].count} 个, 总赏金: $${tasksResult.rows[0].total_bounty}`);
    }

    console.log('\n=== 检查完成 ===');

  } catch (error) {
    console.error('检查失败:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkUserRankings();
