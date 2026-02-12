const axios = require('axios');

async function testSystemConfigAPI() {
  try {
    console.log('🧪 Testing system configuration API...\n');
    
    // First, let's try to login to get a token
    console.log('1. Attempting to login...');
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      username: 'developer',
      password: 'Password123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful, token obtained');
    
    // Test getting system configuration
    console.log('\n2. Getting current system configuration...');
    const getResponse = await axios.get('http://localhost:3000/api/admin/system/config', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Current config:', JSON.stringify(getResponse.data.data, null, 2));
    
    // Test updating system configuration
    console.log('\n3. Updating system configuration...');
    const updateData = {
      siteName: '测试赏金平台',
      siteDescription: '这是一个测试描述',
      allowRegistration: false,
      maxFileSize: 15
    };
    
    const updateResponse = await axios.put('http://localhost:3000/api/admin/system/config', updateData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Update successful:', updateResponse.data.message);
    console.log('📊 Updated config:', JSON.stringify(updateResponse.data.data, null, 2));
    
    // Test individual endpoints
    console.log('\n4. Testing individual endpoints...');
    
    const maintenanceResponse = await axios.get('http://localhost:3000/api/admin/system/maintenance', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('✅ Maintenance mode:', maintenanceResponse.data.data.maintenanceMode);
    
    const registrationResponse = await axios.get('http://localhost:3000/api/admin/system/registration', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('✅ Registration allowed:', registrationResponse.data.data.allowRegistration);
    
    const fileSizeResponse = await axios.get('http://localhost:3000/api/admin/system/file-size', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('✅ Max file size:', fileSizeResponse.data.data.maxFileSize, 'MB');
    
    console.log('\n🎉 All system configuration API tests passed!');
    
  } catch (error) {
    console.error('❌ API Test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('💡 Tip: Make sure you have a valid admin user with username "admin" and password "Password123"');
    }
  }
}

testSystemConfigAPI();