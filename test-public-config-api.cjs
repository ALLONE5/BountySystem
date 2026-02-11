const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

async function testPublicConfigAPI() {
  console.log('🧪 Testing public system configuration API...\n');

  try {
    // Test public config endpoint (no authentication required)
    console.log('1. Getting public system configuration...');
    const publicConfigResponse = await axios.get(`${API_BASE_URL}/public/config`);
    const publicConfig = publicConfigResponse.data.data;
    console.log('✅ Public config loaded:', JSON.stringify(publicConfig, null, 2));
    console.log('📝 Site name:', publicConfig.siteName);
    console.log('📝 Logo URL:', publicConfig.logoUrl);
    console.log('📝 Site description:', publicConfig.siteDescription);
    console.log('');

    console.log('🎉 Public configuration API test completed!');
    console.log('\n📋 This endpoint can be used by the frontend without authentication');
    console.log('📋 It provides basic branding information like site name and logo');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.status === 404) {
      console.log('💡 Hint: Make sure the public routes are properly registered');
    }
  }
}

testPublicConfigAPI();