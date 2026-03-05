const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'bounty_hunter',
  user: 'postgres',
  password: '123456'
});

async function checkData() {
  try {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM rankings WHERE period = $1 AND year = $2 AND month = $3',
      ['monthly', 2026, 3]
    );
    console.log('2026-3 monthly rankings count:', result.rows[0].count);
    
    const result2 = await pool.query(
      'SELECT COUNT(*) as count FROM rankings WHERE period = $1 AND year = $2 AND quarter = $3',
      ['quarterly', 2026, 1]
    );
    console.log('2026-Q1 quarterly rankings count:', result2.rows[0].count);
    
    const result3 = await pool.query(
      'SELECT COUNT(*) as count FROM rankings WHERE period = $1 AND year = $2',
      ['all_time', 2026]
    );
    console.log('2026 all-time rankings count:', result3.rows[0].count);
    
    // 检查有数据的用户
    const result4 = await pool.query(
      'SELECT COUNT(*) as count FROM rankings WHERE period = $1 AND year = $2 AND month = $3 AND total_bounty > 0',
      ['monthly', 2026, 3]
    );
    console.log('2026-3 monthly rankings with bounty > 0:', result4.rows[0].count);
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkData();