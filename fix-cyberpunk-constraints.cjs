#!/usr/bin/env node

/**
 * Script to fix database constraints for cyberpunk and matrix animation styles
 * This updates the CHECK constraints in the system_config table
 */

const pg = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'packages/backend/.env') });

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'bounty_hunter',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

const SQL = `
-- Drop the existing constraints
ALTER TABLE system_config DROP CONSTRAINT IF EXISTS system_config_animation_style_check;
ALTER TABLE system_config DROP CONSTRAINT IF EXISTS system_config_default_theme_check;

-- Add the new constraint with cyberpunk and matrix options
ALTER TABLE system_config ADD CONSTRAINT system_config_animation_style_check 
CHECK (animation_style IN ('none', 'minimal', 'scanline', 'particles', 'hexagon', 'datastream', 'hologram', 'ripple', 'cyberpunk', 'matrix'));

-- Add the new constraint with cyberpunk theme option
ALTER TABLE system_config ADD CONSTRAINT system_config_default_theme_check 
CHECK (default_theme IN ('light', 'dark', 'cyberpunk'));
`;

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('🔧 开始更新数据库约束...');
    console.log('📍 数据库:', process.env.DB_NAME || 'bounty_hunter');
    console.log('');

    // Split SQL into individual statements
    const statements = SQL.split(';').filter(s => s.trim());

    for (const statement of statements) {
      if (statement.trim()) {
        console.log('执行:', statement.trim().substring(0, 80) + '...');
        await client.query(statement);
      }
    }

    console.log('');
    console.log('✅ 数据库约束更新成功！');
    console.log('');
    console.log('现在你可以：');
    console.log('1. 登录开发者账户 (dev_test_840023 / DevTest123)');
    console.log('2. 进入"管理功能" → "系统配置"');
    console.log('3. 选择"赛博朋克主题 (赛博战士)"和"赛博朋克"动画');
    console.log('4. 点击"保存配置"');
    console.log('');
    console.log('🎉 享受赛博朋克主题！');

  } catch (error) {
    console.error('❌ 更新失败:', error.message);
    console.error('');
    console.error('错误详情:', error);
    process.exit(1);
  } finally {
    await client.release();
    await pool.end();
  }
}

runMigration();
