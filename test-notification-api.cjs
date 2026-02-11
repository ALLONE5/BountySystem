const axios = require('axios');

async function testNotificationAPI() {
  try {
    console.log('🧪 Testing notification preferences API...\n');
    
    // First, let's try to login to get a token
    console.log('1. Attempting to login...');
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      username: 'admin',
      password: 'Password123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful, token obtained');
    
    // Test getting notification preferences
    console.log('\n2. Getting current notification preferences...');
    const getResponse = await axios.get('http://localhost:3000/api/users/me/notifications', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Current preferences:', getResponse.data.preferences);
    
    // Test updating notification preferences
    console.log('\n3. Updating notification preferences...');
    const newPreferences = {
      taskAssigned: false,
      taskCompleted: true,
      taskAbandoned: false,
      bountyReceived: true,
      systemNotifications: true
    };
    
    const updateResponse = await axios.put('http://localhost:3000/api/users/me/notifications', newPreferences, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Update successful:', updateResponse.data.message);
    
    // Verify the update
    console.log('\n4. Verifying updated preferences...');
    const verifyResponse = await axios.get('http://localhost:3000/api/users/me/notifications', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Updated preferences:', verifyResponse.data.preferences);
    
    // Check if the update was successful
    const updated = verifyResponse.data.preferences;
    const success = updated.taskAssigned === false && 
                   updated.taskCompleted === true && 
                   updated.taskAbandoned === false &&
                   updated.bountyReceived === true &&
                   updated.systemNotifications === true;
    
    console.log(`\n${success ? '✅' : '❌'} API Test Result: ${success ? 'PASSED' : 'FAILED'}`);
    
    if (success) {
      console.log('🎉 All notification preferences API tests passed!');
    } else {
      console.log('❌ Some tests failed. Check the preferences values.');
    }
    
  } catch (error) {
    console.error('❌ API Test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('💡 Tip: Make sure you have a valid admin user with username "admin" and password "Password123"');
    }
  }
}

testNotificationAPI();