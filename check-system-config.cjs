const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'bounty_hunter',
  user: 'postgres',
  password: '123456'
});

async function checkSystemConfig() {
  try {
    // 检查system_config表是否存在
    const tableResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'system_config'
      );
    `);
    
    console.log('system_config table exists:', tableResult.rows[0].exists);
    
    if (tableResult.rows[0].exists) {
      // 检查表中的数据
      const configResult = await pool.query('SELECT * FROM system_config');
      console.log('System config count:', configResult.rows.length);
      
      if (configResult.rows.length > 0) {
        console.log('System config data:');
        configResult.rows.forEach((config, index) => {
          console.log(`Config ${index + 1}:`, config);
        });
      } else {
        console.log('No system config found in database');
      }
    }
    
    await pool.end();
  } catch (error) {
    console.error('Error checking system config:', error);
    process.exit(1);
  }
}

checkSystemConfig();