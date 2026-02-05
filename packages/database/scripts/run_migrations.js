/**
 * 运行数据库迁移脚本
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 数据库配置
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: '123456',
});

async function runMigrations() {
  const client = await pool.connect();
  
  try {
    console.log('开始运行数据库迁移...\n');
    
    // 先创建类型和扩展
    console.log('创建数据库类型和扩展...');
    
    // 创建扩展
    await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    
    // 创建枚举类型
    const types = [
      `CREATE TYPE user_role AS ENUM ('user', 'position_admin', 'super_admin')`,
      `CREATE TYPE task_status AS ENUM ('not_started', 'available', 'in_progress', 'completed', 'abandoned')`,
      `CREATE TYPE visibility AS ENUM ('public', 'position_only', 'private')`,
      `CREATE TYPE notification_type AS ENUM ('task_assigned', 'deadline_reminder', 'dependency_resolved', 'status_changed', 'position_approved', 'position_rejected', 'broadcast', 'task_recommendation')`,
      `CREATE TYPE application_status AS ENUM ('pending', 'approved', 'rejected')`,
      `CREATE TYPE allocation_type AS ENUM ('percentage', 'fixed')`,
      `CREATE TYPE ranking_period AS ENUM ('monthly', 'quarterly', 'all_time')`,
      `CREATE TYPE avatar_rarity AS ENUM ('common', 'rare', 'epic', 'legendary')`,
    ];
    
    for (const typeSQL of types) {
      try {
        await client.query(typeSQL);
      } catch (error) {
        if (error.code !== '42710') { // 忽略"类型已存在"错误
          throw error;
        }
      }
    }
    console.log('✅ 类型和扩展创建完成\n');
    
    // 迁移文件列表
    const migrations = [
      '20241210_000001_create_core_tables.sql',
      '20241210_000002_create_auxiliary_tables.sql',
    ];
    
    for (const migration of migrations) {
      console.log(`运行迁移: ${migration}`);
      const migrationPath = path.join(__dirname, '..', 'migrations', migration);
      const sql = fs.readFileSync(migrationPath, 'utf8');
      
      await client.query(sql);
      console.log(`✅ ${migration} 完成\n`);
    }
    
    console.log('✅ 所有迁移完成！\n');
    
  } catch (error) {
    console.error('❌ 迁移失败:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// 运行迁移
runMigrations().catch(console.error);
