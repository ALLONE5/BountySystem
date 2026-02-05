
import { pool } from '../src/config/database';
import { config } from '../src/config/env';

async function listTables() {
  console.log(`Connecting to database: ${config.database.database}`);
  try {
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    console.log('Tables:', result.rows.map(r => r.table_name));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

listTables();
