const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'bounty_hunter',
  user: 'postgres',
  password: '123456'
});

async function checkRankingData() {
  try {
    // 检查rankings表是否存在数据
    const rankingsResult = await pool.query('SELECT COUNT(*) as count FROM rankings');
    console.log('Rankings table count:', rankingsResult.rows[0].count);
    
    // 检查是否有已完成的任务
    const tasksResult = await pool.query("SELECT COUNT(*) as count FROM tasks WHERE status = 'completed'");
    console.log('Completed tasks count:', tasksResult.rows[0].count);
    
    // 检查用户数量
    const usersResult = await pool.query('SELECT COUNT(*) as count FROM users');
    console.log('Users count:', usersResult.rows[0].count);
    
    // 检查当前月份的排行数据
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    
    const currentMonthResult = await pool.query(
      "SELECT COUNT(*) as count FROM rankings WHERE period = 'monthly' AND year = $1 AND month = $2",
      [currentYear, currentMonth]
    );
    console.log(`Current month (${currentYear}-${currentMonth}) rankings count:`, currentMonthResult.rows[0].count);
    
    // 检查是否有任何排行数据
    const anyRankingsResult = await pool.query('SELECT * FROM rankings LIMIT 5');
    console.log('Sample rankings data:', anyRankingsResult.rows);
    
    await pool.end();
  } catch (error) {
    console.error('Error checking ranking data:', error);
    process.exit(1);
  }
}

checkRankingData();