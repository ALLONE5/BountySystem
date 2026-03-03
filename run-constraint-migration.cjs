const { pool } = require('./packages/backend/src/config/database.js');
const fs = require('fs');
const path = require('path');

async function runConstraintMigration() {
  try {
    const migrationPath = path.join(__dirname, 'packages/database/migrations/20260212_000002_update_animation_constraints.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('🔧 Running constraint migration...');
    await pool.query(sql);
    console.log('✅ Constraint migration completed successfully');
    
    // Verify the constraints
    const result = await pool.query(`
      SELECT conname, consrc 
      FROM pg_constraint 
      WHERE conrelid = 'system_config'::regclass 
      AND conname LIKE '%animation%' OR conname LIKE '%theme%'
    `);
    
    console.log('📋 Updated constraints:');
    result.rows.forEach(row => {
      console.log(`  - ${row.conname}: ${row.consrc}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runConstraintMigration();