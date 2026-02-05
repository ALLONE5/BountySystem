import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from packages/backend/.env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'bounty_hunter',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function populateData() {
  const client = await pool.connect();
  try {
    console.log('Connected to database...');

    // 1. Get some users
    const usersRes = await client.query('SELECT id, username FROM users LIMIT 5');
    if (usersRes.rows.length < 2) {
      console.error('Not enough users in database. Please create at least 2 users first.');
      return;
    }
    const users = usersRes.rows;
    const user1 = users[0];
    const user2 = users[1];
    const user3 = users[2] || users[0]; // Fallback if only 2 users

    console.log(`Using users: ${user1.username}, ${user2.username}`);

    // 2. Create Groups
    console.log('Creating groups...');
    const group1Res = await client.query(`
      INSERT INTO task_groups (name, creator_id) 
      VALUES ($1, $2) 
      RETURNING id, name
    `, ['Alpha Squad ' + Date.now(), user1.id]);
    const group1 = group1Res.rows[0];

    const group2Res = await client.query(`
      INSERT INTO task_groups (name, creator_id) 
      VALUES ($1, $2) 
      RETURNING id, name
    `, ['Beta Team ' + Date.now(), user2.id]);
    const group2 = group2Res.rows[0];

    // 3. Add members to groups
    console.log('Adding members to groups...');
    // Add user1 and user2 to Group 1
    await client.query(`
      INSERT INTO group_members (group_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING
    `, [group1.id, user1.id]);
    await client.query(`
      INSERT INTO group_members (group_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING
    `, [group1.id, user2.id]);

    // Add user2 and user3 to Group 2
    await client.query(`
      INSERT INTO group_members (group_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING
    `, [group2.id, user2.id]);
    if (user3.id !== user2.id) {
      await client.query(`
        INSERT INTO group_members (group_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING
      `, [group2.id, user3.id]);
    }

    // 4. Create Group Tasks
    console.log('Creating group tasks...');
    
    // Task 1: Assigned to Group 1
    const task1Res = await client.query(`
      INSERT INTO tasks (
        name, description, status, priority, complexity, estimated_hours, 
        bounty_amount, publisher_id, group_id, is_executable, visibility
      ) VALUES (
        $1, $2, 'in_progress', 4, 3, 20, 
        1000, $3, $4, false, 'public'
      ) RETURNING id
    `, ['Alpha Project Phase 1', 'Main project for Alpha Squad', user1.id, group1.id]);
    const task1Id = task1Res.rows[0].id;

    // Subtask 1.1: Assigned to User 1 (in Group 1)
    await client.query(`
      INSERT INTO tasks (
        name, description, status, priority, complexity, estimated_hours, 
        bounty_amount, publisher_id, assignee_id, parent_id, depth, is_executable, visibility
      ) VALUES (
        $1, $2, 'in_progress', 3, 2, 8, 
        400, $3, $4, $5, 1, true, 'public'
      )
    `, ['Requirement Analysis', 'Analyze requirements for Alpha', user1.id, user1.id, task1Id]);

    // Subtask 1.2: Unassigned (Available to Group 1)
    // Note: If parent is assigned to group, subtasks usually inherit group context implicitly or explicitly.
    // We'll assign group_id to subtask as well to make it clear it belongs to group context?
    // Or just parent_id is enough. Let's set group_id too for easier filtering if needed, though logic might rely on parent.
    await client.query(`
      INSERT INTO tasks (
        name, description, status, priority, complexity, estimated_hours, 
        bounty_amount, publisher_id, group_id, parent_id, depth, is_executable, visibility
      ) VALUES (
        $1, $2, 'available', 3, 3, 12, 
        600, $3, $4, $5, 1, true, 'public'
      )
    `, ['Database Design', 'Design DB schema for Alpha', user1.id, group1.id, task1Id]);


    // Task 2: Assigned to Group 2
    const task2Res = await client.query(`
      INSERT INTO tasks (
        name, description, status, priority, complexity, estimated_hours, 
        bounty_amount, publisher_id, group_id, is_executable, visibility
      ) VALUES (
        $1, $2, 'available', 5, 4, 40, 
        2000, $3, $4, false, 'public'
      ) RETURNING id
    `, ['Beta System Upgrade', 'Upgrade legacy system', user2.id, group2.id]);
    const task2Id = task2Res.rows[0].id;

    // Subtask 2.1: Assigned to User 2
    await client.query(`
      INSERT INTO tasks (
        name, description, status, priority, complexity, estimated_hours, 
        bounty_amount, publisher_id, assignee_id, parent_id, depth, is_executable, visibility
      ) VALUES (
        $1, $2, 'in_progress', 4, 3, 15, 
        800, $3, $4, $5, 1, true, 'public'
      )
    `, ['Legacy Code Audit', 'Audit old code', user2.id, user2.id, task2Id]);


    // 5. Create User Task with Subtasks (Hierarchy Test)
    console.log('Creating user hierarchy tasks...');
    const task3Res = await client.query(`
      INSERT INTO tasks (
        name, description, status, priority, complexity, estimated_hours, 
        bounty_amount, publisher_id, assignee_id, is_executable, visibility
      ) VALUES (
        $1, $2, 'in_progress', 3, 2, 10, 
        500, $3, $3, false, 'public'
      ) RETURNING id
    `, ['Personal Research', 'Research new tech', user1.id]);
    const task3Id = task3Res.rows[0].id;

    await client.query(`
      INSERT INTO tasks (
        name, description, status, priority, complexity, estimated_hours, 
        bounty_amount, publisher_id, assignee_id, parent_id, depth, is_executable, visibility
      ) VALUES (
        $1, $2, 'in_progress', 2, 1, 5, 
        250, $3, $3, $4, 1, true, 'public'
      )
    `, ['Read Documentation', 'Read React docs', user1.id, task3Id]);

    console.log('Data population complete!');
    console.log(`Created Group: ${group1.name} (ID: ${group1.id})`);
    console.log(`Created Group: ${group2.name} (ID: ${group2.id})`);
    console.log(`Created Task: Alpha Project Phase 1 (ID: ${task1Id})`);
    console.log(`Created Task: Beta System Upgrade (ID: ${task2Id})`);
    console.log(`Created Task: Personal Research (ID: ${task3Id})`);

  } catch (err) {
    console.error('Error populating data:', err);
  } finally {
    await client.release();
    await pool.end();
  }
}

populateData();
