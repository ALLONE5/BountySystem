const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'bounty_hunter',
  user: 'postgres',
  password: '123456'
});

async function checkDuplicateRankings() {
  try {
    // Check for duplicate rankings
    const duplicateQuery = `
      SELECT 
        user_id, 
        period, 
        year, 
        month, 
        quarter, 
        COUNT(*) as count
      FROM rankings
      WHERE period = 'monthly' AND year = 2026 AND month = 2
      GROUP BY user_id, period, year, month, quarter
      HAVING COUNT(*) > 1
    `;
    
    const duplicates = await pool.query(duplicateQuery);
    console.log('Duplicate rankings found:', duplicates.rows.length);
    console.log(JSON.stringify(duplicates.rows, null, 2));
    
    // Get all rankings for February 2026
    const allRankingsQuery = `
      SELECT 
        r.id,
        r.user_id,
        u.username,
        r.period,
        r.year,
        r.month,
        r.rank,
        r.total_bounty,
        r.calculated_at
      FROM rankings r
      JOIN users u ON r.user_id = u.id
      WHERE r.period = 'monthly' AND r.year = 2026 AND r.month = 2
      ORDER BY r.rank ASC, r.user_id ASC
    `;
    
    const allRankings = await pool.query(allRankingsQuery);
    console.log('\nAll rankings for February 2026:');
    console.log(JSON.stringify(allRankings.rows, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkDuplicateRankings();
