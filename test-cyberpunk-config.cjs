const fetch = require('node-fetch');

async function testCyberpunkConfig() {
  try {
    console.log('🔍 Testing cyberpunk configuration...');
    
    // Test public config API
    const response = await fetch('http://localhost:3000/api/system-config/public');
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const config = await response.json();
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
    
  } catch (error) {
    console.error('❌ Error testing configuration:', error.message);
  }
}

testCyberpunkConfig();