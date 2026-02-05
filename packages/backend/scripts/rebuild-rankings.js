import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'bounty_hunter',
  password: process.env.DB_PASSWORD || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432', 10),
});

async function rebuild(period, { year, month = null, quarter = null }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let dateFilter = '';
    const params = [];
    let paramIndex = 1;

    if (period === 'monthly') {
      dateFilter = `AND EXTRACT(YEAR FROM t.actual_end_date) = $${paramIndex++} AND EXTRACT(MONTH FROM t.actual_end_date) = $${paramIndex++}`;
      params.push(year, month);
    } else if (period === 'quarterly') {
      dateFilter = `AND EXTRACT(YEAR FROM t.actual_end_date) = $${paramIndex++} AND EXTRACT(QUARTER FROM t.actual_end_date) = $${paramIndex++}`;
      params.push(year, quarter);
    }

    const bountyQuery = `
      SELECT
        u.id AS user_id,
        COALESCE(SUM(CASE
          WHEN t.status = 'completed'
            AND t.assignee_id IS NOT NULL
            ${dateFilter}
          THEN t.bounty_amount ELSE 0 END), 0) AS total_bounty,
        COALESCE(SUM(CASE
          WHEN t.status = 'completed'
            AND t.assignee_id IS NOT NULL
            ${dateFilter}
          THEN 1 ELSE 0 END), 0) AS completed_tasks_count
      FROM users u
      LEFT JOIN tasks t ON t.assignee_id = u.id
      GROUP BY u.id
      ORDER BY total_bounty DESC, u.id ASC
    `;

    const bountyResult = await client.query(bountyQuery, params);

    // build delete params
    const deleteParams = [period, year];
    let deleteClause = '';
    if (period === 'monthly') {
      deleteParams.push(month);
      deleteClause = 'AND month = $3';
    } else if (period === 'quarterly') {
      deleteParams.push(quarter);
      deleteClause = 'AND quarter = $3';
    }

    await client.query(`
      DELETE FROM rankings
      WHERE period = $1
        AND year = $2
        ${deleteClause}
    `, deleteParams);

    for (let i = 0; i < bountyResult.rows.length; i++) {
      const row = bountyResult.rows[i];
      const rank = i + 1;
      await client.query(`
        INSERT INTO rankings (user_id, period, year, month, quarter, total_bounty, completed_tasks_count, rank)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        row.user_id,
        period,
        year,
        month,
        quarter,
        row.total_bounty,
        row.completed_tasks_count,
        rank,
      ]);
    }

    await client.query('COMMIT');
    console.log(`Rebuilt ${period} rankings`, bountyResult.rows.map(r => ({ user_id: r.user_id, total_bounty: r.total_bounty })));
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(`Failed to rebuild ${period} rankings`, err);
  } finally {
    client.release();
  }
}

async function main() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const quarter = Math.floor((now.getMonth()) / 3) + 1;

  await rebuild('monthly', { year, month });
  await rebuild('quarterly', { year, quarter });
  await rebuild('all_time', { year });

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
