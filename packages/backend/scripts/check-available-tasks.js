/**
 * Check available tasks in the database
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

async function checkAvailableTasks() {
  try {
    console.log('=== 查询状态为 AVAILABLE 的任务 ===\n');
    
    const query = `
      SELECT 
        t.id,
        t.name,
        t.status,
        t.visibility,
        t.assignee_id,
        t.bounty_amount,
        t.is_executable,
        t.parent_id,
        t.depth,
        u.username as publisher_name
      FROM tasks t
      LEFT JOIN users u ON t.publisher_id = u.id
      WHERE t.status = 'available'
      ORDER BY t.created_at DESC
      LIMIT 20
    `;
    
    const result = await pool.query(query);
    
    if (result.rows.length === 0) {
      console.log('❌ 没有找到状态为 AVAILABLE 的任务\n');
    } else {
      console.log(`✅ 找到 ${result.rows.length} 个状态为 AVAILABLE 的任务:\n`);
      
      result.rows.forEach((task, index) => {
        console.log(`${index + 1}. ${task.name}`);
        console.log(`   ID: ${task.id}`);
        console.log(`   发布者: ${task.publisher_name}`);
        console.log(`   状态: ${task.status}`);
        console.log(`   可见性: ${task.visibility}`);
        console.log(`   承接人: ${task.assignee_id || 'null'}`);
        console.log(`   赏金: $${task.bounty_amount}`);
        console.log(`   is_executable: ${task.is_executable}`);
        console.log(`   parent_id: ${task.parent_id || 'null'}`);
        console.log(`   depth: ${task.depth}`);
        
        // 检查是否应该显示在赏金任务列表
        const shouldShow = task.assignee_id === null && task.visibility === 'public';
        console.log(`   应该显示在赏金任务列表: ${shouldShow ? '✅ 是' : '❌ 否'}`);
        
        if (!shouldShow) {
          const reasons = [];
          if (task.assignee_id !== null) reasons.push('已有承接人');
          if (task.visibility !== 'public') reasons.push(`可见性为 ${task.visibility}`);
          console.log(`   原因: ${reasons.join(', ')}`);
        }
        
        console.log('');
      });
    }
    
    // 统计信息
    console.log('=== 统计信息 ===');
    const statsQuery = `
      SELECT 
        COUNT(*) FILTER (WHERE assignee_id IS NULL AND visibility = 'public') as should_show,
        COUNT(*) FILTER (WHERE assignee_id IS NOT NULL) as has_assignee,
        COUNT(*) FILTER (WHERE visibility != 'public') as not_public,
        COUNT(*) as total
      FROM tasks
      WHERE status = 'available'
    `;
    
    const statsResult = await pool.query(statsQuery);
    const stats = statsResult.rows[0];
    
    console.log(`总计 AVAILABLE 任务: ${stats.total}`);
    console.log(`应该显示在赏金任务列表: ${stats.should_show}`);
    console.log(`已有承接人: ${stats.has_assignee}`);
    console.log(`可见性不是 public: ${stats.not_public}`);
    console.log('');
    
  } catch (error) {
    console.error('错误:', error);
  } finally {
    await pool.end();
  }
}

checkAvailableTasks();
