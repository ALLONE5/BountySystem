const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'bounty_hunter',
  user: 'postgres',
  password: '123456',
});

async function cleanOrphanedNotifications() {
  try {
    console.log('Cleaning orphaned review_required notifications...\n');
    
    // Count before
    const beforeCount = await pool.query(`
      SELECT COUNT(*) as count 
      FROM notifications 
      WHERE type = 'review_required'
    `);
    console.log(`Notifications before cleanup: ${beforeCount.rows[0].count}`);
    
    // Delete orphaned notifications
    // Since there are no position_applications at all, we can safely delete all review_required notifications
    const result = await pool.query(`
      DELETE FROM notifications
      WHERE type = 'review_required'
      RETURNING id
    `);
    
    console.log(`Deleted ${result.rowCount} orphaned notifications`);
    
    // Count after
    const afterCount = await pool.query(`
      SELECT COUNT(*) as count 
      FROM notifications 
      WHERE type = 'review_required'
    `);
    console.log(`Notifications after cleanup: ${afterCount.rows[0].count}`);
    
    console.log('\n✅ Cleanup completed successfully!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

cleanOrphanedNotifications();
