const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'bounty_hunter',
  password: '123456',
  port: 5432,
});

async function checkSystemConfig() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking system_config table...\n');
    
    // Check if debug_mode column exists
    const columnCheck = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'system_config' AND column_name = 'debug_mode'
    `);
    
    console.log('Debug mode column info:', columnCheck.rows);
    
    // Check current system config records
    const configCheck = await client.query(`
      SELECT 
        id,
        site_name,
        debug_mode,
        maintenance_mode,
        created_at,
        updated_at
      FROM system_config 
      ORDER BY created_at DESC
    `);
    
    console.log('\nCurrent system config records:');
    configCheck.rows.forEach((row, index) => {
      console.log(`${index + 1}. ID: ${row.id}`);
      console.log(`   Site Name: ${row.site_name}`);
      console.log(`   Debug Mode: ${row.debug_mode}`);
      console.log(`   Maintenance Mode: ${row.maintenance_mode}`);
      console.log(`   Created: ${row.created_at}`);
      console.log(`   Updated: ${row.updated_at}`);
      console.log('');
    });
    
    // Try to manually update debug_mode
    console.log('🔄 Manually updating debug_mode to true...');
    const updateResult = await client.query(`
      UPDATE system_config 
      SET debug_mode = true, updated_at = NOW()
      WHERE id = (SELECT id FROM system_config ORDER BY created_at DESC LIMIT 1)
      RETURNING id, debug_mode, updated_at
    `);
    
    console.log('Update result:', updateResult.rows);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkSystemConfig();