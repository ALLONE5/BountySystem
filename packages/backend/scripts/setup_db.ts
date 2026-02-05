import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '123456',
    database: process.env.DB_NAME || 'bounty_hunter'
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // 1. Run init.sql content (types and extensions)
    const initSqlPath = path.join(__dirname, '../../../packages/database/scripts/init.sql');
    let initSql = fs.readFileSync(initSqlPath, 'utf8');
    // Remove \c command
    initSql = initSql.replace(/\\c bounty_hunter;/g, '');
    
    // Split by semicolon to run statements individually if needed, but pg driver can handle multiple statements usually.
    // However, for types, it's safer to run them.
    // Note: init.sql has comments and newlines.
    
    console.log('Running init.sql...');
    try {
        await client.query(initSql);
    } catch (e: any) {
        console.warn('Warning running init.sql (might be types already exist):', e.message);
    }

    // 2. Run migrations
    const migrationsDir = path.join(__dirname, '../../../packages/database/migrations');
    const files = fs.readdirSync(migrationsDir).sort();
    
    for (const file of files) {
      if (file.endsWith('.sql') && !file.includes('rollback')) {
        console.log(`Running migration: ${file}`);
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
        try {
            await client.query(sql);
        } catch (e: any) {
            console.error(`Error running migration ${file}:`, e.message);
            // Don't exit, try next (or maybe we should exit?)
            // For now, let's continue as some might depend on others or be idempotent
        }
      }
    }

    console.log('Database setup complete.');

  } catch (e) {
    console.error('Setup DB error:', e);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
