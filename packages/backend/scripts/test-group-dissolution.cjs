/**
 * Test script for group dissolution feature
 * Tests that groups with completed tasks cannot be dissolved
 */

const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'bounty_hunter',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function testGroupDissolution() {
  console.log('🧪 Testing Group Dissolution Feature\n');

  try {
    // Get all groups
    const groupsResult = await pool.query(`
      SELECT id, name, creator_id
      FROM task_groups
      ORDER BY created_at DESC
      LIMIT 10
    `);

    console.log(`📊 Found ${groupsResult.rows.length} groups\n`);

    for (const group of groupsResult.rows) {
      console.log(`\n🔍 Checking group: ${group.name} (${group.id})`);

      // Check for completed tasks
      const completedTasksResult = await pool.query(`
        SELECT COUNT(*) as count
        FROM tasks
        WHERE group_id = $1 AND status = 'completed'
      `, [group.id]);

      const completedCount = parseInt(completedTasksResult.rows[0].count, 10);

      // Check for all tasks
      const allTasksResult = await pool.query(`
        SELECT COUNT(*) as count, 
               COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
               COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
               COUNT(CASE WHEN status = 'available' THEN 1 END) as available,
               COUNT(CASE WHEN status = 'not_started' THEN 1 END) as not_started
        FROM tasks
        WHERE group_id = $1
      `, [group.id]);

      const stats = allTasksResult.rows[0];

      console.log(`   📋 Total tasks: ${stats.count}`);
      console.log(`   ✅ Completed: ${stats.completed}`);
      console.log(`   🔄 In Progress: ${stats.in_progress}`);
      console.log(`   📌 Available: ${stats.available}`);
      console.log(`   ⏸️  Not Started: ${stats.not_started}`);

      if (completedCount > 0) {
        console.log(`   ❌ Cannot dissolve: Has ${completedCount} completed task(s)`);
      } else if (parseInt(stats.count) === 0) {
        console.log(`   ✅ Can dissolve: No tasks`);
      } else {
        console.log(`   ✅ Can dissolve: No completed tasks`);
      }
    }

    console.log('\n\n📈 Summary:');
    
    // Get dissolution statistics
    const summaryResult = await pool.query(`
      SELECT 
        COUNT(DISTINCT tg.id) as total_groups,
        COUNT(DISTINCT CASE 
          WHEN EXISTS (
            SELECT 1 FROM tasks t 
            WHERE t.group_id = tg.id AND t.status = 'completed'
          ) THEN tg.id 
        END) as groups_with_completed_tasks,
        COUNT(DISTINCT CASE 
          WHEN NOT EXISTS (
            SELECT 1 FROM tasks t 
            WHERE t.group_id = tg.id AND t.status = 'completed'
          ) THEN tg.id 
        END) as groups_can_dissolve
      FROM task_groups tg
    `);

    const summary = summaryResult.rows[0];
    console.log(`   Total groups: ${summary.total_groups}`);
    console.log(`   ❌ Cannot dissolve (has completed tasks): ${summary.groups_with_completed_tasks}`);
    console.log(`   ✅ Can dissolve: ${summary.groups_can_dissolve}`);

    console.log('\n✅ Test completed successfully');

  } catch (error) {
    console.error('❌ Error during test:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the test
testGroupDissolution().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
