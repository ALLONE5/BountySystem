#!/usr/bin/env node

/**
 * Script to run performance optimization migration
 * Adds indexes and creates materialized views for better query performance
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../../backend/.env') });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'bounty_hunter',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('Starting performance optimization migration...');
    
    // Read migration file
    const migrationPath = path.join(__dirname, '../migrations/20241211_000002_add_performance_indexes.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute migration
    await client.query(migrationSQL);
    
    console.log('✓ Performance optimization migration completed successfully');
    console.log('✓ Added composite indexes for common query patterns');
    console.log('✓ Added partial indexes for specific queries');
    console.log('✓ Added full-text search indexes');
    console.log('✓ Created materialized view for current month rankings');
    console.log('✓ Updated table statistics');
    
  } catch (error) {
    console.error('Error running migration:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migration
runMigration()
  .then(() => {
    console.log('\nMigration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nMigration failed:', error.message);
    process.exit(1);
  });
