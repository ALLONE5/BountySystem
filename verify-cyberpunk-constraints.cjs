#!/usr/bin/env node

/**
 * Script to verify that the cyberpunk constraints were properly applied
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

async function verifyConstraints() {
  const client = await pool.connect();
  try {
    console.log('🔍 验证数据库约束...\n');

    // Check constraints
    const result = await client.query(`
      SELECT cc.constraint_name, cc.check_clause as constraint_definition
      FROM information_schema.check_constraints cc
      WHERE cc.constraint_name LIKE 'system_config%'
      ORDER BY cc.constraint_name;
    `);

    if (result.rows.length === 0) {
      console.log('⚠️  未找到CHECK约束');
      return;
    }

    console.log('✅ 找到以下约束：\n');
    result.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.constraint_name}`);
      console.log(`   定义: ${row.constraint_definition}\n`);
    });

    // Test if we can insert cyberpunk values
    console.log('🧪 测试插入赛博朋克值...\n');
    
    try {
      // First, check if a config exists
      const checkResult = await client.query('SELECT id FROM system_config LIMIT 1');
      
      if (checkResult.rows.length > 0) {
        const configId = checkResult.rows[0].id;
        
        // Try to update with cyberpunk values
        await client.query(
          'UPDATE system_config SET default_theme = $1, animation_style = $2 WHERE id = $3',
          ['cyberpunk', 'cyberpunk', configId]
        );
        
        console.log('✅ 成功插入赛博朋克值！');
        
        // Verify the values were saved
        const verifyResult = await client.query(
          'SELECT default_theme, animation_style FROM system_config WHERE id = $1',
          [configId]
        );
        
        console.log('\n📊 当前配置值：');
        console.log(`   默认主题: ${verifyResult.rows[0].default_theme}`);
        console.log(`   动画风格: ${verifyResult.rows[0].animation_style}`);
      } else {
        console.log('⚠️  数据库中没有system_config记录');
      }
    } catch (error) {
      console.error('❌ 测试失败:', error.message);
    }

    console.log('\n✅ 约束验证完成！');

  } catch (error) {
    console.error('❌ 验证失败:', error.message);
    process.exit(1);
  } finally {
    await client.release();
    await pool.end();
  }
}

verifyConstraints();
