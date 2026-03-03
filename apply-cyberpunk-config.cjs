const fetch = require('node-fetch');

async function applyCyberpunkConfig() {
  try {
    console.log('🔐 Logging in as developer...');
    
    // Login as developer
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
    
    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }
    
    const loginResult = await loginResponse.json();
    const token = loginResult.token;
    console.log('✅ Login successful');
    
    // Try to update with cyberpunk theme and animation
    console.log('🎨 Applying cyberpunk configuration...');
    
    const updateResponse = await fetch('http://localhost:3000/api/admin/system/config', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        defaultTheme: 'cyberpunk',
        animationStyle: 'cyberpunk',
        enableAnimations: true,
        allowThemeSwitch: true
      })
    });
    
    if (updateResponse.ok) {
      console.log('✅ Cyberpunk configuration applied successfully!');
      
      // Verify the update
      const verifyResponse = await fetch('http://localhost:3000/api/public/config');
      const verifyResult = await verifyResponse.json();
      const config = verifyResult.data;
      
      console.log('📋 Current configuration:');
      console.log(`  - Theme: ${config.defaultTheme}`);
      console.log(`  - Animation: ${config.animationStyle}`);
      console.log(`  - Animations Enabled: ${config.enableAnimations}`);
      
      if (config.defaultTheme === 'cyberpunk' && config.animationStyle === 'cyberpunk') {
        console.log('🎉 Cyberpunk theme is now active!');
        console.log('🚀 Please refresh your browser to see the cyberpunk UI');
      }
    } else {
      const errorText = await updateResponse.text();
      console.log('❌ Update failed:', errorText);
      
      // Try to parse error
      try {
        const error = JSON.parse(errorText);
        console.log('Error details:', error.message);
        
        // If it's a constraint error, we need to update the database
        if (error.code === '23514') {
          console.log('\n💡 Database constraint error detected');
          console.log('   The database needs to be updated to support cyberpunk theme');
          console.log('   Please run the database migration first');
        }
      } catch (e) {
        // Not JSON, just print as is
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

applyCyberpunkConfig();