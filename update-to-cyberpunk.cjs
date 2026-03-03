const fetch = require('node-fetch');

async function updateToCyberpunk() {
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
      throw new Error(`Login failed: ${loginResponse.status} ${loginResponse.statusText}`);
    }
    
    const loginResult = await loginResponse.json();
    const token = loginResult.token;
    console.log('✅ Login successful');
    
    // Update system config to cyberpunk theme
    console.log('🎨 Updating to cyberpunk theme...');
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
    
    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      throw new Error(`Update failed: ${updateResponse.status} ${updateResponse.statusText} - ${errorText}`);
    }
    
    const updateResult = await updateResponse.json();
    console.log('✅ System config updated successfully');
    
    // Verify the update
    console.log('🔍 Verifying update...');
    const verifyResponse = await fetch('http://localhost:3000/api/public/config');
    const verifyResult = await verifyResponse.json();
    const config = verifyResult.data;
    
    console.log('📋 Updated configuration:');
    console.log(`  - Default Theme: ${config.defaultTheme}`);
    console.log(`  - Animation Style: ${config.animationStyle}`);
    console.log(`  - Enable Animations: ${config.enableAnimations}`);
    
    if (config.defaultTheme === 'cyberpunk' && config.animationStyle === 'cyberpunk') {
      console.log('🎉 Cyberpunk theme is now active!');
      console.log('🚀 Please refresh your browser to see the new cyberpunk UI');
    } else {
      console.log('⚠️  Update may not have taken effect');
    }
    
  } catch (error) {
    console.error('❌ Error updating to cyberpunk:', error.message);
  }
}

updateToCyberpunk();