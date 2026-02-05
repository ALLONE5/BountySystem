import { Client } from 'pg';

async function main() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '123456',
    database: process.env.DB_NAME || 'bounty_hunter'
  });

  try {
    await client.connect();
    console.log('Connected to database');

    console.log('\n--- Project Groups ---');
    const groups = await client.query('SELECT * FROM project_groups');
    console.table(groups.rows);

    console.log('\n--- Tasks with Project Groups ---');
    const tasks = await client.query(`
      SELECT t.name as task_name, pg.name as project_group_name 
      FROM tasks t 
      JOIN project_groups pg ON t.project_group_id = pg.id
      ORDER BY pg.name, t.name
    `);
    console.table(tasks.rows);

  } catch (e) {
    console.error('Verify error:', e);
  } finally {
    await client.end();
  }
}

main();
