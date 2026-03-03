const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

async function updateCyberpunkConfig() {
  try {
    console.log('🚀 Updating system config to cyberpunk theme...');

    // Login as developer
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      username: 'dev_test_840023',
      password: 'DevTest123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Login successful');

    // Update system config to cyberpunk theme
    const updateResponse = await axios.put(`${API_BASE_URL}/admin/system/config`, {
      defaultTheme: 'cyberpunk',
      animationStyle: 'cyberpunk',
      enableAnimations: true,
      allowThemeSwitch: true
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ System config updated to cyberpunk theme');
    console.log('📊 New config:', {
      defaultTheme: updateResponse.data.defaultTheme,
      animationStyle: updateResponse.data.animationStyle,
      enableAnimations: updateResponse.data.enableAnimations,
      allowThemeSwitch: updateResponse.data.allowThemeSwitch
    });

    // Test public config endpoint
    const publicResponse = await axios.get(`${API_BASE_URL}/public/config`);
    console.log('✅ Public config updated:', {
      defaultTheme: publicResponse.data.defaultTheme,
      animationStyle: publicResponse.data.animationStyle,
      enableAnimations: publicResponse.data.enableAnimations
    });

    console.log('🎉 Cyberpunk theme configuration complete!');
    
  } catch (error) {
    console.error('❌ Error updating cyberpunk config:', error.response?.data || error.message);
    process.exit(1);
  }
}

updateCyberpunkConfig();