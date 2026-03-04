const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function runPerformanceIndexesMigration() {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'bounty_hunter_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password'
  });

  try {
    console.log('🚀 Starting performance indexes migration...');
    
    const migrationPath = path.join(__dirname, '../../database/migrations/20260303_000001_add_performance_indexes.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the migration
    await pool.query(migrationSQL);
    
    console.log('✅ Performance indexes migration completed successfully');
    console.log('📊 Added indexes for:');
    console.log('   - Tasks (assignee_id, publisher_id, status, etc.)');
    console.log('   - Users (email, username, role)');
    console.log('   - Positions (task_id, created_at)');
    console.log('   - Position Applications (position_id, user_id, status)');
    console.log('   - Notifications (user_id, is_read, type)');
    console.log('   - Bounty Transactions (from_user_id, to_user_id, task_id)');
    console.log('   - Full-text search indexes');
    console.log('   - Composite and partial indexes for common queries');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (error.message.includes('already exists')) {
      console.log('💡 Some indexes may already exist, which is normal');
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  runPerformanceIndexesMigration();
}

module.exports = { runPerformanceIndexesMigration };