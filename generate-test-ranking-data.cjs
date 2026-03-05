#!/usr/bin/env node

/**
 * 生成测试排行榜数据脚本
 * 为了测试排行榜功能，生成一些模拟数据
 */

console.log('🎯 生成测试排行榜数据...');

// 模拟排行榜数据
const mockRankings = [
  {
    id: '1',
    userId: 'user1',
    username: 'Alice',
    avatarUrl: null,
    totalBounty: 2500.00,
    completedTasksCount: 15,
    rank: 1,
    period: 'monthly',
    year: 2024,
    month: 3,
    quarter: null,
    totalPoints: 2500,
    completedTasks: 15,
    user: {
      id: 'user1',
      username: 'Alice',
      avatarUrl: null
    }
  },
  {
    id: '2',
    userId: 'user2',
    username: 'Bob',
    avatarUrl: null,
    totalBounty: 1800.00,
    completedTasksCount: 12,
    rank: 2,
    period: 'monthly',
    year: 2024,
    month: 3,
    quarter: null,
    totalPoints: 1800,
    completedTasks: 12,
    user: {
      id: 'user2',
      username: 'Bob',
      avatarUrl: null
    }
  },
  {
    id: '3',
    userId: 'user3',
    username: 'Charlie',
    avatarUrl: null,
    totalBounty: 1200.00,
    completedTasksCount: 8,
    rank: 3,
    period: 'monthly',
    year: 2024,
    month: 3,
    quarter: null,
    totalPoints: 1200,
    completedTasks: 8,
    user: {
      id: 'user3',
      username: 'Charlie',
      avatarUrl: null
    }
  },
  {
    id: '4',
    userId: 'user4',
    username: 'Diana',
    avatarUrl: null,
    totalBounty: 950.00,
    completedTasksCount: 6,
    rank: 4,
    period: 'monthly',
    year: 2024,
    month: 3,
    quarter: null,
    totalPoints: 950,
    completedTasks: 6,
    user: {
      id: 'user4',
      username: 'Diana',
      avatarUrl: null
    }
  },
  {
    id: '5',
    userId: 'user5',
    username: 'Eve',
    avatarUrl: null,
    totalBounty: 750.00,
    completedTasksCount: 5,
    rank: 5,
    period: 'monthly',
    year: 2024,
    month: 3,
    quarter: null,
    totalPoints: 750,
    completedTasks: 5,
    user: {
      id: 'user5',
      username: 'Eve',
      avatarUrl: null
    }
  }
];

console.log('📊 模拟排行榜数据已生成:');
console.log('');
mockRankings.forEach((ranking, index) => {
  console.log(`${index + 1}. ${ranking.username} - $${ranking.totalBounty} (${ranking.completedTasksCount} 任务)`);
});

console.log('');
console.log('💡 要解决排行榜没有数据的问题，需要：');
console.log('');
console.log('1. 确保后端服务正在运行');
console.log('2. 确保数据库连接正常');
console.log('3. 检查是否有用户完成了任务');
console.log('4. 触发排行榜计算（通过管理员界面或API）');
console.log('');
console.log('🔧 临时解决方案：');
console.log('可以修改前端代码，在没有数据时显示模拟数据进行测试');
console.log('');
console.log('📍 相关文件：');
console.log('- 前端API: packages/frontend/src/api/ranking.ts');
console.log('- 排行榜页面: packages/frontend/src/pages/RankingPage.tsx');
console.log('- 后端路由: packages/backend/src/routes/ranking.routes.ts');
console.log('- 后端服务: packages/backend/src/services/RankingService.ts');