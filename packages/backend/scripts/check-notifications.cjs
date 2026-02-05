const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'bounty_hunter',
  user: 'postgres',
  password: '123456',
});

async function checkNotifications() {
  try {
    console.log('Checking review_required notifications...\n');
    
    // Get sample notifications
    const result = await pool.query(`
      SELECT 
        n.id,
        n.user_id,
        n.type,
        n.title,
        n.message,
        n.is_read,
        n.created_at,
        n.related_task_id
      FROM notifications n
      WHERE n.type = 'review_required'
      ORDER BY n.created_at DESC
      LIMIT 10
    `);
    
    console.log(`Total review_required notifications: ${result.rowCount}`);
    console.log(`\nSample notifications (showing 10 most recent):\n`);
    result.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.title}`);
      console.log(`   Message: ${row.message}`);
      console.log(`   Read: ${row.is_read}`);
      console.log(`   Created: ${row.created_at.toISOString()}`);
      console.log(`   Related Task: ${row.related_task_id || 'None'}`);
      console.log('');
    });
    
    // Check read vs unread
    const readStats = await pool.query(`
      SELECT 
        is_read,
        COUNT(*) as count
      FROM notifications
      WHERE type = 'review_required'
      GROUP BY is_read
    `);
    
    console.log('Read status:');
    readStats.rows.forEach(row => {
      console.log(`  ${row.is_read ? 'Read' : 'Unread'}: ${row.count}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkNotifications();
