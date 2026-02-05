/**
 * Check specific task current status
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'bounty_hunter',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function checkTask() {
  try {
    const taskId = '0bfd0ac5-3cd0-4579-ace7-96a4a2c809f1';
    
    console.log(`=== 检查任务当前状态 ===`);
    console.log(`任务ID: ${taskId}\n`);
    
    const query = `
      SELECT 
        t.id,
        t.name,
        t.status,
        t.visibility,
        t.assignee_id,
        t.bounty_amount,
        t.is_executable,
        t.is_published,
        t.parent_id,
        t.depth,
        t.created_at,
        t.updated_at,
        u.username as publisher_name,
        a.username as assignee_name
      FROM tasks t
      LEFT JOIN users u ON t.publisher_id = u.id
      LEFT JOIN users a ON t.assignee_id = a.id
      WHERE t.id = $1
    `;
    
    const result = await pool.query(query, [taskId]);
    
    if (result.rows.length === 0) {
      console.log(`❌ 任务不存在！任务可能已被删除。\n`);
    } else {
      const task = result.rows[0];
      
      console.log(`✅ 任务存在\n`);
      console.log(`基本信息:`);
      console.log(`  名称: ${task.name}`);
      console.log(`  发布者: ${task.publisher_name}`);
      console.log(`  状态: ${task.status}`);
      console.log(`  可见性: ${task.visibility}`);
      console.log(`  承接人: ${task.assignee_name || 'null'} (${task.assignee_id || 'null'})`);
      console.log(`  赏金: $${task.bounty_amount}`);
      console.log(`  is_executable: ${task.is_executable}`);
      console.log(`  is_published: ${task.is_published}`);
      console.log(`  parent_id: ${task.parent_id || 'null'}`);
      console.log(`  depth: ${task.depth}`);
      console.log(`  创建时间: ${task.created_at}`);
      console.log(`  更新时间: ${task.updated_at}`);
      console.log('');
      
      // 检查过滤条件
      console.log('=== 过滤条件检查 ===');
      
      const passAssignee = task.assignee_id === null;
      const passVisibility = task.visibility === 'public';
      const passStatus = task.status === 'available';
      
      console.log(`1. status = 'available': ${passStatus ? '✅ PASS' : '❌ FAIL'}`);
      console.log(`   当前值: ${task.status}`);
      if (!passStatus) {
        console.log(`   ⚠️  任务状态不是 available`);
      }
      console.log('');
      
      console.log(`2. assignee_id IS NULL: ${passAssignee ? '✅ PASS' : '❌ FAIL'}`);
      console.log(`   当前值: ${task.assignee_id || 'null'}`);
      if (!passAssignee) {
        console.log(`   ⚠️  任务已有承接人: ${task.assignee_name}`);
      }
      console.log('');
      
      console.log(`3. visibility = 'public': ${passVisibility ? '✅ PASS' : '❌ FAIL'}`);
      console.log(`   当前值: ${task.visibility}`);
      if (!passVisibility) {
        console.log(`   ⚠️  任务可见性不是 public`);
      }
      console.log('');
      
      // 总结
      const allPass = passStatus && passAssignee && passVisibility;
      console.log('=== 结论 ===');
      if (allPass) {
        console.log('✅ 任务满足所有条件，应该显示在赏金任务列表中');
        console.log('');
        console.log('⚠️  但是任务没有出现在 API 响应中！');
        console.log('');
        console.log('可能的原因:');
        console.log('1. 后端服务使用的是旧代码（未重启）');
        console.log('2. 查询使用了不同的排序或限制条件');
        console.log('3. 数据库连接问题');
      } else {
        console.log('❌ 任务不满足显示条件');
        console.log('');
        console.log('失败原因:');
        if (!passStatus) console.log(`- 状态不是 available (当前: ${task.status})`);
        if (!passAssignee) console.log(`- 已有承接人 (${task.assignee_name})`);
        if (!passVisibility) console.log(`- 可见性不是 public (当前: ${task.visibility})`);
      }
      console.log('');
    }
    
  } catch (error) {
    console.error('错误:', error);
  } finally {
    await pool.end();
  }
}

checkTask();
