const fetch = require('node-fetch');

async function debugLogin() {
  try {
    console.log('🔐 Testing login...');
    
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
    
    console.log(`Login response status: ${loginResponse.status} ${loginResponse.statusText}`);
    
    const loginText = await loginResponse.text();
    console.log('Login response body:', loginText);
    
    if (loginResponse.ok) {
      const loginResult = JSON.parse(loginText);
      console.log('Login result:', JSON.stringify(loginResult, null, 2));
    }
    
    // Also try with admin credentials
    console.log('\n🔐 Testing admin login...');
    const adminLoginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'Password123'
      })
    });
    
    console.log(`Admin login response status: ${adminLoginResponse.status} ${adminLoginResponse.statusText}`);
    const adminLoginText = await adminLoginResponse.text();
    console.log('Admin login response body:', adminLoginText);
    
  } catch (error) {
    console.error('❌ Error during login debug:', error.message);
  }
}

debugLogin();