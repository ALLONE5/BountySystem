#!/usr/bin/env node
/**
 * 生产环境数据库迁移脚本 (CommonJS)
 * 在 Railway Pre-deploy Command 中运行
 */
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

// 迁移文件相对于项目根目录的路径
const MIGRATIONS_DIR = path.resolve(__dirname, '../../database/migrations');

const MIGRATION_FILES = [
  '20241210_000001_create_core_tables.sql',
  '20241210_000002_create_auxiliary_tables.sql',
  '20260306_000001_add_performance_indexes.sql',
  '20260310_000002_add_p1_performance_indexes.sql',
];

async function runMigrations() {
  const client = await pool.connect();
  try {
    // 创建迁移记录表
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMP DEFAULT NOW()
      )
    `);

    for (const file of MIGRATION_FILES) {
      // 检查是否已执行
      const { rows } = await client.query(
        'SELECT id FROM _migrations WHERE filename = $1',
        [file]
      );
      if (rows.length > 0) {
        console.log(`- ${file} (already applied)`);
        continue;
      }

      const filePath = path.join(MIGRATIONS_DIR, file);
      if (!fs.existsSync(filePath)) {
        console.warn(`! ${file} not found, skipping`);
        continue;
      }

      const sql = fs.readFileSync(filePath, 'utf8');
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO _migrations (filename) VALUES ($1)',
          [file]
        );
        await client.query('COMMIT');
        console.log(`✓ ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        // 如果是"already exists"类错误，记录为已应用并继续
        if (err.message && (err.message.includes('already exists') || err.message.includes('duplicate'))) {
          await client.query(
            'INSERT INTO _migrations (filename) VALUES ($1) ON CONFLICT DO NOTHING',
            [file]
          );
          console.log(`- ${file} (tables already exist)`);
        } else {
          throw err;
        }
      }
    }

    console.log('All migrations completed.');
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations().catch(err => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
