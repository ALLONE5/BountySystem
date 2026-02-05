
import { pool } from '../src/config/database';
import bcrypt from 'bcrypt';

async function resetAdminPassword() {
  try {
    console.log('Resetting admin password...');
    const password = 'Password123';
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const result = await pool.query(`
      UPDATE users 
      SET password_hash = $1 
      WHERE username = 'admin'
      RETURNING id, username
    `, [hashedPassword]);
    
    if (result.rows.length > 0) {
      console.log('✅ Password for user "admin" has been reset to "Password123".');
    } else {
      console.log('❌ User "admin" not found.');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

resetAdminPassword();
