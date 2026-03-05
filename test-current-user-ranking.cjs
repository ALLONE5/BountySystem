const axios = require('axios');

const BACKEND_URL = 'http://localhost:3000';

async function testCurrentUserRanking() {
  try {
    // 登录获取token和用户信息
    console.log('Logging in...');
    const loginResponse = await axios.post(`${BACKEND_URL}/api/auth/login`, {
      username: 'testadmin',
      password: 'admin123'
    });

    const token = loginResponse.data.token;
    const user = loginResponse.data.user;
    console.log('Login successful');
    console.log('User ID:', user.id);
    console.log('Username:', user.username);

    // 获取当前月度排行
    console.log('\nTesting monthly rankings...');
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    
    const rankingsResponse = await axios.get(`${BACKEND_URL}/api/rankings`, {
      params: {
        period: 'monthly',
        year: currentYear,
        month: currentMonth
      },
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('Rankings count:', rankingsResponse.data.length);
    
    // 查找当前用户在排行榜中的位置
    const userRanking = rankingsResponse.data.find(ranking => ranking.userId === user.id);
    if (userRanking) {
      console.log('Current user ranking found:');
      console.log('- Rank:', userRanking.rank);
      console.log('- Total Bounty:', userRanking.totalBounty);
      console.log('- Completed Tasks:', userRanking.completedTasksCount);
    } else {
      console.log('Current user not found in rankings');
    }

    // 测试用户专用排名API
    console.log('\nTesting user-specific ranking API...');
    try {
      const userRankingResponse = await axios.get(`${BACKEND_URL}/api/rankings/user/${user.id}`, {
        params: {
          period: 'monthly',
          year: currentYear,
          month: currentMonth
        },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('User-specific ranking API response:');
      console.log(JSON.stringify(userRankingResponse.data, null, 2));
    } catch (error) {
      console.log('User-specific ranking API error:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testCurrentUserRanking();