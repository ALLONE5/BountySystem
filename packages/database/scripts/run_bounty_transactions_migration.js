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
  password: 'postgres',
});

async function runMigration() {
  try {
    const migrationPath = path.join(__dirname, '../migrations/20241211_000001_create_bounty_transactions.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('Running bounty transactions migration...');
    await pool.query(sql);
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
