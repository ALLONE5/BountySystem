
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
  port: parseInt(process.env.DB_PORT || '5432'),
});

async function fixDeveloper2Bounty() {
  try {
    console.log('--- Fixing Developer2 Bounty ---');

    const taskId = 'e266dd76-ec16-4d05-bbb3-e0459ae8735f';
    const developer2Id = 'ad7c9955-c7ef-4be0-8f46-c9214b48fde1';

    // Update task
    await pool.query(`
      UPDATE tasks 
      SET assignee_id = $1, status = 'completed', actual_end_date = NOW()
      WHERE id = $2
    `, [developer2Id, taskId]);
    
    console.log(`Updated task ${taskId} to be completed by developer2.`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

fixDeveloper2Bounty();
