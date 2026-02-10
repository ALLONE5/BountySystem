const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'bounty_hunter',
  user: 'postgres',
  password: '123456',
});

async function checkSubtasks() {
  try {
    // Check all tasks with their parent relationships
    const result = await pool.query(`
      SELECT 
        t.id,
        t.name,
        t.parent_id,
        (SELECT COUNT(*) FROM tasks WHERE parent_id = t.id) as subtask_count
      FROM tasks t
      ORDER BY t.created_at DESC
      LIMIT 20
    `);

    console.log('\n=== Task Hierarchy ===\n');
    
    const parentTasks = result.rows.filter(t => t.parent_id === null);
    const childTasks = result.rows.filter(t => t.parent_id !== null);
    
    console.log(`Total tasks checked: ${result.rows.length}`);
    console.log(`Parent tasks: ${parentTasks.length}`);
    console.log(`Child tasks: ${childTasks.length}`);
    
    console.log('\n=== Parent Tasks with Subtasks ===\n');
    parentTasks.forEach(task => {
      if (task.subtask_count > 0) {
        console.log(`✓ ${task.name} (ID: ${task.id})`);
        console.log(`  Subtasks: ${task.subtask_count}`);
        
        const children = childTasks.filter(c => c.parent_id === task.id);
        children.forEach(child => {
          console.log(`    - ${child.name} (ID: ${child.id})`);
        });
        console.log('');
      }
    });
    
    if (parentTasks.filter(t => t.subtask_count > 0).length === 0) {
      console.log('⚠ No tasks with subtasks found!');
      console.log('\nTo create test subtasks, you can run:');
      console.log('node packages/backend/scripts/populate-subtasks-for-ui-test.js');
    }

  } catch (error) {
    console.error('Error checking subtasks:', error);
  } finally {
    await pool.end();
  }
}

checkSubtasks();
