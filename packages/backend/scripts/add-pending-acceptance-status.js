import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'bounty_hunter',
  user: 'postgres',
  password: '123456',
});

async function addPendingAcceptanceStatus() {
  const client = await pool.connect();
  
  try {
    console.log('Adding PENDING_ACCEPTANCE to task_status enum...');
    
    // Check if the value already exists
    const checkQuery = `
      SELECT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'pending_acceptance' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'task_status')
      ) as exists;
    `;
    
    const checkResult = await client.query(checkQuery);
    
    if (checkResult.rows[0].exists) {
      console.log('⚠️  PENDING_ACCEPTANCE already exists in task_status enum');
    } else {
      // Add the new enum value
      await client.query(`
        ALTER TYPE task_status ADD VALUE 'pending_acceptance' AFTER 'available';
      `);
      
      console.log('✅ Successfully added PENDING_ACCEPTANCE to task_status enum!');
    }
  } catch (error) {
    console.error('❌ Failed to add enum value:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addPendingAcceptanceStatus().catch(console.error);
