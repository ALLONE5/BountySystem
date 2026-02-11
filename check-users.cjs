const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'packages/backend/.env') });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'task_management',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function checkUsers() {
  const client = await pool.connect();
  
  try {
    console.log('📋 Checking available users...\n');
    
    const query = `
      SELECT id, username, email, role, created_at
      FROM users 
      WHERE role IN ('super_admin', 'position_admin')
      ORDER BY created_at DESC
      LIMIT 5
    `;
    
    const result = await client.query(query);
    
    if (result.rows.length === 0) {
      console.log('❌ No admin users found');
    } else {
      console.log(`✅ Found ${result.rows.length} admin user(s):`);
      result.rows.forEach((user, index) => {
        console.log(`${index + 1}. Username: ${user.username}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Created: ${user.created_at}`);
        console.log('   ---');
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkUsers();