import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'bounty_hunter',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '123456',
});

async function fixExistingSubtasks() {
  const client = await pool.connect();
  
  try {
    console.log('Fixing existing unpublished subtasks...\n');
    
    // Find all unpublished subtasks (is_published = false)
    const query = `
      SELECT id, name, visibility, assignee_id, status
      FROM tasks
      WHERE depth = 1 AND is_published = false
    `;
    
    const result = await client.query(query);
    
    console.log(`Found ${result.rows.length} unpublished subtask(s)\n`);
    
    if (result.rows.length === 0) {
      console.log('✅ No subtasks need fixing');
      return;
    }
    
    // Update visibility to PRIVATE for unpublished subtasks
    const updateQuery = `
      UPDATE tasks
      SET visibility = 'private'
      WHERE depth = 1 AND is_published = false AND visibility != 'private'
      RETURNING id, name, visibility
    `;
    
    const updateResult = await client.query(updateQuery);
    
    console.log(`Updated ${updateResult.rows.length} subtask(s) to PRIVATE visibility:\n`);
    
    updateResult.rows.forEach((task, index) => {
      console.log(`${index + 1}. ${task.name} (${task.id})`);
      console.log(`   Visibility: ${task.visibility}`);
    });
    
    console.log('\n✅ Fix completed');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

fixExistingSubtasks().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
