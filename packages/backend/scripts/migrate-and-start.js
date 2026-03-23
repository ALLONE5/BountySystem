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

const MIGRATIONS_DIR = path.resolve(__dirname, '../../database/migrations');
const INIT_SQL = path.resolve(__dirname, '../../database/scripts/init.sql');

// 这些错误说明内容已存在，可以安全跳过
function isAlreadyExistsError(msg) {
  return msg.includes('already exists') ||
         msg.includes('duplicate key') ||
         msg.includes('already exists');
}

async function migrate() {
  const client = await pool.connect();
  try {
    // 1. init.sql: 扩展和枚举类型
    const initSql = fs.readFileSync(INIT_SQL, 'utf8')
      .split('\n').filter(l => !l.trim().startsWith('\\')).join('\n');
    for (const stmt of initSql.split(';').map(s => s.trim()).filter(Boolean)) {
      try { await client.query(stmt); } catch(e) {
        if (!isAlreadyExistsError(e.message)) throw e;
      }
    }
    console.log('[migrate] init.sql done');

    // 2. 确保 _migrations 表存在且结构正确
    // 检查是否有旧版 id 列
    const { rows: cols } = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = '_migrations'
    `);
    const hasIdCol = cols.some(r => r.column_name === 'id');
    const hasFilenameCol = cols.some(r => r.column_name === 'filename');

    if (hasIdCol || !hasFilenameCol) {
      // 旧结构，重建
      await client.query('DROP TABLE IF EXISTS _migrations');
      console.log('[migrate] Rebuilt _migrations table');
    }

    await client.query(`CREATE TABLE IF NOT EXISTS _migrations (
      filename VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMP DEFAULT NOW()
    )`);

    // 3. 按顺序执行迁移
    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const { rows } = await client.query(
        'SELECT filename FROM _migrations WHERE filename = $1', [file]
      );
      if (rows.length > 0) {
        console.log('[migrate] skip: ' + file);
        continue;
      }

      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
      try {
        await client.query(sql);
        await client.query('INSERT INTO _migrations(filename) VALUES($1)', [file]);
        console.log('[migrate] ok: ' + file);
      } catch(e) {
        if (isAlreadyExistsError(e.message)) {
          // 内容已存在，记录为已执行并继续
          await client.query(
            'INSERT INTO _migrations(filename) VALUES($1) ON CONFLICT DO NOTHING', [file]
          );
          console.log('[migrate] skip (already exists): ' + file);
        } else {
          console.error('[migrate] fail: ' + file + ' - ' + e.message);
          throw e;
        }
      }
    }
    console.log('[migrate] All done');
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().then(() => {
  console.log('[start] Starting server...');
  const { spawn } = require('child_process');
  const server = spawn('node', ['packages/backend/dist/index.js'], {
    stdio: 'inherit',
    env: process.env,
  });
  server.on('exit', code => process.exit(code));
}).catch(e => {
  console.error('[migrate] Fatal:', e.message);
  process.exit(1);
});
