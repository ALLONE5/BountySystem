import { pool } from '../src/config/database';
import { randomUUID } from 'crypto';

async function main() {
  try {
    console.log('Starting project group injection script...');

    // 1) Create project_groups table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS project_groups (
        id uuid PRIMARY KEY,
        name text NOT NULL,
        description text,
        created_at timestamptz DEFAULT now()
      );
    `);
    console.log('Ensured project_groups table exists.');

    // 2) Add column to tasks table if not exists
    await pool.query(`
      ALTER TABLE tasks
      ADD COLUMN IF NOT EXISTS project_group_id uuid NULL;
    `);
    console.log('Ensured tasks.project_group_id column exists.');

    // 3) Insert sample project groups
    const pg1 = randomUUID();
    const pg2 = randomUUID();

    await pool.query(
      'INSERT INTO project_groups (id, name, description) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
      [pg1, 'Project Alpha', 'Sample project group Alpha']
    );
    await pool.query(
      'INSERT INTO project_groups (id, name, description) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
      [pg2, 'Project Beta', 'Sample project group Beta']
    );

    console.log('Inserted sample project groups:', pg1, pg2);

    // 4) Grab a few existing tasks to assign to project groups
    const res = await pool.query('SELECT id, name FROM tasks ORDER BY created_at DESC LIMIT 6');
    const tasks = res.rows;
    console.log('Found tasks to assign:', tasks.map(t => t.id));

    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      const assignTo = i % 2 === 0 ? pg1 : pg2;
      await pool.query('UPDATE tasks SET project_group_id = $1 WHERE id = $2', [assignTo, task.id]);
      console.log(`Assigned task ${task.id} (${task.name}) to project ${assignTo}`);
    }

    console.log('Finished assigning sample tasks to project groups.');
  } catch (err) {
    console.error('Error during injection:', err);
  } finally {
    await pool.end();
  }
}

main();
