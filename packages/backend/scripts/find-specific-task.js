/**
 * Find specific task by name
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

async function findTask() {
  try {
    const searchName = '特沃瑞幸我认为';
    
    console.log(`=== 搜索任务: "${searchName}" ===\n`);
    
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
        u.username as publisher_name
      FROM tasks t
      LEFT JOIN users u ON t.publisher_id = u.id
      WHERE t.name LIKE $1
      ORDER BY t.created_at DESC
    `;
    
    const result = await pool.query(query, [`%${searchName}%`]);
    
    if (result.rows.length === 0) {
      console.log(`❌ 没有找到名称包含 "${searchName}" 的任务\n`);
      
      // 尝试模糊搜索
      console.log('尝试模糊搜索...\n');
      const fuzzyQuery = `
        SELECT 
          t.id,
          t.name,
          t.status,
          t.visibility,
          t.assignee_id,
          t.bounty_amount
        FROM tasks t
        WHERE t.name LIKE '%特%' OR t.name LIKE '%瑞%' OR t.name LIKE '%幸%'
        ORDER BY t.created_at DESC
        LIMIT 10
      `;
      
      const fuzzyResult = await pool.query(fuzzyQuery);
      if (fuzzyResult.rows.length > 0) {
        console.log('找到相似的任务:');
        fuzzyResult.rows.forEach((task, index) => {
          console.log(`${index + 1}. ${task.name} (ID: ${task.id})`);
        });
      }
    } else {
      console.log(`✅ 找到 ${result.rows.length} 个匹配的任务:\n`);
      
      result.rows.forEach((task, index) => {
        console.log(`${index + 1}. ${task.name}`);
        console.log(`   ID: ${task.id}`);
        console.log(`   发布者: ${task.publisher_name}`);
        console.log(`   状态: ${task.status}`);
        console.log(`   可见性: ${task.visibility}`);
        console.log(`   承接人: ${task.assignee_id || 'null'}`);
        console.log(`   赏金: $${task.bounty_amount}`);
        console.log(`   is_executable: ${task.is_executable}`);
        console.log(`   is_published: ${task.is_published}`);
        console.log(`   parent_id: ${task.parent_id || 'null'}`);
        console.log(`   depth: ${task.depth}`);
        console.log(`   创建时间: ${task.created_at}`);
        
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
    
  } catch (error) {
    console.error('错误:', error);
  } finally {
    await pool.end();
  }
}

findTask();
