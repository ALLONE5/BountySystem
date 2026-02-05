import { Client } from 'pg';

async function main() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '123456',
    database: 'postgres'
  });

  try {
    await client.connect();
    console.log('Connected to postgres DB');
    
    const res = await client.query("SELECT to_regclass('public.tasks')");
    console.log('Tasks table in postgres DB:', res.rows[0].to_regclass);
    
    if (res.rows[0].to_regclass) {
        const res2 = await client.query("SELECT to_regclass('public.project_groups')");
        console.log('Project_groups table in postgres DB:', res2.rows[0].to_regclass);
    }

  } catch (e) {
    console.error('Error:', e);
  } finally {
    await client.end();
  }
}

main();
