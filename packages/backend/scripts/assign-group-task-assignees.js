import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '123456',
  database: process.env.DB_NAME || 'bounty_hunter'
});

async function assignGroupTaskAssignees() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('🔄 开始为群组任务分配承接人...\n');

    // 1. 获取所有群组任务
    console.log('📋 查找群组任务...');
    const groupTasksResult = await client.query(`
      SELECT 
        t.id,
        t.name,
        t.group_id,
        t.assignee_id,
        tg.name as group_name
      FROM tasks t
      JOIN task_groups tg ON t.group_id = tg.id
      WHERE t.group_id IS NOT NULL
      ORDER BY tg.name, t.name
    `);
    
    if (groupTasksResult.rows.length === 0) {
      console.log('  ⚠ 没有找到群组任务');
      return;
    }
    
    console.log(`  ✓ 找到 ${groupTasksResult.rows.length} 个群组任务\n`);

    // 2. 为每个群组任务分配承接人
    console.log('👤 分配承接人:');
    let assignedCount = 0;
    let skippedCount = 0;

    for (const task of groupTasksResult.rows) {
      // 如果任务已经有承接人，跳过
      if (task.assignee_id) {
        console.log(`  - [${task.group_name}] ${task.name} - 已有承接人，跳过`);
        skippedCount++;
        continue;
      }

      // 获取该群组的成员
      const membersResult = await client.query(`
        SELECT gm.user_id, u.username
        FROM group_members gm
        JOIN users u ON gm.user_id = u.id
        WHERE gm.group_id = $1
        ORDER BY gm.joined_at
        LIMIT 1
      `, [task.group_id]);

      if (membersResult.rows.length === 0) {
        console.log(`  - [${task.group_name}] ${task.name} - 群组没有成员，跳过`);
        skippedCount++;
        continue;
      }

      // 分配第一个成员作为承接人
      const assignee = membersResult.rows[0];
      await client.query(`
        UPDATE tasks
        SET assignee_id = $1
        WHERE id = $2
      `, [assignee.user_id, task.id]);

      console.log(`  ✓ [${task.group_name}] ${task.name} → ${assignee.username}`);
      assignedCount++;
    }

    await client.query('COMMIT');
    
    console.log(`\n✅ 完成！`);
    console.log(`  - 已分配: ${assignedCount} 个任务`);
    console.log(`  - 已跳过: ${skippedCount} 个任务`);
    
    // 3. 验证结果
    console.log('\n📊 验证结果:');
    const verifyResult = await client.query(`
      SELECT 
        tg.name as group_name,
        t.name as task_name,
        u.username as assignee_username
      FROM tasks t
      JOIN task_groups tg ON t.group_id = tg.id
      LEFT JOIN users u ON t.assignee_id = u.id
      WHERE t.group_id IS NOT NULL
      ORDER BY tg.name, t.name
    `);
    
    verifyResult.rows.forEach(row => {
      const assigneeInfo = row.assignee_username || '未分配';
      console.log(`  - [${row.group_name}] ${row.task_name} → ${assigneeInfo}`);
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 错误:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

assignGroupTaskAssignees().catch(console.error);
