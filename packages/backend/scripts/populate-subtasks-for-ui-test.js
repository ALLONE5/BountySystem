import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'bounty_hunter',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function populateSubtasks() {
  const client = await pool.connect();
  try {
    console.log('Connected to database...');

    // 1. Get the target task
    const taskName = '改进任务详情页面体验';
    const taskRes = await client.query("SELECT id, publisher_id, group_id, bounty_amount FROM tasks WHERE name = $1", [taskName]);
    
    if (taskRes.rows.length === 0) {
      console.error(`Task "${taskName}" not found.`);
      return;
    }
    
    const parentTask = taskRes.rows[0];
    console.log(`Found parent task: ${taskName} (ID: ${parentTask.id})`);

    // 2. Get some users for assignment
    // We want users who are likely in the group "体验设计组" if possible, or just any users.
    // Let's check group members first.
    let assignees = [];
    if (parentTask.group_id) {
        const membersRes = await client.query("SELECT user_id FROM group_members WHERE group_id = $1", [parentTask.group_id]);
        if (membersRes.rows.length > 0) {
            assignees = membersRes.rows.map(r => r.user_id);
            console.log(`Found ${assignees.length} members in the group.`);
        }
    }

    // Fallback to fetching any users if no group members found (unlikely if data is correct)
    if (assignees.length === 0) {
        const usersRes = await client.query("SELECT id FROM users LIMIT 3");
        assignees = usersRes.rows.map(r => r.id);
    }

    const user1 = assignees[0];
    const user2 = assignees[1] || assignees[0];

    // 3. Create Subtasks
    console.log('Creating subtasks...');

    // Subtask 1
    await client.query(`
      INSERT INTO tasks (
        name, description, status, priority, complexity, estimated_hours, 
        bounty_amount, publisher_id, assignee_id, parent_id, depth, is_executable, visibility, group_id
      ) VALUES (
        $1, $2, 'in_progress', 4, 2, 4, 
        200, $3, $4, $5, 1, true, 'public', $6
      )
    `, ['UI Mockup Design', 'Design the new layout in Figma', parentTask.publisher_id, user1, parentTask.id, parentTask.group_id]);

    // Subtask 2
    await client.query(`
      INSERT INTO tasks (
        name, description, status, priority, complexity, estimated_hours, 
        bounty_amount, publisher_id, assignee_id, parent_id, depth, is_executable, visibility, group_id
      ) VALUES (
        $1, $2, 'not_started', 3, 3, 8, 
        400, $3, $4, $5, 1, true, 'public', $6
      )
    `, ['Frontend Implementation', 'Implement the React components', parentTask.publisher_id, user2, parentTask.id, parentTask.group_id]);

    // Subtask 3
    await client.query(`
      INSERT INTO tasks (
        name, description, status, priority, complexity, estimated_hours, 
        bounty_amount, publisher_id, assignee_id, parent_id, depth, is_executable, visibility, group_id
      ) VALUES (
        $1, $2, 'not_started', 2, 1, 2, 
        100, $3, $4, $5, 1, true, 'public', $6
      )
    `, ['User Testing', 'Verify the new design with users', parentTask.publisher_id, user1, parentTask.id, parentTask.group_id]);

    // 4. Update Parent Task
    // Set is_executable to false since it now has subtasks
    await client.query("UPDATE tasks SET is_executable = false WHERE id = $1", [parentTask.id]);

    console.log('Subtasks created successfully!');

  } catch (err) {
    console.error('Error populating subtasks:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

populateSubtasks();
