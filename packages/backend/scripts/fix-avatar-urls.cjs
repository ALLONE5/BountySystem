
const { Pool } = require('pg');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'bounty_hunter',
  password: process.env.DB_PASSWORD || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432'),
});

async function fixAvatarUrls() {
  const client = await pool.connect();
  try {
    console.log('Updating avatar URLs to use DiceBear...');

    const updates = [
      { name: '青铜猎人', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Bronze' },
      { name: '白银猎人', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Silver' },
      { name: '黄金猎人', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Gold' },
      { name: '钻石猎人', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Diamond' }
    ];

    for (const update of updates) {
      const res = await client.query(
        `UPDATE avatars SET image_url = $1 WHERE name = $2 RETURNING *`,
        [update.url, update.name]
      );
      if (res.rowCount > 0) {
        console.log(`Updated ${update.name} to ${update.url}`);
      } else {
        console.log(`Avatar ${update.name} not found.`);
      }
    }

    console.log('Avatar URLs updated successfully.');
  } catch (error) {
    console.error('Error updating avatar URLs:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

fixAvatarUrls();
