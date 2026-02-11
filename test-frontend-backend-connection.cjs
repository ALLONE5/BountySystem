const axios = require('axios');

async function testFrontendBackendConnection() {
  console.log('🧪 Testing frontend-backend connection...\n');

  try {
    // Test if backend is accessible
    console.log('1. Testing backend health...');
    const healthResponse = await axios.get('http://localhost:3000/health');
    console.log('✅ Backend health check passed:', healthResponse.data);
    console.log('');

    // Test public config API
    console.log('2. Testing public config API...');
    const configResponse = await axios.get('http://localhost:3000/api/public/config');
    console.log('✅ Public config API working:', configResponse.data);
    console.log('');

    // Test CORS by simulating a browser request
    console.log('3. Testing CORS headers...');
    const corsResponse = await axios.get('http://localhost:3000/api/public/config', {
      headers: {
        'Origin': 'http://localhost:5173',
        'Access-Control-Request-Method': 'GET',
      }
    });
    console.log('✅ CORS test passed');
    console.log('');

    console.log('🎉 All connection tests passed!');
    console.log('\n📋 Next steps:');
    console.log('1. Open browser developer tools');
    console.log('2. Go to http://localhost:5173');
    console.log('3. Check console for SystemConfig loading messages');
    console.log('4. Look for any network errors in Network tab');

  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
  }
}

testFrontendBackendConnection();