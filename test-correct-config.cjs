const fetch = require('node-fetch');

async function testCorrectConfig() {
  try {
    console.log('🔍 Testing correct configuration endpoint...');
    
    // Test the correct public config API
    const response = await fetch('http://localhost:3000/api/public/config');
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    const config = result.data;
    
    console.log('📋 Current system configuration:');
    console.log(`  - Site Name: ${config.siteName}`);
    console.log(`  - Default Theme: ${config.defaultTheme}`);
    console.log(`  - Animation Style: ${config.animationStyle}`);
    console.log(`  - Enable Animations: ${config.enableAnimations}`);
    console.log(`  - Allow Theme Switch: ${config.allowThemeSwitch}`);
    
    if (config.defaultTheme === 'cyberpunk' && config.animationStyle === 'cyberpunk') {
      console.log('✅ Cyberpunk theme is active!');
    } else {
      console.log('⚠️  Cyberpunk theme not yet active');
      console.log('   Current theme:', config.defaultTheme);
      console.log('   Current animation:', config.animationStyle);
    }
    
    // Test health endpoint
    console.log('\n🏥 Testing health endpoint...');
    const healthResponse = await fetch('http://localhost:3000/health');
    if (healthResponse.ok) {
      const health = await healthResponse.json();
      console.log('✅ Backend health:', health.status);
    }
    
  } catch (error) {
    console.error('❌ Error testing configuration:', error.message);
  }
}

testCorrectConfig();