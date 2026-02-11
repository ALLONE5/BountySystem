const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testDebugToggle() {
  console.log('🧪 Testing debug mode toggle...\n');

  try {
    // Login as admin
    console.log('1. Logging in as admin...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'admin',
      password: 'Password123'
    });

    const token = loginResponse.data.token;
    const headers = { Authorization: `Bearer ${token}` };
    console.log('✅ Login successful');

    // Get current config
    console.log('\n2. Getting current config...');
    const configResponse = await axios.get(`${BASE_URL}/admin/system/config`, { headers });
    const currentConfig = configResponse.data.data;
    console.log(`Current debug mode: ${currentConfig.debugMode}`);

    // Toggle debug mode
    console.log('\n3. Toggling debug mode...');
    const newDebugMode = !currentConfig.debugMode;
    console.log(`Updating debug mode to: ${newDebugMode}`);
    
    const updateResponse = await axios.put(`${BASE_URL}/admin/system/config`, {
      debugMode: newDebugMode
    }, { headers });
    
    const updatedConfig = updateResponse.data.data;
    console.log(`✅ Update response - debug mode: ${updatedConfig.debugMode}`);

    // Verify the change
    console.log('\n4. Verifying the change...');
    const verifyResponse = await axios.get(`${BASE_URL}/admin/system/config`, { headers });
    const verifiedConfig = verifyResponse.data.data;
    console.log(`Verified debug mode: ${verifiedConfig.debugMode}`);

    // Check public config
    console.log('\n5. Checking public config...');
    const publicResponse = await axios.get(`${BASE_URL}/public/config`);
    const publicConfig = publicResponse.data.data;
    console.log(`Public config debug mode: ${publicConfig.debugMode}`);

    if (verifiedConfig.debugMode === newDebugMode && publicConfig.debugMode === newDebugMode) {
      console.log('\n✅ SUCCESS: Debug mode toggle works correctly!');
    } else {
      console.log('\n❌ FAILED: Debug mode toggle not working properly');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testDebugToggle();