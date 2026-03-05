const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'bounty_hunter',
  user: 'postgres',
  password: '123456'
});

async function calculateCurrentRankings() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    const currentQuarter = Math.ceil(currentMonth / 3);

    console.log(`Calculating rankings for ${currentYear}-${currentMonth} (Q${currentQuarter})`);

    // 删除当前月份的旧排行数据
    await client.query(
      "DELETE FROM rankings WHERE period = 'monthly' AND year = $1 AND month = $2",
      [currentYear, currentMonth]
    );

    // 删除当前季度的旧排行数据
    await client.query(
      "DELETE FROM rankings WHERE period = 'quarterly' AND year = $1 AND quarter = $2",
      [currentYear, currentQuarter]
    );

    // 删除当前年份的全时排行数据
    await client.query(
      "DELETE FROM rankings WHERE period = 'all_time' AND year = $1",
      [currentYear]
    );

    // 计算月度排行
    const monthlyBountyQuery = `
      SELECT
        u.id AS user_id,
        COALESCE(SUM(CASE
          WHEN t.status = 'completed'
            AND t.assignee_id IS NOT NULL
            AND EXTRACT(YEAR FROM COALESCE(t.actual_end_date, t.updated_at)) = $1
            AND EXTRACT(MONTH FROM COALESCE(t.actual_end_date, t.updated_at)) = $2
          THEN t.bounty_amount ELSE 0 END), 0) AS total_bounty,
        COALESCE(SUM(CASE
          WHEN t.status = 'completed'
            AND t.assignee_id IS NOT NULL
            AND EXTRACT(YEAR FROM COALESCE(t.actual_end_date, t.updated_at)) = $1
            AND EXTRACT(MONTH FROM COALESCE(t.actual_end_date, t.updated_at)) = $2
          THEN 1 ELSE 0 END), 0) AS completed_tasks_count
      FROM users u
      LEFT JOIN tasks t ON t.assignee_id = u.id
      GROUP BY u.id
      ORDER BY total_bounty DESC, u.id ASC
    `;

    const monthlyResult = await client.query(monthlyBountyQuery, [currentYear, currentMonth]);
    
    // 插入月度排行数据
    let currentRank = 1;
    let previousBounty = null;
    
    for (let i = 0; i < monthlyResult.rows.length; i++) {
      const row = monthlyResult.rows[i];
      const currentBounty = parseFloat(row.total_bounty);
      
      if (previousBounty !== null && currentBounty !== previousBounty) {
        currentRank = i + 1;
      }
      
      await client.query(
        `INSERT INTO rankings (user_id, period, year, month, quarter, total_bounty, completed_tasks_count, rank)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          row.user_id,
          'monthly',
          currentYear,
          currentMonth,
          null,
          row.total_bounty,
          row.completed_tasks_count,
          currentRank,
        ]
      );
      
      previousBounty = currentBounty;
    }

    console.log(`Inserted ${monthlyResult.rows.length} monthly rankings`);

    // 计算季度排行
    const quarterlyBountyQuery = `
      SELECT
        u.id AS user_id,
        COALESCE(SUM(CASE
          WHEN t.status = 'completed'
            AND t.assignee_id IS NOT NULL
            AND EXTRACT(YEAR FROM COALESCE(t.actual_end_date, t.updated_at)) = $1
            AND EXTRACT(QUARTER FROM COALESCE(t.actual_end_date, t.updated_at)) = $2
          THEN t.bounty_amount ELSE 0 END), 0) AS total_bounty,
        COALESCE(SUM(CASE
          WHEN t.status = 'completed'
            AND t.assignee_id IS NOT NULL
            AND EXTRACT(YEAR FROM COALESCE(t.actual_end_date, t.updated_at)) = $1
            AND EXTRACT(QUARTER FROM COALESCE(t.actual_end_date, t.updated_at)) = $2
          THEN 1 ELSE 0 END), 0) AS completed_tasks_count
      FROM users u
      LEFT JOIN tasks t ON t.assignee_id = u.id
      GROUP BY u.id
      ORDER BY total_bounty DESC, u.id ASC
    `;

    const quarterlyResult = await client.query(quarterlyBountyQuery, [currentYear, currentQuarter]);
    
    // 插入季度排行数据
    currentRank = 1;
    previousBounty = null;
    
    for (let i = 0; i < quarterlyResult.rows.length; i++) {
      const row = quarterlyResult.rows[i];
      const currentBounty = parseFloat(row.total_bounty);
      
      if (previousBounty !== null && currentBounty !== previousBounty) {
        currentRank = i + 1;
      }
      
      await client.query(
        `INSERT INTO rankings (user_id, period, year, month, quarter, total_bounty, completed_tasks_count, rank)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          row.user_id,
          'quarterly',
          currentYear,
          null,
          currentQuarter,
          row.total_bounty,
          row.completed_tasks_count,
          currentRank,
        ]
      );
      
      previousBounty = currentBounty;
    }

    console.log(`Inserted ${quarterlyResult.rows.length} quarterly rankings`);

    // 计算全时排行
    const allTimeBountyQuery = `
      SELECT
        u.id AS user_id,
        COALESCE(SUM(CASE
          WHEN t.status = 'completed'
            AND t.assignee_id IS NOT NULL
          THEN t.bounty_amount ELSE 0 END), 0) AS total_bounty,
        COALESCE(SUM(CASE
          WHEN t.status = 'completed'
            AND t.assignee_id IS NOT NULL
          THEN 1 ELSE 0 END), 0) AS completed_tasks_count
      FROM users u
      LEFT JOIN tasks t ON t.assignee_id = u.id
      GROUP BY u.id
      ORDER BY total_bounty DESC, u.id ASC
    `;

    const allTimeResult = await client.query(allTimeBountyQuery);
    
    // 插入全时排行数据
    currentRank = 1;
    previousBounty = null;
    
    for (let i = 0; i < allTimeResult.rows.length; i++) {
      const row = allTimeResult.rows[i];
      const currentBounty = parseFloat(row.total_bounty);
      
      if (previousBounty !== null && currentBounty !== previousBounty) {
        currentRank = i + 1;
      }
      
      await client.query(
        `INSERT INTO rankings (user_id, period, year, month, quarter, total_bounty, completed_tasks_count, rank)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          row.user_id,
          'all_time',
          currentYear,
          null,
          null,
          row.total_bounty,
          row.completed_tasks_count,
          currentRank,
        ]
      );
      
      previousBounty = currentBounty;
    }

    console.log(`Inserted ${allTimeResult.rows.length} all-time rankings`);

    await client.query('COMMIT');
    console.log('Rankings calculation completed successfully!');

    // 验证结果
    const verifyResult = await client.query(
      "SELECT COUNT(*) as count FROM rankings WHERE period = 'monthly' AND year = $1 AND month = $2",
      [currentYear, currentMonth]
    );
    console.log(`Current month rankings count: ${verifyResult.rows[0].count}`);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error calculating rankings:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

calculateCurrentRankings().catch(console.error);