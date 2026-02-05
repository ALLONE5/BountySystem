import pg from 'pg';
import bcrypt from 'bcrypt';
const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '123456',
  database: process.env.DB_NAME || 'bounty_hunter'
});

async function resetTestUserPasswords() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('🔧 重置测试用户密码...\n');

    const testPassword = 'Password123';
    const passwordHash = await bcrypt.hash(testPassword, 10);
    
    const testUsers = ['admin', 'developer1', 'developer2', 'designer1', 'manager1'];
    
    for (const username of testUsers) {
      const result = await client.query(`
        UPDATE users 
        SET password_hash = $1 
        WHERE username = $2
        RETURNING id, username
      `, [passwordHash, username]);
      
      if (result.rows.length > 0) {
        console.log(`✓ 重置密码: ${username}`);
      } else {
        console.log(`⚠ 用户不存在: ${username}`);
      }
    }
    
    await client.query('COMMIT');
    
    console.log('\n✅ 所有测试用户密码已重置为: Password123');
    console.log('\n📋 测试账号:');
    testUsers.forEach(user => {
      console.log(`  - ${user} / Password123`);
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 错误:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

resetTestUserPasswords().catch(console.error);
