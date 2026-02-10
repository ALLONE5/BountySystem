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

async function checkBonusRewards() {
  const client = await pool.connect();
  
  try {
    console.log('Checking bonus rewards in database...\n');
    
    // Check all bonus reward transactions
    const bonusQuery = `
      SELECT 
        bt.id,
        bt.task_id,
        bt.from_user_id,
        bt.to_user_id,
        bt.amount,
        bt.type,
        bt.description,
        bt.created_at,
        u.username as admin_username
      FROM bounty_transactions bt
      LEFT JOIN users u ON bt.from_user_id = u.id
      WHERE bt.type = 'extra_reward'
      ORDER BY bt.created_at DESC
    `;
    
    const bonusResult = await client.query(bonusQuery);
    
    if (bonusResult.rows.length === 0) {
      console.log('No bonus rewards found in database.');
    } else {
      console.log(`Found ${bonusResult.rows.length} bonus reward(s):`);
      console.log('─'.repeat(100));
      
      bonusResult.rows.forEach((reward, index) => {
        console.log(`${index + 1}. Task ID: ${reward.task_id}`);
        console.log(`   Admin: ${reward.admin_username || 'Unknown'} (ID: ${reward.from_user_id})`);
        console.log(`   Amount: $${reward.amount}`);
        console.log(`   Description: ${reward.description}`);
        console.log(`   Created: ${reward.created_at}`);
        console.log('─'.repeat(50));
      });
    }
    
    // Check for duplicate rewards (same admin, same task)
    const duplicateQuery = `
      SELECT 
        task_id,
        from_user_id,
        COUNT(*) as count,
        STRING_AGG(id::text, ', ') as transaction_ids
      FROM bounty_transactions 
      WHERE type = 'extra_reward' AND from_user_id IS NOT NULL
      GROUP BY task_id, from_user_id
      HAVING COUNT(*) > 1
    `;
    
    const duplicateResult = await client.query(duplicateQuery);
    
    if (duplicateResult.rows.length > 0) {
      console.log('\n🚨 Found duplicate bonus rewards:');
      console.log('─'.repeat(100));
      
      duplicateResult.rows.forEach((dup, index) => {
        console.log(`${index + 1}. Task ID: ${dup.task_id}, Admin ID: ${dup.from_user_id}`);
        console.log(`   Count: ${dup.count} rewards`);
        console.log(`   Transaction IDs: ${dup.transaction_ids}`);
        console.log('─'.repeat(50));
      });
    } else {
      console.log('\n✅ No duplicate bonus rewards found.');
    }
    
  } catch (error) {
    console.error('❌ Error checking bonus rewards:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkBonusRewards().catch(console.error);