const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'bounty_hunter',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '123456',
});

async function checkApplications() {
  try {
    console.log('Checking position_applications table...\n');
    
    // Check total count
    const totalResult = await pool.query('SELECT COUNT(*) as count FROM position_applications');
    console.log(`Total applications: ${totalResult.rows[0].count}`);
    
    // Check by status
    const statusResult = await pool.query(`
      SELECT status, COUNT(*) as count 
      FROM position_applications 
      GROUP BY status
      ORDER BY status
    `);
    console.log('\nApplications by status:');
    statusResult.rows.forEach(row => {
      console.log(`  ${row.status}: ${row.count}`);
    });
    
    // Check pending applications with details
    const pendingResult = await pool.query(`
      SELECT 
        pa.id,
        pa.user_id,
        pa.position_id,
        pa.status,
        pa.created_at,
        u.username,
        p.name as position_name
      FROM position_applications pa
      LEFT JOIN users u ON pa.user_id = u.id
      LEFT JOIN positions p ON pa.position_id = p.id
      WHERE pa.status = 'pending'
      ORDER BY pa.created_at DESC
      LIMIT 10
    `);
    
    console.log(`\nPending applications (showing first 10):`);
    if (pendingResult.rows.length === 0) {
      console.log('  No pending applications found');
    } else {
      pendingResult.rows.forEach(row => {
        console.log(`  - ${row.username} -> ${row.position_name} (${row.created_at.toISOString()})`);
      });
    }
    
    // Check notifications about applications
    const notifResult = await pool.query(`
      SELECT COUNT(*) as count 
      FROM notifications 
      WHERE type = 'review_required'
    `);
    console.log(`\nNotifications with type 'review_required': ${notifResult.rows[0].count}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkApplications();
