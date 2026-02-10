const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'task_management',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function testDuplicateBonus() {
  const client = await pool.connect();
  
  try {
    console.log('Testing duplicate bonus prevention...\n');
    
    // Test with the task that has many bonus records
    const taskId = '94da9947-8b34-4407-8799-306117bd858b';
    const adminId = '5ac9b9ad-7c68-4b87-962d-9e8253d0111d'; // admin user
    
    console.log(`Task ID: ${taskId}`);
    console.log(`Admin ID: ${adminId}`);
    
    // Check existing bonus records for this admin and task
    const existingBonusQuery = `
      SELECT id, created_at, amount, description FROM bounty_transactions 
      WHERE task_id = $1 AND from_user_id = $2 AND type = 'extra_reward'
    `;
    const existingBonus = await client.query(existingBonusQuery, [taskId, adminId]);
    
    console.log(`\nExisting bonus records for this admin: ${existingBonus.rows.length}`);
    
    if (existingBonus.rows.length > 0) {
      console.log('Found existing bonus records:');
      existingBonus.rows.forEach((record, index) => {
        console.log(`  ${index + 1}. Amount: $${record.amount}, Created: ${record.created_at}`);
        console.log(`     Description: ${record.description}`);
      });
      console.log('\n✅ Duplicate prevention should BLOCK new bonus from this admin');
    } else {
      console.log('\n❌ No existing bonus records found - new bonus would be ALLOWED');
    }
    
    // Check all bonus records for this task
    const allBonusQuery = `
      SELECT from_user_id, COUNT(*) as count, STRING_AGG(amount::text, ', ') as amounts
      FROM bounty_transactions 
      WHERE task_id = $1 AND type = 'extra_reward'
      GROUP BY from_user_id
      ORDER BY count DESC
    `;
    const allBonus = await client.query(allBonusQuery, [taskId]);
    
    console.log(`\nAll bonus records for this task (grouped by admin):`);
    allBonus.rows.forEach((record, index) => {
      const adminLabel = record.from_user_id ? `Admin ID: ${record.from_user_id}` : 'Unknown Admin (null)';
      console.log(`  ${index + 1}. ${adminLabel} - ${record.count} bonus(es): $${record.amounts}`);
    });
    
  } catch (error) {
    console.error('❌ Error testing duplicate bonus:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

testDuplicateBonus().catch(console.error);