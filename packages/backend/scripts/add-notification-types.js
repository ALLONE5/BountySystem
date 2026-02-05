import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'bounty_hunter',
  user: 'postgres',
  password: '123456',
});

async function addNotificationTypes() {
  const client = await pool.connect();
  
  try {
    console.log('Adding new notification types to notification_type enum...');
    
    const newTypes = [
      'task_assignment_invitation',
      'task_assignment_accepted',
      'task_assignment_rejected'
    ];
    
    for (const type of newTypes) {
      // Check if the value already exists
      const checkQuery = `
        SELECT EXISTS (
          SELECT 1 FROM pg_enum 
          WHERE enumlabel = $1
          AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notification_type')
        ) as exists;
      `;
      
      const checkResult = await client.query(checkQuery, [type]);
      
      if (checkResult.rows[0].exists) {
        console.log(`⚠️  ${type} already exists`);
      } else {
        // Add the new enum value
        await client.query(`
          ALTER TYPE notification_type ADD VALUE '${type}';
        `);
        
        console.log(`✅ Added ${type}`);
      }
    }
    
    console.log('\n✅ All notification types added successfully!');
  } catch (error) {
    console.error('❌ Failed to add enum values:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addNotificationTypes().catch(console.error);
