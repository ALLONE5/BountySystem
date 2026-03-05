const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'bounty_hunter',
  user: 'postgres',
  password: '123456'
});

async function checkTables() {
  try {
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('Available tables:');
    result.rows.forEach(row => {
      console.log('-', row.table_name);
    });
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkTables();