const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'bounty_hunter',
  user: 'postgres',
  password: '123456',
});

async function seedTransactions() {
  try {
    console.log('Seeding bounty transactions...\n');
    
    // Get some users
    const usersResult = await pool.query(`
      SELECT id, username FROM users 
      WHERE username IN ('admin', 'user1', 'user2', 'developer1', 'developer2')
      LIMIT 5
    `);
    
    if (usersResult.rows.length < 2) {
      console.log('Not enough users found. Need at least 2 users.');
      console.log('Available users:', usersResult.rows);
      return;
    }
    
    const users = usersResult.rows;
    console.log('Found users:');
    console.table(users);
    
    // Get some tasks
    const tasksResult = await pool.query(`
      SELECT id, name FROM tasks 
      LIMIT 5
    `);
    
    console.log('\nFound tasks:');
    console.table(tasksResult.rows);
    
    // Create sample transactions
    const transactions = [];
    const types = ['task_completion', 'extra_reward', 'assistant_share', 'refund'];
    
    // Create transactions for each user
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      
      // User receives bounty (incoming)
      for (let j = 0; j < 3; j++) {
        const fromUser = users[(i + j + 1) % users.length];
        const task = tasksResult.rows[j % tasksResult.rows.length];
        const amount = (j + 1) * 100;
        const type = types[j % types.length];
        
        transactions.push({
          taskId: task ? task.id : null,
          fromUserId: fromUser.id,
          toUserId: user.id,
          amount,
          type,
          description: `${type} - ${amount} bounty`,
        });
      }
      
      // User sends bounty (outgoing)
      for (let j = 0; j < 2; j++) {
        const toUser = users[(i + j + 1) % users.length];
        const task = tasksResult.rows[(j + 1) % tasksResult.rows.length];
        const amount = (j + 1) * 50;
        const type = types[(j + 2) % types.length];
        
        transactions.push({
          taskId: task ? task.id : null,
          fromUserId: user.id,
          toUserId: toUser.id,
          amount,
          type,
          description: `${type} - ${amount} bounty`,
        });
      }
    }
    
    console.log(`\nCreating ${transactions.length} transactions...`);
    
    // Insert transactions
    for (const tx of transactions) {
      await pool.query(`
        INSERT INTO bounty_transactions (
          task_id, from_user_id, to_user_id, amount, type, description, status
        ) VALUES ($1, $2, $3, $4, $5, $6, 'completed')
      `, [tx.taskId, tx.fromUserId, tx.toUserId, tx.amount, tx.type, tx.description]);
    }
    
    console.log('✓ Transactions created successfully!');
    
    // Verify
    const countResult = await pool.query('SELECT COUNT(*) FROM bounty_transactions');
    console.log(`\nTotal transactions in database: ${countResult.rows[0].count}`);
    
    // Show sample for each user
    for (const user of users) {
      const userTxResult = await pool.query(`
        SELECT 
          CASE 
            WHEN to_user_id = $1 THEN 'RECEIVED'
            ELSE 'SENT'
          END as direction,
          amount,
          type,
          description
        FROM bounty_transactions
        WHERE from_user_id = $1 OR to_user_id = $1
        ORDER BY created_at DESC
        LIMIT 3
      `, [user.id]);
      
      console.log(`\nTransactions for ${user.username}:`);
      console.table(userTxResult.rows);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

seedTransactions();
