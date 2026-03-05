const axios = require('axios');

const BACKEND_URL = 'http://localhost:3000';

async function testRankingAPI() {
  try {
    // 首先登录获取token
    console.log('Logging in...');
    const loginResponse = await axios.post(`${BACKEND_URL}/api/auth/login`, {
      username: 'testuser',
      password: 'testpass123'
    });

    const token = loginResponse.data.token;
    console.log('Login successful, token obtained');

    // 测试获取当前月度排行
    console.log('\nTesting current monthly rankings...');
    const monthlyResponse = await axios.get(`${BACKEND_URL}/api/rankings?period=monthly`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('Monthly rankings response status:', monthlyResponse.status);
    console.log('Monthly rankings count:', monthlyResponse.data.length);
    if (monthlyResponse.data.length > 0) {
      console.log('Sample monthly ranking:', JSON.stringify(monthlyResponse.data[0], null, 2));
    }

    // 测试获取季度排行
    console.log('\nTesting quarterly rankings...');
    const quarterlyResponse = await axios.get(`${BACKEND_URL}/api/rankings?period=quarterly`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('Quarterly rankings response status:', quarterlyResponse.status);
    console.log('Quarterly rankings count:', quarterlyResponse.data.length);

    // 测试获取全时排行
    console.log('\nTesting all-time rankings...');
    const allTimeResponse = await axios.get(`${BACKEND_URL}/api/rankings?period=all_time`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('All-time rankings response status:', allTimeResponse.status);
    console.log('All-time rankings count:', allTimeResponse.data.length);

    // 测试默认排行（无参数）
    console.log('\nTesting default rankings (no params)...');
    const defaultResponse = await axios.get(`${BACKEND_URL}/api/rankings`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('Default rankings response status:', defaultResponse.status);
    console.log('Default rankings count:', defaultResponse.data.length);

  } catch (error) {
    console.error('Error testing ranking API:', error.response?.data || error.message);
  }
}

testRankingAPI();