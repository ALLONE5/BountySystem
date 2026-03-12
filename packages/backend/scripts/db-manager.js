#!/usr/bin/env node

/**
 * 数据库管理工具
 * 统一的数据库管理脚本
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'bounty_hunter',
  password: process.env.DB_PASSWORD || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432', 10),
});

// 显示帮助信息
function showHelp() {
  console.log(`
📦 数据库管理工具

用法: node packages/backend/scripts/db-manager.js <command>

命令:
  seed           - 运行所有种子脚本
  seed-test      - 创建测试数据
  seed-bounty    - 创建赏金交易测试数据
  reset-admin    - 重置管理员密码
  refresh-ranks  - 刷新排名数据
  check          - 检查数据库连接
  help           - 显示此帮助信息

示例:
  node packages/backend/scripts/db-manager.js seed
  node packages/backend/scripts/db-manager.js reset-admin
`);
}

// 检查数据库连接
async function checkConnection() {
  console.log('🔍 检查数据库连接...\n');
  
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('✅ 数据库连接成功');
    console.log(`   时间: ${result.rows[0].now}\n`);
    client.release();
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    process.exit(1);
  }
}

// 运行种子脚本
async function runSeed() {
  console.log('🌱 运行种子脚本...\n');
  
  try {
    // 动态导入种子脚本
    const { default: seedDb } = await import('./seed_db.ts');
    await seedDb();
    console.log('\n✅ 种子数据创建完成\n');
  } catch (error) {
    console.error('❌ 种子脚本失败:', error.message);
    process.exit(1);
  }
}

// 创建测试数据
async function seedTest() {
  console.log('🧪 创建测试数据...\n');
  
  try {
    const { default: seedEnhanced } = await import('./seed-enhanced-test-data.js');
    await seedEnhanced();
    console.log('\n✅ 测试数据创建完成\n');
  } catch (error) {
    console.error('❌ 测试数据创建失败:', error.message);
    process.exit(1);
  }
}

// 创建赏金交易测试数据
async function seedBounty() {
  console.log('💰 创建赏金交易测试数据...\n');
  
  try {
    // 使用 require 加载 CommonJS 模块
    const seedBountyTransactions = require('./seed-bounty-transactions.cjs');
    await seedBountyTransactions();
    console.log('\n✅ 赏金交易数据创建完成\n');
  } catch (error) {
    console.error('❌ 赏金交易数据创建失败:', error.message);
    process.exit(1);
  }
}

// 重置管理员密码
async function resetAdmin() {
  console.log('🔑 重置管理员密码...\n');
  
  try {
    const { default: resetPassword } = await import('./reset_admin_password.ts');
    await resetPassword();
    console.log('\n✅ 管理员密码重置完成\n');
  } catch (error) {
    console.error('❌ 密码重置失败:', error.message);
    process.exit(1);
  }
}

// 刷新排名
async function refreshRankings() {
  console.log('📊 刷新排名数据...\n');
  
  try {
    const { default: forceRefresh } = await import('./force-refresh-rankings.ts');
    await forceRefresh();
    console.log('\n✅ 排名数据刷新完成\n');
  } catch (error) {
    console.error('❌ 排名刷新失败:', error.message);
    process.exit(1);
  }
}

// 主函数
async function main() {
  const command = process.argv[2];
  
  if (!command || command === 'help') {
    showHelp();
    await pool.end();
    return;
  }
  
  try {
    switch (command) {
      case 'check':
        await checkConnection();
        break;
      case 'seed':
        await runSeed();
        break;
      case 'seed-test':
        await seedTest();
        break;
      case 'seed-bounty':
        await seedBounty();
        break;
      case 'reset-admin':
        await resetAdmin();
        break;
      case 'refresh-ranks':
        await refreshRankings();
        break;
      default:
        console.error(`❌ 未知命令: ${command}`);
        console.log('运行 "node packages/backend/scripts/db-manager.js help" 查看帮助\n');
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ 执行失败:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
