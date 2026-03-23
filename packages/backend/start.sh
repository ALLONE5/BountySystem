#!/bin/sh
echo "Fixing and running migrations..."

node << 'MIGRATION_SCRIPT'
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

const MIGRATIONS_DIR = path.resolve(__dirname, 'migrations');
const INIT_SQL = path.resolve(__dirname, 'migrations/init.sql');

async function run() {
  const client = await pool.connect();
  try {
    // init.sql: extensions and enum types
    const initSql = fs.readFileSync(INIT_SQL, 'utf8')
      .split('\n').filter(l => !l.trim().startsWith('\\')).join('\n');
    for (const stmt of initSql.split(';').map(s => s.trim()).filter(Boolean)) {
      try { await client.query(stmt); } catch(e) {
        if (!e.message.includes('already exists')) throw e;
      }
    }
    console.log('init.sql done');

    // Force recreate _migrations table with correct schema
    await client.query('DROP TABLE IF EXISTS _migrations');
    await client.query(`CREATE TABLE _migrations (
      filename VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMP DEFAULT NOW()
    )`);

    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter(f => f.endsWith('.sql') && f !== 'init.sql')
      .sort();

    for (const file of files) {
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
      try {
        await client.query(sql);
        await client.query('INSERT INTO _migrations(filename) VALUES($1)', [file]);
        console.log('ok: ' + file);
      } catch(e) {
        console.error('fail: ' + file + ' - ' + e.message);
        throw e;
      }
    }
    console.log('All migrations done');
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(e => { console.error(e.message); process.exit(1); });
MIGRATION_SCRIPT

echo "Starting server..."
exec node dist/index.js
