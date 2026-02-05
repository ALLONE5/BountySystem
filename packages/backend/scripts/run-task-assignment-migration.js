import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'bounty_hunter',
  user: 'postgres',
  password: '123456',
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('Running task assignment migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '../../database/migrations/20260203_000001_add_task_assignment_fields.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the migration
    await client.query(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
  } catch (error) {
    if (error.code === '42701') {
      console.log('⚠️  Columns already exist, skipping migration');
    } else {
      console.error('❌ Migration failed:', error.message);
      throw error;
    }
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch(console.error);
