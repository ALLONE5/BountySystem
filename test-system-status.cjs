const fetch = require('node-fetch');

async function testSystemStatus() {
  try {
    console.log('🔍 Testing system status...');
    
    // Test different endpoints
    const endpoints = [
      'http://localhost:3000/api/system-config/public',
      'http://localhost:3000/api/systemConfig/public',
      'http://localhost:3000/api/config/public'
    ];
    
    for (const endpoint of endpoints) {
      try {
        console.log(`\n📡 Testing: ${endpoint}`);
        const response = await fetch(endpoint);
        console.log(`   Status: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log('   ✅ Success! Data:', JSON.stringify(data, null, 2));
          return;
        }
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }
    
    // Test basic backend health
    console.log('\n🏥 Testing backend health...');
    const healthResponse = await fetch('http://localhost:3000/api/health');
    console.log(`Health check: ${healthResponse.status} ${healthResponse.statusText}`);
    
  } catch (error) {
    console.error('❌ System test failed:', error.message);
  }
}

testSystemStatus();