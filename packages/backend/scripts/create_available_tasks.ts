
import { pool } from '../src/config/database';
import { config } from '../src/config/env';

async function createAvailableTasks() {
  console.log('Creating available tasks...');
  
  try {
    const userResult = await pool.query(`SELECT id FROM users WHERE username = 'admin'`);
    const adminId = userResult.rows[0].id;

    const tasks = [
      { name: 'Fix Login Bug', description: 'Fix the login issue on mobile', bounty: 500 },
      { name: 'Update Documentation', description: 'Update API docs', bounty: 200 },
      { name: 'Optimize Database', description: 'Add indexes to users table', bounty: 1000 },
      { name: 'Design Logo', description: 'Create a new logo for the app', bounty: 300 },
      { name: 'Write Tests', description: 'Add unit tests for auth service', bounty: 400 }
    ];

    for (const task of tasks) {
      await pool.query(`
        INSERT INTO tasks (
          name, description, is_executable, status, visibility, 
          bounty_amount, publisher_id, created_at, updated_at
        ) VALUES (
          $1, $2, true, 'available', 'public', 
          $3, $4, NOW(), NOW()
        )
      `, [task.name, task.description, task.bounty, adminId]);
    }

    console.log(`✅ Created ${tasks.length} available tasks.`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

createAvailableTasks();
