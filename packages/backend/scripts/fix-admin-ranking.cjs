const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'bounty_hunter',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '123456',
});

async function fixAdminRanking() {
  const client = await pool.connect();
  
  try {
    console.log('=== Fixing Admin Ranking for February 2026 ===\n');

    await client.query('BEGIN');

    // 1. Get admin user ID
    const adminResult = await client.query(`
      SELECT id, username FROM users WHERE username = 'admin'
    `);
    
    if (adminResult.rows.length === 0) {
      console.log('❌ Admin user not found');
      return;
    }
    
    const adminId = adminResult.rows[0].id;
    console.log(`Admin ID: ${adminId}\n`);

    // 2. Calculate correct bounty for February 2026
    const bountyQuery = `
      SELECT
        COUNT(*) as task_count,
        COALESCE(SUM(bounty_amount), 0) as total_bounty
      FROM tasks
      WHERE assignee_id = $1
        AND status = 'completed'
        AND EXTRACT(YEAR FROM COALESCE(actual_end_date, updated_at)) = 2026
        AND EXTRACT(MONTH FROM COALESCE(actual_end_date, updated_at)) = 2
    `;
    
    const bountyResult = await client.query(bountyQuery, [adminId]);
    const correctBounty = parseFloat(bountyResult.rows[0].total_bounty);
    const correctCount = parseInt(bountyResult.rows[0].task_count);
    
    console.log(`Correct values for Feb 2026:`);
    console.log(`  Tasks: ${correctCount}`);
    console.log(`  Bounty: $${correctBounty.toFixed(2)}\n`);

    // 3. Get current ranking value
    const currentRankingQuery = `
      SELECT total_bounty, completed_tasks_count, rank
      FROM rankings
      WHERE user_id = $1
        AND period = 'monthly'
        AND year = 2026
        AND month = 2
    `;
    
    const currentRanking = await client.query(currentRankingQuery, [adminId]);
    
    if (currentRanking.rows.length > 0) {
      const current = currentRanking.rows[0];
      console.log(`Current ranking values:`);
      console.log(`  Tasks: ${current.completed_tasks_count}`);
      console.log(`  Bounty: $${parseFloat(current.total_bounty).toFixed(2)}`);
      console.log(`  Rank: ${current.rank}\n`);
    }

    // 4. Recalculate all rankings for February 2026
    console.log('Recalculating all rankings for February 2026...\n');
    
    // Delete existing rankings for Feb 2026
    await client.query(`
      DELETE FROM rankings
      WHERE period = 'monthly'
        AND year = 2026
        AND month = 2
    `);
    
    // Calculate new rankings for all users
    const allUsersQuery = `
      SELECT
        u.id AS user_id,
        COALESCE(SUM(CASE
          WHEN t.status = 'completed'
            AND t.assignee_id IS NOT NULL
            AND EXTRACT(YEAR FROM COALESCE(t.actual_end_date, t.updated_at)) = 2026
            AND EXTRACT(MONTH FROM COALESCE(t.actual_end_date, t.updated_at)) = 2
          THEN t.bounty_amount ELSE 0 END), 0) AS total_bounty,
        COALESCE(SUM(CASE
          WHEN t.status = 'completed'
            AND t.assignee_id IS NOT NULL
            AND EXTRACT(YEAR FROM COALESCE(t.actual_end_date, t.updated_at)) = 2026
            AND EXTRACT(MONTH FROM COALESCE(t.actual_end_date, t.updated_at)) = 2
          THEN 1 ELSE 0 END), 0) AS completed_tasks_count
      FROM users u
      LEFT JOIN tasks t ON t.assignee_id = u.id
      GROUP BY u.id
      ORDER BY total_bounty DESC, u.id ASC
    `;
    
    const allUsersResult = await client.query(allUsersQuery);
    
    // Insert new rankings with proper rank handling
    let currentRank = 1;
    let previousBounty = null;
    
    for (let i = 0; i < allUsersResult.rows.length; i++) {
      const row = allUsersResult.rows[i];
      const currentBounty = parseFloat(row.total_bounty);
      
      // If bounty is different from previous, update rank to current position
      if (previousBounty !== null && currentBounty !== previousBounty) {
        currentRank = i + 1;
      }
      
      await client.query(`
        INSERT INTO rankings (user_id, period, year, month, quarter, total_bounty, completed_tasks_count, rank)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        row.user_id,
        'monthly',
        2026,
        2,
        null,
        row.total_bounty,
        row.completed_tasks_count,
        currentRank,
      ]);
      
      previousBounty = currentBounty;
    }
    
    console.log(`✓ Inserted ${allUsersResult.rows.length} ranking records\n`);

    // 5. Verify admin's new ranking
    const newRankingQuery = `
      SELECT total_bounty, completed_tasks_count, rank
      FROM rankings
      WHERE user_id = $1
        AND period = 'monthly'
        AND year = 2026
        AND month = 2
    `;
    
    const newRanking = await client.query(newRankingQuery, [adminId]);
    
    if (newRanking.rows.length > 0) {
      const updated = newRanking.rows[0];
      console.log(`✓ Admin's updated ranking:`);
      console.log(`  Tasks: ${updated.completed_tasks_count}`);
      console.log(`  Bounty: $${parseFloat(updated.total_bounty).toFixed(2)}`);
      console.log(`  Rank: ${updated.rank}\n`);
    }

    await client.query('COMMIT');
    console.log('✓ Rankings fixed successfully!');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

fixAdminRanking();
