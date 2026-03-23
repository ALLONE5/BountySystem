#!/usr/bin/env node
/**
 * Railway 启动入口：先跑迁移，再启动服务
 */
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

async function migrate() {
  const client = await pool.connect();
  try {
    // 1. init.sql: 创建扩展和枚举类型
    const initSql = fs.readFileSync(INIT_SQL, 'utf8')
      .split('\n').filter(l => !l.trim().startsWith('\\')).join('\n');
    for (const stmt of initSql.split(';').map(s => s.trim()).filter(Boolean)) {
      try { await client.query(stmt); } catch(e) {
        if (!e.message.includes('already exists')) throw e;
      }
    }
    console.log('[migrate] init.sql done');

    // 2. 重建 _migrations 表
    await client.query('DROP TABLE IF EXISTS _migrations');
    await client.query(`CREATE TABLE _migrations (
      filename VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMP DEFAULT NOW()
    )`);

    // 3. 按顺序执行所有迁移
    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
      try {
        await client.query(sql);
        await client.query('INSERT INTO _migrations(filename) VALUES($1)', [file]);
        console.log('[migrate] ok: ' + file);
      } catch(e) {
        console.error('[migrate] fail: ' + file + ' - ' + e.message);
        throw e;
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
  // 启动服务，替换当前进程
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
