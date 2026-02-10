const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'bounty_hunter',
  user: 'postgres',
  password: '123456'
});

async function fixDuplicateRankings() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('Removing duplicate rankings...');
    
    // Delete duplicate rankings, keeping only the most recent one for each user/period combination
    const deleteQuery = `
      DELETE FROM rankings
      WHERE id IN (
        SELECT id
        FROM (
          SELECT 
            id,
            ROW_NUMBER() OVER (
              PARTITION BY user_id, period, year, COALESCE(month, 0), COALESCE(quarter, 0)
              ORDER BY calculated_at DESC
            ) as rn
          FROM rankings
        ) t
        WHERE rn > 1
      )
    `;
    
    const result = await client.query(deleteQuery);
    console.log(`Deleted ${result.rowCount} duplicate ranking records`);
    
    // Verify no duplicates remain
    const verifyQuery = `
      SELECT 
        user_id, 
        period, 
        year, 
        month, 
        quarter, 
        COUNT(*) as count
      FROM rankings
      GROUP BY user_id, period, year, month, quarter
      HAVING COUNT(*) > 1
    `;
    
    const verifyResult = await client.query(verifyQuery);
    
    if (verifyResult.rows.length > 0) {
      console.log('WARNING: Duplicates still exist:', verifyResult.rows);
      throw new Error('Failed to remove all duplicates');
    }
    
    console.log('✓ All duplicates removed successfully');
    
    // Show summary
    const summaryQuery = `
      SELECT period, COUNT(*) as count
      FROM rankings
      GROUP BY period
      ORDER BY period
    `;
    
    const summary = await client.query(summaryQuery);
    console.log('\nRanking summary:');
    summary.rows.forEach(row => {
      console.log(`  ${row.period}: ${row.count} users`);
    });
    
    await client.query('COMMIT');
    console.log('\n✓ Transaction committed');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

fixDuplicateRankings().catch(console.error);
