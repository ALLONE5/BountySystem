import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { TaskService } from '../src/services/TaskService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function verifyData() {
  console.log('Verifying TaskService data...');
  
  const taskService = new TaskService();
  
  // We need a user ID to test getTasksByUser
  // Let's fetch the same user1 we used before (designer1)
  const { Pool } = pg;
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'bounty_hunter',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });
  
  const client = await pool.connect();
  try {
    const userRes = await client.query("SELECT id FROM users WHERE username = 'designer1'");
    if (userRes.rows.length === 0) {
      console.log('User designer1 not found, skipping verification.');
      return;
    }
    const userId = userRes.rows[0].id;
    
    console.log(`Fetching tasks for user: ${userId}`);
    
    // Test getTasksByUser with onlyTopLevel=true
    const tasks = await taskService.getTasksByUser(userId, 'assignee', true);
    
    console.log(`Found ${tasks.length} top-level assigned tasks.`);
    
    tasks.forEach(t => {
      console.log(`Task: ${t.name} (ID: ${t.id})`);
      console.log(`  - Group: ${t.groupName || 'None'}`);
      console.log(`  - Parent: ${t.parentId || 'None'}`);
      console.log(`  - Assignee: ${t.assignee ? t.assignee.username : 'None'}`);
    });

    // Check if we can find the group task we created
    const groupTask = tasks.find(t => t.name === 'Requirement Analysis');
    if (groupTask) {
        console.log('SUCCESS: Found "Requirement Analysis" task.');
    } else {
        // Wait, "Requirement Analysis" is a subtask assigned to user1.
        // If onlyTopLevel=true, and the parent "Alpha Project Phase 1" is assigned to Group (not user),
        // then "Requirement Analysis" (assigned to user) IS a top-level assignment FOR THE USER?
        // Let's check the logic in TaskService.ts:
        // LEFT JOIN tasks p ON t.parent_id = p.id
        // WHERE t.assignee_id = $1
        // AND (t.parent_id IS NULL OR p.assignee_id IS DISTINCT FROM $1)
        
        // Parent "Alpha Project Phase 1" assignee_id is NULL (it's assigned to group_id).
        // So p.assignee_id IS DISTINCT FROM user1.id.
        // So "Requirement Analysis" SHOULD appear.
        console.log('Checking for "Requirement Analysis"...');
    }

  } catch (err) {
    console.error('Verification failed:', err);
  } finally {
    client.release();
    await pool.end();
    // TaskService uses its own pool, we might need to close it if we could access it, 
    // but it imports 'pool' from config. 
    // Since we are running in a script, we can just exit.
    process.exit(0);
  }
}

verifyData();
