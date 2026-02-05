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

    const seedSqlPath = path.join(__dirname, '../../../packages/database/scripts/seed_data.sql');
    const seedSql = fs.readFileSync(seedSqlPath, 'utf8');
    
    console.log('Running seed_data.sql...');
    await client.query(seedSql);
    
    console.log('Seed data inserted.');

  } catch (e) {
    console.error('Seed DB error:', e);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
