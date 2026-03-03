const fetch = require('node-fetch');

async function switchToCyberpunk() {
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
    
    // First, let's try to update with just the theme (not animation)
    console.log('🎨 Attempting to set cyberpunk theme...');
    
    try {
      const updateResponse = await fetch('http://localhost:3000/api/admin/system/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          defaultTheme: 'cyberpunk',
          enableAnimations: true,
          allowThemeSwitch: true
        })
      });
      
      if (updateResponse.ok) {
        console.log('✅ Cyberpunk theme set successfully!');
      } else {
        const errorText = await updateResponse.text();
        console.log('⚠️  Theme update failed, trying animation update...');
        console.log('Error:', errorText);
        
        // If theme fails, try just animation
        const animationResponse = await fetch('http://localhost:3000/api/admin/system/config', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            animationStyle: 'cyberpunk',
            enableAnimations: true
          })
        });
        
        if (animationResponse.ok) {
          console.log('✅ Cyberpunk animation set successfully!');
        } else {
          const animErrorText = await animationResponse.text();
          console.log('❌ Animation update also failed:', animErrorText);
          
          // Fall back to supported options
          console.log('🔄 Falling back to supported options...');
          const fallbackResponse = await fetch('http://localhost:3000/api/admin/system/config', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              defaultTheme: 'dark',
              animationStyle: 'particles',
              enableAnimations: true,
              allowThemeSwitch: true
            })
          });
          
          if (fallbackResponse.ok) {
            console.log('✅ Fallback configuration applied (dark theme with particles)');
          }
        }
      }
    } catch (updateError) {
      console.error('❌ Update error:', updateError.message);
    }
    
    // Verify current configuration
    console.log('🔍 Checking current configuration...');
    const verifyResponse = await fetch('http://localhost:3000/api/public/config');
    if (verifyResponse.ok) {
      const verifyResult = await verifyResponse.json();
      const config = verifyResult.data;
      
      console.log('📋 Current system configuration:');
      console.log(`  - Theme: ${config.defaultTheme}`);
      console.log(`  - Animation: ${config.animationStyle}`);
      console.log(`  - Animations Enabled: ${config.enableAnimations}`);
      console.log(`  - Theme Switch Allowed: ${config.allowThemeSwitch}`);
      
      if (config.defaultTheme === 'cyberpunk' || config.animationStyle === 'cyberpunk') {
        console.log('🎉 Cyberpunk elements are active!');
      } else {
        console.log('💡 Cyberpunk theme requires database constraint updates');
        console.log('   Current setup uses the best available options');
      }
      
      console.log('\n🚀 Please refresh your browser to see the updated UI');
    }
    
  } catch (error) {
    console.error('❌ Error switching to cyberpunk:', error.message);
  }
}

switchToCyberpunk();