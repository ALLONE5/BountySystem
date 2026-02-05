import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  // 1. Connect to postgres to drop/create DB
  const adminClient = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '123456',
    database: 'postgres'
  });

  try {
    await adminClient.connect();
    console.log('Connected to postgres DB');

    // Drop database if exists
    await adminClient.query('DROP DATABASE IF EXISTS bounty_hunter');
    console.log('Dropped database bounty_hunter');

    // Create database
    await adminClient.query('CREATE DATABASE bounty_hunter');
    console.log('Created database bounty_hunter');
  } catch (e) {
    console.error('Error resetting DB:', e);
    process.exit(1);
  } finally {
    await adminClient.end();
  }

  // 2. Connect to new DB to run schema
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '123456',
    database: 'bounty_hunter'
  });

  try {
    await client.connect();
    console.log('Connected to bounty_hunter DB');

    // Run init.sql content (types and extensions)
    const initSqlPath = path.join(__dirname, '../../../packages/database/scripts/init.sql');
    let initSql = fs.readFileSync(initSqlPath, 'utf8');
    initSql = initSql.replace(/\\c bounty_hunter;/g, '');
    
    console.log('Running init.sql...');
    await client.query(initSql);

    // Run migrations
    const migrationsDir = path.join(__dirname, '../../../packages/database/migrations');
    const files = fs.readdirSync(migrationsDir).sort();
    
    for (const file of files) {
      if (file.endsWith('.sql') && !file.includes('rollback')) {
        console.log(`Running migration: ${file}`);
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
        await client.query(sql);
      }
    }

    console.log('Database reset and setup complete.');

  } catch (e) {
    console.error('Setup DB error:', e);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
