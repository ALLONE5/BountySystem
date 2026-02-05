import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '123456',
  database: process.env.DB_NAME || 'bounty_hunter'
});

async function checkGroupTasks() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 检查群组任务和成员关系...\n');

    // 1. 检查所有任务组
    console.log('📋 任务组列表:');
    const groupsResult = await client.query(`
      SELECT id, name, creator_id, created_at 
      FROM task_groups 
      ORDER BY name
    `);
    
    groupsResult.rows.forEach(g => {
      console.log(`  - ${g.name} (ID: ${g.id.substring(0, 8)}...)`);
    });

    // 2. 检查群组任务
    console.log('\n👥 群组任务:');
    const groupTasksResult = await client.query(`
      SELECT 
        t.id,
        t.name,
        t.status,
        t.progress,
        t.bounty_amount,
        tg.name as group_name
      FROM tasks t
      JOIN task_groups tg ON t.group_id = tg.id
      WHERE t.group_id IS NOT NULL
      ORDER BY tg.name, t.name
    `);
    
    if (groupTasksResult.rows.length === 0) {
      console.log('  ⚠ 没有群组任务');
    } else {
      groupTasksResult.rows.forEach(t => {
        console.log(`  - [${t.group_name}] ${t.name}`);
        console.log(`    状态: ${t.status}, 进度: ${t.progress}%, 赏金: $${t.bounty_amount}`);
      });
    }

    // 3. 检查群组成员
    console.log('\n👤 群组成员关系:');
    const membersResult = await client.query(`
      SELECT 
        tg.name as group_name,
        u.username,
        gm.joined_at
      FROM group_members gm
      JOIN task_groups tg ON gm.group_id = tg.id
      JOIN users u ON gm.user_id = u.id
      ORDER BY tg.name, u.username
    `);
    
    if (membersResult.rows.length === 0) {
      console.log('  ⚠ 没有群组成员关系');
    } else {
      let currentGroup = '';
      membersResult.rows.forEach(m => {
        if (m.group_name !== currentGroup) {
          console.log(`\n  ${m.group_name}:`);
          currentGroup = m.group_name;
        }
        console.log(`    - ${m.username}`);
      });
    }

    // 4. 检查 developer2 的群组成员关系
    console.log('\n\n🔍 developer2 的群组成员关系:');
    const dev2GroupsResult = await client.query(`
      SELECT 
        tg.name as group_name,
        gm.joined_at
      FROM group_members gm
      JOIN task_groups tg ON gm.group_id = tg.id
      JOIN users u ON gm.user_id = u.id
      WHERE u.username = 'developer2'
      ORDER BY tg.name
    `);
    
    if (dev2GroupsResult.rows.length === 0) {
      console.log('  ❌ developer2 不属于任何群组');
    } else {
      dev2GroupsResult.rows.forEach(g => {
        console.log(`  ✓ ${g.group_name}`);
      });
    }

    // 5. 统计信息
    console.log('\n📊 统计信息:');
    const statsResult = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM task_groups) as total_groups,
        (SELECT COUNT(*) FROM tasks WHERE group_id IS NOT NULL) as group_tasks,
        (SELECT COUNT(*) FROM group_members) as total_memberships,
        (SELECT COUNT(DISTINCT user_id) FROM group_members) as users_in_groups
    `);
    
    const stats = statsResult.rows[0];
    console.log(`  - 任务组总数: ${stats.total_groups}`);
    console.log(`  - 群组任务数: ${stats.group_tasks}`);
    console.log(`  - 成员关系数: ${stats.total_memberships}`);
    console.log(`  - 加入群组的用户数: ${stats.users_in_groups}`);

  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkGroupTasks().catch(console.error);
