const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testFaviconAndDebugFix() {
  console.log('🧪 Testing favicon and debug mode fixes...\n');

  try {
    // Step 1: Test public config API (should include debugMode)
    console.log('1. Testing public config API...');
    const publicResponse = await axios.get(`${BASE_URL}/public/config`);
    const publicConfig = publicResponse.data.data;
    
    console.log('✅ Public config loaded:');
    console.log(`   Site Name: ${publicConfig.siteName}`);
    console.log(`   Logo URL: ${publicConfig.logoUrl}`);
    console.log(`   Description: ${publicConfig.siteDescription}`);
    console.log(`   Debug Mode: ${publicConfig.debugMode}`);

    // Step 2: Login as admin to test system config
    console.log('\n2. Logging in as admin...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'admin',
      password: 'Password123'
    });

    const token = loginResponse.data.token;
    const headers = { Authorization: `Bearer ${token}` };
    console.log('✅ Login successful');

    // Step 3: Get full system config
    console.log('\n3. Testing admin system config API...');
    const configResponse = await axios.get(`${BASE_URL}/admin/system/config`, { headers });
    const fullConfig = configResponse.data.data;
    
    console.log('✅ Full system config loaded:');
    console.log(`   Site Name: ${fullConfig.siteName}`);
    console.log(`   Logo URL: ${fullConfig.logoUrl}`);
    console.log(`   Debug Mode: ${fullConfig.debugMode}`);
    console.log(`   Maintenance Mode: ${fullConfig.maintenanceMode}`);

    // Step 4: Test updating debug mode
    console.log('\n4. Testing debug mode toggle...');
    const currentDebugMode = fullConfig.debugMode;
    const newDebugMode = !currentDebugMode;
    
    const updateResponse = await axios.put(`${BASE_URL}/admin/system/config`, {
      debugMode: newDebugMode
    }, { headers });
    
    const updatedConfig = updateResponse.data.data;
    console.log(`✅ Debug mode updated from ${currentDebugMode} to ${updatedConfig.debugMode}`);

    // Step 5: Verify public config also reflects the change
    console.log('\n5. Verifying public config reflects debug mode change...');
    const updatedPublicResponse = await axios.get(`${BASE_URL}/public/config`);
    const updatedPublicConfig = updatedPublicResponse.data.data;
    
    if (updatedPublicConfig.debugMode === newDebugMode) {
      console.log('✅ Public config correctly reflects debug mode change');
    } else {
      console.log('❌ Public config does not reflect debug mode change');
    }

    // Step 6: Test favicon URL construction
    console.log('\n6. Testing favicon URL construction...');
    if (publicConfig.logoUrl) {
      const baseUrl = 'http://localhost:3000';
      let faviconUrl = publicConfig.logoUrl;
      if (!publicConfig.logoUrl.startsWith('http')) {
        faviconUrl = `${baseUrl}${publicConfig.logoUrl.startsWith('/') ? publicConfig.logoUrl : '/' + publicConfig.logoUrl}`;
      }
      console.log(`✅ Favicon URL: ${faviconUrl}`);
      
      // Test if the favicon URL is accessible
      try {
        const faviconResponse = await axios.head(faviconUrl);
        console.log(`✅ Favicon is accessible (status: ${faviconResponse.status})`);
      } catch (error) {
        console.log(`⚠️  Favicon URL not accessible: ${error.response?.status || error.message}`);
      }
    } else {
      console.log('ℹ️  No logo URL configured');
    }

    console.log('\n🎉 All tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testFaviconAndDebugFix();