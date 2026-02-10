const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'bounty_hunter',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '123456',
});

async function diagnoseAdminBounty() {
  try {
    console.log('=== Admin Bounty Diagnosis ===\n');

    // 1. Get admin user info
    const adminQuery = `
      SELECT id, username, email, balance
      FROM users
      WHERE username = 'admin'
    `;
    const adminResult = await pool.query(adminQuery);
    
    if (adminResult.rows.length === 0) {
      console.log('❌ Admin user not found');
      return;
    }
    
    const admin = adminResult.rows[0];
    console.log('1. Admin User Info:');
    console.log(`   ID: ${admin.id}`);
    console.log(`   Username: ${admin.username}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Balance: $${admin.balance}`);
    console.log('');

    // 2. Check completed tasks for current month (February 2026)
    const tasksQuery = `
      SELECT 
        id,
        name,
        status,
        bounty_amount,
        actual_end_date,
        updated_at,
        EXTRACT(YEAR FROM COALESCE(actual_end_date, updated_at)) as year,
        EXTRACT(MONTH FROM COALESCE(actual_end_date, updated_at)) as month
      FROM tasks
      WHERE assignee_id = $1
        AND status = 'completed'
      ORDER BY COALESCE(actual_end_date, updated_at) DESC
    `;
    const tasksResult = await pool.query(tasksQuery, [admin.id]);
    
    console.log(`2. All Completed Tasks (${tasksResult.rows.length} total):`);
    
    let totalAllTime = 0;
    let totalFeb2026 = 0;
    let countFeb2026 = 0;
    
    tasksResult.rows.forEach((task, index) => {
      const bounty = parseFloat(task.bounty_amount);
      totalAllTime += bounty;
      
      const year = parseInt(task.year);
      const month = parseInt(task.month);
      const isFeb2026 = year === 2026 && month === 2;
      
      if (isFeb2026) {
        totalFeb2026 += bounty;
        countFeb2026++;
      }
      
      console.log(`   ${index + 1}. ${task.name}`);
      console.log(`      Status: ${task.status}`);
      console.log(`      Bounty: $${bounty}`);
      console.log(`      Date: ${task.actual_end_date || task.updated_at}`);
      console.log(`      Year/Month: ${year}/${month} ${isFeb2026 ? '✓ Feb 2026' : ''}`);
      console.log('');
    });
    
    console.log(`   Total All-Time Bounty: $${totalAllTime.toFixed(2)}`);
    console.log(`   Total Feb 2026 Bounty: $${totalFeb2026.toFixed(2)} (${countFeb2026} tasks)`);
    console.log('');

    // 3. Check rankings table
    const rankingsQuery = `
      SELECT 
        period,
        year,
        month,
        quarter,
        total_bounty,
        completed_tasks_count,
        rank,
        calculated_at
      FROM rankings
      WHERE user_id = $1
      ORDER BY 
        CASE period
          WHEN 'monthly' THEN 1
          WHEN 'quarterly' THEN 2
          WHEN 'all_time' THEN 3
        END,
        year DESC,
        month DESC,
        quarter DESC
    `;
    const rankingsResult = await pool.query(rankingsQuery, [admin.id]);
    
    console.log(`3. Rankings Table (${rankingsResult.rows.length} records):`);
    rankingsResult.rows.forEach((ranking, index) => {
      console.log(`   ${index + 1}. Period: ${ranking.period}`);
      console.log(`      Year: ${ranking.year}, Month: ${ranking.month || 'N/A'}, Quarter: ${ranking.quarter || 'N/A'}`);
      console.log(`      Total Bounty: $${parseFloat(ranking.total_bounty).toFixed(2)}`);
      console.log(`      Completed Tasks: ${ranking.completed_tasks_count}`);
      console.log(`      Rank: ${ranking.rank}`);
      console.log(`      Calculated At: ${ranking.calculated_at}`);
      console.log('');
    });

    // 4. Check bounty transactions
    const transactionsQuery = `
      SELECT 
        id,
        amount,
        transaction_type,
        task_id,
        created_at,
        EXTRACT(YEAR FROM created_at) as year,
        EXTRACT(MONTH FROM created_at) as month
      FROM bounty_transactions
      WHERE to_user_id = $1
      ORDER BY created_at DESC
    `;
    const transactionsResult = await pool.query(transactionsQuery, [admin.id]);
    
    console.log(`4. Bounty Transactions (${transactionsResult.rows.length} total):`);
    
    let transactionTotalFeb2026 = 0;
    let transactionCountFeb2026 = 0;
    
    transactionsResult.rows.forEach((tx, index) => {
      const amount = parseFloat(tx.amount);
      const isFeb2026 = tx.year === 2026 && tx.month === 2;
      
      if (isFeb2026) {
        transactionTotalFeb2026 += amount;
        transactionCountFeb2026++;
      }
      
      console.log(`   ${index + 1}. Amount: $${amount}`);
      console.log(`      Type: ${tx.transaction_type}`);
      console.log(`      Task ID: ${tx.task_id || 'N/A'}`);
      console.log(`      Date: ${tx.created_at}`);
      console.log(`      Year/Month: ${tx.year}/${tx.month} ${isFeb2026 ? '✓ Feb 2026' : ''}`);
      console.log('');
    });
    
    console.log(`   Total Feb 2026 Transactions: $${transactionTotalFeb2026.toFixed(2)} (${transactionCountFeb2026} transactions)`);
    console.log('');

    // 5. Summary
    console.log('=== SUMMARY ===');
    console.log(`User Balance: $${admin.balance}`);
    console.log(`Completed Tasks (Feb 2026): ${countFeb2026} tasks, $${totalFeb2026.toFixed(2)}`);
    console.log(`Bounty Transactions (Feb 2026): ${transactionCountFeb2026} transactions, $${transactionTotalFeb2026.toFixed(2)}`);
    
    const feb2026Ranking = rankingsResult.rows.find(r => 
      r.period === 'monthly' && r.year === 2026 && r.month === 2
    );
    
    if (feb2026Ranking) {
      const rankingBounty = parseFloat(feb2026Ranking.total_bounty);
      console.log(`Ranking Table (Feb 2026): $${rankingBounty.toFixed(2)}`);
      console.log('');
      
      if (rankingBounty !== totalFeb2026) {
        console.log('⚠️  DISCREPANCY FOUND!');
        console.log(`   Expected: $${totalFeb2026.toFixed(2)} (from completed tasks)`);
        console.log(`   Actual: $${rankingBounty.toFixed(2)} (in rankings table)`);
        console.log(`   Difference: $${(totalFeb2026 - rankingBounty).toFixed(2)}`);
      } else {
        console.log('✓ Rankings match completed tasks');
      }
    } else {
      console.log('❌ No Feb 2026 ranking found');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

diagnoseAdminBounty();
