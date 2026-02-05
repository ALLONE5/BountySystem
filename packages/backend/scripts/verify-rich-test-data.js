import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: '123456',
  database: 'bounty_hunter'
});

async function verify() {
  try {
    // Check project groups
    const pgResult = await pool.query(`
      SELECT pg.name, COUNT(t.id) as task_count 
      FROM project_groups pg 
      LEFT JOIN tasks t ON t.project_group_id = pg.id 
      GROUP BY pg.id, pg.name 
      ORDER BY pg.name
    `);
    
    console.log('📁 项目组统计:');
    pgResult.rows.forEach(row => {
      console.log(`  ${row.name}: ${row.task_count} 个任务`);
    });
    console.log('');
    
    // Check tasks by status
    const statusResult = await pool.query(`
      SELECT status, COUNT(*) as count 
      FROM tasks 
      GROUP BY status 
      ORDER BY status
    `);
    
    console.log('📊 任务状态统计:');
    statusResult.rows.forEach(row => {
      console.log(`  ${row.status}: ${row.count} 个`);
    });
    console.log('');
    
    // Check tasks by user
    const userResult = await pool.query(`
      SELECT u.username, COUNT(t.id) as task_count 
      FROM users u 
      LEFT JOIN tasks t ON t.assignee_id = u.id 
      WHERE u.username IN ('developer1', 'developer2', 'designer1')
      GROUP BY u.id, u.username 
      ORDER BY u.username
    `);
    
    console.log('👤 用户任务统计:');
    userResult.rows.forEach(row => {
      console.log(`  ${row.username}: ${row.task_count} 个任务`);
    });
    console.log('');
    
    // Check tasks without project group
    const noProjectResult = await pool.query(`
      SELECT COUNT(*) as count 
      FROM tasks 
      WHERE project_group_id IS NULL
    `);
    
    console.log(`📝 无项目组任务: ${noProjectResult.rows[0].count} 个`);
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    await pool.end();
  }
}

verify();
