const { pool } = require('../src/config/database.js');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    const migrationPath = path.join(__dirname, '../../database/migrations/20260212_000002_update_theme_constraints.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('🔧 Running theme constraints migration...');
    await pool.query(sql);
    console.log('✅ Theme constraints migration completed successfully');
    
    // Verify the constraints
    const result = await pool.query(`
      SELECT conname, consrc 
      FROM pg_constraint 
      WHERE conrelid = 'system_config'::regclass 
      AND (conname LIKE '%theme%' OR conname LIKE '%animation%')
    `);
    
    console.log('📊 Updated constraints:');
    result.rows.forEach(row => {
      console.log(`  - ${row.conname}: ${row.consrc}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();