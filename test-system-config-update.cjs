const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

async function testSystemConfigUpdate() {
  console.log('🧪 Testing system configuration update...\n');

  try {
    // 1. Login as admin
    console.log('1. Attempting to login...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      username: 'admin',
      password: 'Password123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Login successful, token obtained\n');

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // 2. Get current config
    console.log('2. Getting current system configuration...');
    const currentConfigResponse = await axios.get(`${API_BASE_URL}/admin/system/config`, { headers });
    const currentConfig = currentConfigResponse.data.data;
    console.log('✅ Current config:', JSON.stringify(currentConfig, null, 2));
    console.log('📝 Current site name:', currentConfig.siteName);
    console.log('📝 Current logo URL:', currentConfig.logoUrl);
    console.log('');

    // 3. Update config with new values
    console.log('3. Updating system configuration...');
    const updateData = {
      siteName: '新的赏金平台名称',
      siteDescription: '这是更新后的描述',
      allowRegistration: true,
      maintenanceMode: false,
      maxFileSize: 20,
      emailEnabled: false
    };

    const updateResponse = await axios.put(`${API_BASE_URL}/admin/system/config`, updateData, { headers });
    const updatedConfig = updateResponse.data.data;
    console.log('✅ Update successful');
    console.log('📊 Updated config:', JSON.stringify(updatedConfig, null, 2));
    console.log('📝 New site name:', updatedConfig.siteName);
    console.log('📝 Logo URL:', updatedConfig.logoUrl);
    console.log('');

    // 4. Verify the update
    console.log('4. Verifying the update...');
    const verifyResponse = await axios.get(`${API_BASE_URL}/admin/system/config`, { headers });
    const verifiedConfig = verifyResponse.data.data;
    
    if (verifiedConfig.siteName === updateData.siteName) {
      console.log('✅ Site name update verified');
    } else {
      console.log('❌ Site name update failed');
    }

    if (verifiedConfig.siteDescription === updateData.siteDescription) {
      console.log('✅ Site description update verified');
    } else {
      console.log('❌ Site description update failed');
    }

    console.log('\n🎉 System configuration update test completed!');
    console.log('\n📋 Instructions for frontend:');
    console.log('1. Open the browser and go to http://localhost:5173');
    console.log('2. Login as admin (username: admin, password: admin123)');
    console.log('3. Check if the header shows the new site name:', updatedConfig.siteName);
    console.log('4. Check if the browser tab title shows the new site name');
    console.log('5. If there\'s a logo URL, check if it displays in the header');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.log('💡 Hint: Make sure the admin user exists and the password is correct');
    }
  }
}

testSystemConfigUpdate();