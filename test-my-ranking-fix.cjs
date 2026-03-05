const axios = require('axios');

const BACKEND_URL = 'http://localhost:3000';

async function testMyRankingFix() {
  try {
    console.log('=== 测试我的排名修复 ===\n');

    // 1. 登录testadmin用户
    console.log('1. 登录testadmin用户...');
    const loginResponse = await axios.post(`${BACKEND_URL}/api/auth/login`, {
      username: 'testadmin',
      password: 'admin123'
    });

    const token = loginResponse.data.token;
    const user = loginResponse.data.user;
    console.log('✅ 登录成功');
    console.log('   用户ID:', user.id);
    console.log('   用户名:', user.username);

    // 2. 获取排行榜数据
    console.log('\n2. 获取排行榜数据...');
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

    const rankings = rankingsResponse.data;
    console.log('✅ 排行榜数据获取成功');
    console.log('   总排行数:', rankings.length);

    // 3. 查找当前用户排名
    console.log('\n3. 查找当前用户排名...');
    const myRanking = rankings.find(ranking => ranking.userId === user.id);
    
    if (myRanking) {
      console.log('✅ 找到当前用户排名:');
      console.log('   排名:', myRanking.rank);
      console.log('   总赏金:', myRanking.totalBounty);
      console.log('   完成任务数:', myRanking.completedTasksCount);
      console.log('   用户名:', myRanking.username);
    } else {
      console.log('❌ 未找到当前用户排名');
      console.log('   用户ID:', user.id);
      console.log('   前5名用户ID:', rankings.slice(0, 5).map(r => r.userId));
    }

    // 4. 模拟前端localStorage存储
    console.log('\n4. 模拟前端localStorage存储格式...');
    const authStorage = {
      state: {
        token: token,
        user: user,
        isAuthenticated: true
      },
      version: 0
    };
    
    console.log('✅ localStorage格式:');
    console.log('   用户ID路径: state.user.id =', authStorage.state.user.id);

    // 5. 模拟前端getRankings方法
    console.log('\n5. 模拟前端getRankings方法...');
    const getCurrentUserId = () => {
      try {
        // 模拟从localStorage读取
        const parsed = authStorage; // 在实际情况下这会是JSON.parse(localStorage.getItem('auth-storage'))
        return parsed?.state?.user?.id || null;
      } catch (error) {
        console.warn('Failed to get current user ID:', error);
        return null;
      }
    };

    const currentUserId = getCurrentUserId();
    let frontendMyRanking = null;
    if (currentUserId && rankings && rankings.length > 0) {
      frontendMyRanking = rankings.find(ranking => ranking.userId === currentUserId) || null;
    }

    if (frontendMyRanking) {
      console.log('✅ 前端方法成功找到用户排名:');
      console.log('   排名:', frontendMyRanking.rank);
      console.log('   总赏金:', frontendMyRanking.totalBounty);
      console.log('   完成任务数:', frontendMyRanking.completedTasksCount);
    } else {
      console.log('❌ 前端方法未找到用户排名');
      console.log('   当前用户ID:', currentUserId);
    }

    console.log('\n=== 测试完成 ===');
    console.log('如果看到"前端方法成功找到用户排名"，说明修复成功！');
    console.log('现在可以在前端页面 http://localhost:5173/ranking 中看到正确的"我的排名"');

  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
  }
}

testMyRankingFix();