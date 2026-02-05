import { Client } from 'pg';

async function main() {
  const c = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: process.env.DB_PASSWORD,
    database: 'postgres'
  });

  try {
    await c.connect();
    const r = await c.query("SELECT 1 FROM pg_database WHERE datname='bounty_hunter'");
    if (r.rows.length === 0) {
      await c.query("CREATE DATABASE bounty_hunter");
      console.log('Created database bounty_hunter');
    } else {
      console.log('Database bounty_hunter already exists');
    }
  } catch (e) {
    console.error('Create DB error:', e);
    process.exit(1);
  } finally {
    await c.end();
  }
}

main();
