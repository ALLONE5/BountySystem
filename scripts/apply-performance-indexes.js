#!/usr/bin/env node

/**
 * 应用数据库性能索引脚本
 * 逐个执行索引创建，避免事务问题
 */

const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'bounty_hunter',
  user: 'postgres',
  password: '123456'
});

const indexes = [
  {
    name: 'idx_tasks_assignee_status',
    sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_assignee_status 
          ON tasks(assignee_id, status) 
          WHERE assignee_id IS NOT NULL`,
    description: '任务分配者和状态的复合索引'
  },
  {
    name: 'idx_tasks_publisher_created',
    sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_publisher_created 
          ON tasks(publisher_id, created_at DESC)`,
    description: '任务发布者和创建时间的复合索引'
  },
  {
    name: 'idx_notifications_user_unread_created',
    sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_unread_created 
          ON notifications(user_id, is_read, created_at DESC)`,
    description: '用户未读通知的复合索引'
  },
  {
    name: 'idx_bounty_transactions_to_user_type_created',
    sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bounty_transactions_to_user_type_created 
          ON bounty_transactions(to_user_id, type, created_at DESC)`,
    description: '赏金交易接收者和类型的复合索引'
  },
  {
    name: 'idx_audit_logs_user_timestamp',
    sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user_timestamp 
          ON audit_logs(user_id, timestamp DESC)`,
    description: '审计日志用户和时间的复合索引'
  },
  {
    name: 'idx_rankings_user_period_calculated',
    sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rankings_user_period_calculated 
          ON rankings(user_id, period, calculated_at DESC)`,
    description: '用户排名历史的复合索引'
  }
];

async function applyIndexes() {
  console.log('🚀 开始应用数据库性能索引...');
  
  let successCount = 0;
  let failCount = 0;
  
  for (const index of indexes) {
    try {
      console.log(`📝 创建索引: ${index.name} - ${index.description}`);
      await pool.query(index.sql);
      console.log(`✅ 成功: ${index.name}`);
      successCount++;
    } catch (error) {
      console.error(`❌ 失败: ${index.name} - ${error.message}`);
      failCount++;
    }
  }
  
  console.log('\n📊 索引创建完成!');
  console.log(`成功: ${successCount} 个`);
  console.log(`失败: ${failCount} 个`);
  
  await pool.end();
  
  return { successCount, failCount };
}

if (require.main === module) {
  applyIndexes().catch(console.error);
}

module.exports = { applyIndexes };