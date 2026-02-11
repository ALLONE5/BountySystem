const axios = require('axios');

async function testDeveloperLogin() {
  try {
    console.log('Testing developer user login...');
    
    const response = await axios.post('http://localhost:3000/api/auth/login', {
      username: 'developer',
      password: 'Password123'
    });
    
    console.log('✅ Login successful!');
    console.log('User data:', {
      id: response.data.user.id,
      username: response.data.user.username,
      email: response.data.user.email,
      role: response.data.user.role,
      balance: response.data.user.balance
    });
    console.log('Token received:', response.data.token ? 'Yes' : 'No');
    
    // Test accessing a protected admin endpoint
    const adminResponse = await axios.get('http://localhost:3000/api/admin/users', {
      headers: {
        'Authorization': `Bearer ${response.data.token}`
      }
    });
    
    console.log('✅ Admin endpoint access successful!');
    console.log('Users count:', adminResponse.data.users?.length || 0);
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testDeveloperLogin();