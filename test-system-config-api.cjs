const axios = require('axios');

const BACKEND_URL = 'http://localhost:3000';

async function testSystemConfigAPI() {
  try {
    console.log('Testing system config API...\n');

    // 测试公共配置API（不需要认证）
    console.log('1. Testing public config API...');
    const publicResponse = await axios.get(`${BACKEND_URL}/api/public/config`);
    
    console.log('Public config response status:', publicResponse.status);
    console.log('Public config data:', JSON.stringify(publicResponse.data, null, 2));

    // 测试完整配置API（需要认证）
    console.log('\n2. Testing full config API (with auth)...');
    
    // 先登录获取token
    const loginResponse = await axios.post(`${BACKEND_URL}/api/auth/login`, {
      username: 'testadmin',
      password: 'admin123'
    });

    const token = loginResponse.data.token;
    console.log('Login successful, testing full config...');

    const fullResponse = await axios.get(`${BACKEND_URL}/api/admin/system/config`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('Full config response status:', fullResponse.status);
    console.log('Full config data:', JSON.stringify(fullResponse.data, null, 2));

  } catch (error) {
    console.error('Error testing system config API:', error.response?.data || error.message);
  }
}

testSystemConfigAPI();