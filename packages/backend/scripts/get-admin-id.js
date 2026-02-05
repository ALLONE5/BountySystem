import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'bounty_hunter',
  user: 'postgres',
  password: '123456'
});

async function getAdminId() {
  try {
    const result = await pool.query(`SELECT id, username, role FROM users WHERE username = 'admin' LIMIT 1`);
    if (result.rows.length > 0) {
      console.log('Admin user:', result.rows[0]);
    } else {
      console.log('Admin user not found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

getAdminId();
