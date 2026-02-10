const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'task_management',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function testNotificationPreferences() {
  const client = await pool.connect();
  
  try {
    console.log('Testing notification preferences functionality...\n');
    
    // Get a test user
    const userQuery = `
      SELECT id, username, notification_preferences 
      FROM users 
      WHERE role = 'super_admin' 
      LIMIT 1
    `;
    const userResult = await client.query(userQuery);
    
    if (userResult.rows.length === 0) {
      console.log('❌ No admin user found for testing');
      return;
    }
    
    const user = userResult.rows[0];
    console.log(`📋 Testing with user: ${user.username} (${user.id})`);
    console.log(`📋 Current preferences:`, user.notification_preferences);
    
    // Test updating notification preferences
    const newPreferences = {
      taskAssigned: false,
      taskCompleted: true,
      taskAbandoned: false,
      bountyReceived: true,
      systemNotifications: true,
    };
    
    console.log(`\n🔄 Updating preferences to:`, newPreferences);
    
    const updateQuery = `
      UPDATE users
      SET notification_preferences = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id, username, notification_preferences
    `;
    
    const updateResult = await client.query(updateQuery, [JSON.stringify(newPreferences), user.id]);
    const updatedUser = updateResult.rows[0];
    
    console.log(`✅ Updated preferences:`, updatedUser.notification_preferences);
    
    // Test retrieving preferences
    const getQuery = `
      SELECT notification_preferences
      FROM users
      WHERE id = $1
    `;
    
    const getResult = await client.query(getQuery, [user.id]);
    const retrievedPreferences = getResult.rows[0].notification_preferences;
    
    console.log(`📥 Retrieved preferences:`, retrievedPreferences);
    
    // Verify the update worked
    const prefsMatch = JSON.stringify(newPreferences) === JSON.stringify(retrievedPreferences);
    console.log(`\n${prefsMatch ? '✅' : '❌'} Preferences update test: ${prefsMatch ? 'PASSED' : 'FAILED'}`);
    
    // Test default preferences for users without settings
    const defaultPrefsQuery = `
      SELECT 
        id, 
        username,
        COALESCE(notification_preferences, '{
          "taskAssigned": true,
          "taskCompleted": true,
          "taskAbandoned": true,
          "bountyReceived": true,
          "systemNotifications": true
        }'::jsonb) as notification_preferences
      FROM users 
      WHERE notification_preferences IS NULL 
      LIMIT 1
    `;
    
    const defaultResult = await client.query(defaultPrefsQuery);
    if (defaultResult.rows.length > 0) {
      console.log(`\n📋 Default preferences for user without settings:`, defaultResult.rows[0].notification_preferences);
    } else {
      console.log(`\n📋 All users have notification preferences set`);
    }
    
    // Test JSONB query capabilities
    const jsonbTestQuery = `
      SELECT 
        id, 
        username,
        notification_preferences->>'taskAssigned' as task_assigned_pref,
        notification_preferences->>'systemNotifications' as system_notifications_pref
      FROM users 
      WHERE notification_preferences->>'taskAssigned' = 'false'
      LIMIT 3
    `;
    
    const jsonbResult = await client.query(jsonbTestQuery);
    console.log(`\n🔍 Users with taskAssigned = false:`, jsonbResult.rows.length);
    jsonbResult.rows.forEach(row => {
      console.log(`  - ${row.username}: taskAssigned=${row.task_assigned_pref}, systemNotifications=${row.system_notifications_pref}`);
    });
    
    console.log(`\n✅ All notification preferences tests completed successfully!`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

testNotificationPreferences().catch(console.error);