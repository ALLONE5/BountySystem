import { pool } from './src/config/database.js';

export default async function teardown() {
  // Close the database pool after all tests complete
  await pool.end();
  console.log('Database pool closed');
}
