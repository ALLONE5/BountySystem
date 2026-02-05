import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '123456',
  database: process.env.DB_NAME || 'bounty_hunter'
});

async function populateGroupMembers() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('👥 开始添加群组成员关系...\n');

    // 1. 获取用户
    const usersResult = await client.query(`
      SELECT id, username FROM users 
      WHERE username IN ('admin', 'developer1', 'developer2', 'designer1', 'manager1')
    `);
    
    const users = {};
    usersResult.rows.forEach(u => {
      users[u.username] = u.id;
    });
    
    console.log(`✓ 找到 ${usersResult.rows.length} 个用户\n`);

    // 2. 获取任务组
    const groupsResult = await client.query(`
      SELECT id, name FROM task_groups
      WHERE name IN ('前端开发组', '后端开发组', '设计团队', '测试团队')
    `);
    
    const groups = {};
    groupsResult.rows.forEach(g => {
      groups[g.name] = g.id;
    });
    
    console.log(`✓ 找到 ${groupsResult.rows.length} 个任务组\n`);

    // 3. 定义群组成员关系
    const memberships = [
      // 前端开发组
      { group: '前端开发组', user: 'admin' },
      { group: '前端开发组', user: 'developer1' },
      { group: '前端开发组', user: 'developer2' },
      { group: '前端开发组', user: 'designer1' },
      
      // 后端开发组
      { group: '后端开发组', user: 'admin' },
      { group: '后端开发组', user: 'developer1' },
      { group: '后端开发组', user: 'developer2' },
      
      // 设计团队
      { group: '设计团队', user: 'admin' },
      { group: '设计团队', user: 'designer1' },
      
      // 测试团队
      { group: '测试团队', user: 'admin' },
      { group: '测试团队', user: 'developer1' },
      { group: '测试团队', user: 'developer2' },
      { group: '测试团队', user: 'manager1' }
    ];

    // 4. 添加成员关系
    console.log('📝 添加成员关系:');
    let addedCount = 0;
    
    for (const membership of memberships) {
      const groupId = groups[membership.group];
      const userId = users[membership.user];
      
      if (!groupId || !userId) {
        console.log(`  ⚠ 跳过: ${membership.group} - ${membership.user} (未找到)`);
        continue;
      }
      
      // 检查是否已存在
      const existingResult = await client.query(
        'SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2',
        [groupId, userId]
      );
      
      if (existingResult.rows.length > 0) {
        console.log(`  - ${membership.group} - ${membership.user} (已存在)`);
        continue;
      }
      
      // 添加成员
      await client.query(
        'INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)',
        [groupId, userId]
      );
      
      console.log(`  ✓ ${membership.group} - ${membership.user}`);
      addedCount++;
    }

    await client.query('COMMIT');
    
    console.log(`\n✅ 完成！添加了 ${addedCount} 个成员关系\n`);
    
    // 5. 验证结果
    console.log('📊 验证结果:');
    const verifyResult = await client.query(`
      SELECT 
        tg.name as group_name,
        COUNT(gm.user_id) as member_count
      FROM task_groups tg
      LEFT JOIN group_members gm ON tg.id = gm.group_id
      WHERE tg.name IN ('前端开发组', '后端开发组', '设计团队', '测试团队')
      GROUP BY tg.name
      ORDER BY tg.name
    `);
    
    verifyResult.rows.forEach(row => {
      console.log(`  - ${row.group_name}: ${row.member_count} 个成员`);
    });
    
    console.log('\n🎯 现在 developer2 应该可以在群组中看到任务了！');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 错误:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

populateGroupMembers().catch(console.error);
