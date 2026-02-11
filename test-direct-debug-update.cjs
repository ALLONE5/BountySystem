const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testDirectDebugUpdate() {
  console.log('🧪 Testing direct debug mode update...\n');

  try {
    // Login as admin
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'admin',
      password: 'Password123'
    });

    const token = loginResponse.data.token;
    const headers = { Authorization: `Bearer ${token}` };

    // Test with just debugMode field
    console.log('Testing update with only debugMode field...');
    
    try {
      const updateResponse = await axios.put(`${BASE_URL}/admin/system/config`, {
        debugMode: false
      }, { headers });
      
      console.log('Update response:', JSON.stringify(updateResponse.data, null, 2));
    } catch (error) {
      console.error('Update error:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testDirectDebugUpdate();