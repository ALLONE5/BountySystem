#!/usr/bin/env node
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
};

const MIGRATIONS_DIR = path.resolve(__dirname, '../../database/migrations');
const INIT_SQL = path.resolve(__dirname, '../../database/scripts/init.sql');

// 用独立连接执行单条语句，避免事务污染
async function execSingle(sql) {
  const pool = new Pool(dbConfig);
  try {
    await pool.query(sql);
  } finally {
    await pool.end();
  }
}

async function migrate() {
  // 1. init.sql: 每条语句用独立连接，彻底隔离错误
  const initSql = fs.readFileSync(INIT_SQL, 'utf8')
    .split('\n').filter(l => !l.trim().startsWith('\\')).join('\n');

  for (const stmt of initSql.split(';').map(s => s.trim()).filter(Boolean)) {
    try {
      await execSingle(stmt);
    } catch(e) {
      if (!e.message.includes('already exists')) {
        console.error('[migrate] init error: ' + e.message);
        throw e;
      }
    }
  }
  console.log('[migrate] init.sql done');

  // 2. 主连接处理迁移记录表和迁移文件
  const pool = new Pool(dbConfig);
  const client = await pool.connect();
  try {
    // 检查 _migrations 表结构
    const { rows: cols } = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = '_migrations'
    `);
    const hasId = cols.some(r => r.column_name === 'id');
    const hasFilename = cols.some(r => r.column_name === 'filename');

    if (hasId || !hasFilename) {
      await client.query('DROP TABLE IF EXISTS _migrations');
      console.log('[migrate] dropped old _migrations table');
    }

    await client.query(`CREATE TABLE IF NOT EXISTS _migrations (
      filename VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMP DEFAULT NOW()
    )`);

    // 3. 按顺序执行迁移文件
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
        // 包含 CONCURRENTLY 的文件需要逐条执行（不能在事务块中运行）
        if (sql.includes('CONCURRENTLY')) {
          const stmts = sql.split(';').map(s => s.trim()).filter(Boolean);
          for (const stmt of stmts) {
            try {
              await client.query(stmt);
            } catch(e) {
              if (!e.message.includes('already exists') && !e.message.includes('duplicate')) throw e;
              try { await client.query('ROLLBACK'); } catch(_) {}
            }
          }
        } else {
          await client.query(sql);
        }
        await client.query('INSERT INTO _migrations(filename) VALUES($1)', [file]);
        console.log('[migrate] ok: ' + file);
      } catch(e) {
        if (e.message.includes('already exists') || e.message.includes('duplicate')) {
          try { await client.query('ROLLBACK'); } catch(_) {}
          await client.query(
            'INSERT INTO _migrations(filename) VALUES($1) ON CONFLICT DO NOTHING', [file]
          );
          console.log('[migrate] skip (already exists): ' + file);
        } else if (file.includes('performance_indexes') || file.includes('p1_performance')) {
          try { await client.query('ROLLBACK'); } catch(_) {}
          await client.query(
            'INSERT INTO _migrations(filename) VALUES($1) ON CONFLICT DO NOTHING', [file]
          );
          console.warn('[migrate] warn (non-critical, skipped): ' + file + ' - ' + e.message);
        } else {
          console.error('[migrate] fail: ' + file + ' - ' + e.message);
          throw e;
        }
      }
    }
    console.log('[migrate] All done');

    // 4. 注入默认账号（如果不存在）
    const bcrypt = require('bcrypt');
    const passwordHash = await bcrypt.hash('Password123', 10);
    const seedUsers = [
      { username: 'admin',      email: 'admin@example.com',     role: 'super_admin' },
      { username: 'developer',  email: 'developer@example.com', role: 'developer'   },
      { username: 'nomaluser',  email: 'nomaluser@example.com', role: 'user'        },
    ];
    for (const u of seedUsers) {
      await client.query(
        `INSERT INTO users (username, email, password_hash, role)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (email) DO NOTHING`,
        [u.username, u.email, passwordHash, u.role]
      );
    }
    console.log('[migrate] default users seeded');
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
