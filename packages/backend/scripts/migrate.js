#!/usr/bin/env node
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

const MIGRATIONS_DIR = path.resolve(__dirname, '../migrations');
const INIT_SQL = path.resolve(__dirname, '../migrations/init.sql');

async function run() {
  const client = await pool.connect();
  try {
    // 1. 执行 init.sql（扩展和枚举类型），逐条执行忽略 already exists
    const initSql = fs.readFileSync(INIT_SQL, 'utf8')
      .split('\n')
      .filter(line => !line.trim().startsWith('\\'))
      .join('\n');

    for (const stmt of initSql.split(';').map(s => s.trim()).filter(Boolean)) {
      try {
        await client.query(stmt);
      } catch (err) {
        if (!err.message.includes('already exists')) throw err;
      }
    }
    console.log('✓ init.sql');

    // 2. 创建迁移记录表
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        filename VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // 3. 按顺序执行迁移文件（跳过 init.sql）
    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter(f => f.endsWith('.sql') && f !== 'init.sql')
      .sort();

    for (const file of files) {
      const { rows } = await client.query(
        'SELECT filename FROM _migrations WHERE filename = $1', [file]
      );
      if (rows.length > 0) {
        console.log(`- ${file} (skipped)`);
        continue;
      }

      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
      try {
        await client.query(sql);
        await client.query('INSERT INTO _migrations (filename) VALUES ($1)', [file]);
        console.log(`✓ ${file}`);
      } catch (err) {
        console.error(`\nMigration failed: ${file}`);
        console.error(`Error: ${err.message}`);
        console.error(`Detail: ${err.detail || 'none'}`);
        throw err;
      }
    }
    console.log('\nAll migrations done.');
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(e => {
  console.error('Migration failed:', e.message);
  process.exit(1);
});
