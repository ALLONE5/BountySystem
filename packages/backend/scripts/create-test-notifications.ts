#!/usr/bin/env node

/**
 * 创建测试通知脚本
 * 用于测试通知系统是否正常工作
 */

import { pool } from '../src/config/database.js';

async function createTestNotifications() {
  try {
    console.log('🔄 开始创建测试通知...\n');

    // 获取一个测试用户ID（假设是开发者用户）
    const userResult = await pool.query(`
      SELECT id, username FROM users 
      WHERE role = 'developer' 
      LIMIT 1
    `);

    if (userResult.rows.length === 0) {
      console.log('❌ 没有找到开发者用户，请先创建用户');
      return;
    }

    const testUser = userResult.rows[0];
    console.log(`📝 为用户 ${testUser.username} (${testUser.id}) 创建测试通知`);

    // 创建几个不同类型的测试通知
    const notifications = [
      {
        type: 'broadcast',
        title: '系统维护通知',
        message: '系统将于今晚22:00-24:00进行维护，请提前保存工作内容。',
      },
      {
        type: 'task_assigned',
        title: '新任务分配',
        message: '您有一个新的任务需要处理，请及时查看任务详情。',
      },
      {
        type: 'deadline_reminder',
        title: '任务截止提醒',
        message: '您有任务即将到期，请注意按时完成。',
      },
      {
        type: 'account_updated',
        title: '账户信息更新',
        message: '您的账户信息已更新，如有疑问请联系管理员。',
      },
    ];

    let createdCount = 0;

    for (const notification of notifications) {
      const result = await pool.query(`
        INSERT INTO notifications (
          user_id, 
          type, 
          title, 
          message, 
          is_read, 
          created_at
        ) VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING id
      `, [
        testUser.id,
        notification.type,
        notification.title,
        notification.message,
        false // 未读状态
      ]);

      if (result.rows.length > 0) {
        createdCount++;
        console.log(`✅ 创建通知: ${notification.title}`);
      }
    }

    // 检查创建结果
    const countResult = await pool.query(`
      SELECT COUNT(*) as count 
      FROM notifications 
      WHERE user_id = $1 AND is_read = FALSE
    `, [testUser.id]);

    const unreadCount = countResult.rows[0].count;

    console.log(`\n📊 创建完成:`);
    console.log(`   - 新创建通知: ${createdCount} 条`);
    console.log(`   - 用户未读通知总数: ${unreadCount} 条`);
    console.log(`\n🎯 现在可以登录系统测试通知功能了！`);

  } catch (error) {
    console.error('❌ 创建测试通知失败:', error);
  } finally {
    await pool.end();
  }
}

// 运行脚本
createTestNotifications();