const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'bounty_hunter',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function checkCompletedTasksBounty() {
  try {
    console.log('Checking completed tasks and their bounty transactions...\n');

    // Get all completed tasks
    const completedTasksQuery = `
      SELECT 
        t.id,
        t.name,
        t.status,
        t.bounty_amount,
        t.is_bounty_settled,
        t.assignee_id,
        u.username as assignee_username,
        t.updated_at
      FROM tasks t
      LEFT JOIN users u ON t.assignee_id = u.id
      WHERE t.status = 'completed'
      ORDER BY t.updated_at DESC
    `;

    const completedTasks = await pool.query(completedTasksQuery);
    console.log(`Found ${completedTasks.rows.length} completed tasks\n`);

    for (const task of completedTasks.rows) {
      console.log(`Task: ${task.name} (${task.id})`);
      console.log(`  Status: ${task.status}`);
      console.log(`  Bounty Amount: ${task.bounty_amount}`);
      console.log(`  Bounty Settled: ${task.is_bounty_settled}`);
      console.log(`  Assignee: ${task.assignee_username || 'None'} (${task.assignee_id || 'N/A'})`);
      console.log(`  Updated At: ${task.updated_at}`);

      // Check for bounty transactions
      const transactionsQuery = `
        SELECT 
          bt.id,
          bt.to_user_id,
          bt.amount,
          bt.type,
          bt.created_at,
          u.username
        FROM bounty_transactions bt
        LEFT JOIN users u ON bt.to_user_id = u.id
        WHERE bt.task_id = $1
        ORDER BY bt.created_at ASC
      `;

      const transactions = await pool.query(transactionsQuery, [task.id]);
      
      if (transactions.rows.length === 0) {
        console.log(`  ⚠️  NO BOUNTY TRANSACTIONS FOUND!`);
      } else {
        console.log(`  ✓ Found ${transactions.rows.length} bounty transaction(s):`);
        transactions.rows.forEach((tx) => {
          console.log(`    - ${tx.type}: ${tx.amount} to ${tx.username} (${tx.to_user_id})`);
          console.log(`      Created: ${tx.created_at}`);
        });
      }
      console.log('');
    }

    // Summary
    const settledCount = completedTasks.rows.filter(t => t.is_bounty_settled).length;
    const unsettledCount = completedTasks.rows.length - settledCount;

    console.log('\n=== SUMMARY ===');
    console.log(`Total Completed Tasks: ${completedTasks.rows.length}`);
    console.log(`Bounty Settled: ${settledCount}`);
    console.log(`Bounty NOT Settled: ${unsettledCount}`);

    if (unsettledCount > 0) {
      console.log('\n⚠️  WARNING: Some completed tasks do not have bounty settled!');
      console.log('These tasks need bounty distribution to be run manually.');
    }

  } catch (error) {
    console.error('Error checking completed tasks:', error);
  } finally {
    await pool.end();
  }
}

checkCompletedTasksBounty();
