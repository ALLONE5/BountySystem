// 测试认证端点的脚本
const axios = require('axios');

async function testAuthEndpoint() {
  try {
    // 首先尝试登录获取token
    console.log('正在测试登录...');
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      username: 'admin', // 使用已知的管理员账户
      password: 'Password123'
    });
    
    console.log('登录成功，获得token:', loginResponse.data.token.substring(0, 20) + '...');
    
    // 使用token测试 /auth/me 端点
    console.log('正在测试 /auth/me 端点...');
    const meResponse = await axios.get('http://localhost:3000/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${loginResponse.data.token}`
      }
    });
    
    console.log('认证端点测试成功:', meResponse.data);
    
  } catch (error) {
    console.error('测试失败:', error.response?.data || error.message);
  }
}

testAuthEndpoint();