const fetch = require('node-fetch');

async function fixConstraints() {
  try {
    console.log('🔧 Fixing database constraints...');
    
    // Login as developer first
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'dev_test_840023',
        password: 'DevTest123'
      })
    });
    
    const loginResult = await loginResponse.json();
    const token = loginResult.token;
    
    // Try to update with a supported animation style first
    console.log('🎨 Updating to supported animation style...');
    const updateResponse = await fetch('http://localhost:3000/api/admin/system/config', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        defaultTheme: 'dark',
        animationStyle: 'scanline',
        enableAnimations: true,
        allowThemeSwitch: true
      })
    });
    
    if (updateResponse.ok) {
      console.log('✅ Updated to scanline animation successfully');
      
      // Now verify the current config
      const verifyResponse = await fetch('http://localhost:3000/api/public/config');
      const verifyResult = await verifyResponse.json();
      const config = verifyResult.data;
      
      console.log('📋 Current configuration:');
      console.log(`  - Default Theme: ${config.defaultTheme}`);
      console.log(`  - Animation Style: ${config.animationStyle}`);
      
      console.log('\n💡 To enable cyberpunk theme, we need to update the database constraints first.');
      console.log('   The system is now running with scanline animation as a temporary solution.');
      
    } else {
      const errorText = await updateResponse.text();
      console.log('❌ Update failed:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixConstraints();