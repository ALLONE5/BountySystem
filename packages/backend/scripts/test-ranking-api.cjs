const axios = require('axios');

async function testRankingAPI() {
  try {
    // 首先登录获取 token
    console.log('=== 登录获取 token ===');
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      username: 'admin',
      password: 'Password123'
    });

    const token = loginResponse.data.token;
    const userId = loginResponse.data.user.id;
    console.log('登录成功, userId:', userId);
    console.log('Token:', token.substring(0, 20) + '...\n');

    // 测试获取用户排名
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const currentQuarter = Math.ceil(currentMonth / 3);

    console.log('=== 测试获取当月排名 ===');
    console.log(`请求: GET /api/rankings/user/${userId}?period=monthly&year=${currentYear}&month=${currentMonth}`);
    
    try {
      const monthlyResponse = await axios.get(
        `http://localhost:3000/api/rankings/user/${userId}`,
        {
          params: {
            period: 'monthly',
            year: currentYear,
            month: currentMonth
          },
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      console.log('当月排名:', JSON.stringify(monthlyResponse.data, null, 2));
    } catch (error) {
      console.error('当月排名请求失败:', error.response?.data || error.message);
    }

    console.log('\n=== 测试获取当季排名 ===');
    console.log(`请求: GET /api/rankings/user/${userId}?period=quarterly&year=${currentYear}&quarter=${currentQuarter}`);
    
    try {
      const quarterlyResponse = await axios.get(
        `http://localhost:3000/api/rankings/user/${userId}`,
        {
          params: {
            period: 'quarterly',
            year: currentYear,
            quarter: currentQuarter
          },
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      console.log('当季排名:', JSON.stringify(quarterlyResponse.data, null, 2));
    } catch (error) {
      console.error('当季排名请求失败:', error.response?.data || error.message);
    }

    console.log('\n=== 测试获取累积排名 ===');
    console.log(`请求: GET /api/rankings/user/${userId}?period=all_time&year=${currentYear}`);
    
    try {
      const allTimeResponse = await axios.get(
        `http://localhost:3000/api/rankings/user/${userId}`,
        {
          params: {
            period: 'all_time',
            year: currentYear
          },
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      console.log('累积排名:', JSON.stringify(allTimeResponse.data, null, 2));
    } catch (error) {
      console.error('累积排名请求失败:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('测试失败:', error.response?.data || error.message);
  }
}

testRankingAPI();
