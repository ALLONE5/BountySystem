#!/usr/bin/env node

/**
 * 系统健康检查脚本
 * 用于快速验证系统各组件的运行状态
 */

const axios = require('axios');

const BACKEND_URL = 'http://localhost:3000';
const FRONTEND_URL = 'http://localhost:5173';

async function healthCheck() {
  console.log('🏥 系统健康检查开始...\n');
  
  let allHealthy = true;
  const results = [];

  // 1. 检查后端服务
  try {
    console.log('🔍 检查后端服务...');
    const healthResponse = await axios.get(`${BACKEND_URL}/health`, { timeout: 5000 });
    
    if (healthResponse.status === 200) {
      console.log('✅ 后端服务正常');
      results.push({ service: '后端服务', status: '正常', details: `环境: ${healthResponse.data.environment}` });
    } else {
      throw new Error(`状态码: ${healthResponse.status}`);
    }
  } catch (error) {
    console.log('❌ 后端服务异常:', error.message);
    results.push({ service: '后端服务', status: '异常', details: error.message });
    allHealthy = false;
  }

  // 2. 检查前端服务
  try {
    console.log('🔍 检查前端服务...');
    const frontendResponse = await axios.get(FRONTEND_URL, { 
      timeout: 5000,
      headers: { 'Accept': 'text/html' }
    });
    
    if (frontendResponse.status === 200) {
      console.log('✅ 前端服务正常');
      results.push({ service: '前端服务', status: '正常', details: '页面加载正常' });
    } else {
      throw new Error(`状态码: ${frontendResponse.status}`);
    }
  } catch (error) {
    console.log('❌ 前端服务异常:', error.message);
    results.push({ service: '前端服务', status: '异常', details: error.message });
    allHealthy = false;
  }

  // 3. 检查API连通性
  try {
    console.log('🔍 检查API连通性...');
    const apiResponse = await axios.get(`${BACKEND_URL}/api`, { timeout: 5000 });
    
    if (apiResponse.status === 200) {
      console.log('✅ API服务正常');
      results.push({ service: 'API服务', status: '正常', details: apiResponse.data.message });
    } else {
      throw new Error(`状态码: ${apiResponse.status}`);
    }
  } catch (error) {
    console.log('❌ API服务异常:', error.message);
    results.push({ service: 'API服务', status: '异常', details: error.message });
    allHealthy = false;
  }

  // 4. 检查认证功能
  try {
    console.log('🔍 检查认证功能...');
    const loginResponse = await axios.post(`${BACKEND_URL}/api/auth/login`, {
      username: 'admin',
      password: 'Password123'
    }, { timeout: 5000 });
    
    if (loginResponse.status === 200 && loginResponse.data.token) {
      console.log('✅ 认证功能正常');
      results.push({ service: '认证功能', status: '正常', details: '管理员登录成功' });
    } else {
      throw new Error('登录响应异常');
    }
  } catch (error) {
    console.log('❌ 认证功能异常:', error.response?.data?.message || error.message);
    results.push({ service: '认证功能', status: '异常', details: error.response?.data?.message || error.message });
    allHealthy = false;
  }

  // 5. 检查数据库连接（通过API）
  try {
    console.log('🔍 检查数据库连接...');
    const loginResponse = await axios.post(`${BACKEND_URL}/api/auth/login`, {
      username: 'admin',
      password: 'Password123'
    });
    
    const token = loginResponse.data.token;
    const rankingResponse = await axios.get(`${BACKEND_URL}/api/rankings?period=monthly&limit=1`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 5000
    });
    
    if (rankingResponse.status === 200) {
      console.log('✅ 数据库连接正常');
      results.push({ service: '数据库连接', status: '正常', details: '数据查询成功' });
    } else {
      throw new Error(`状态码: ${rankingResponse.status}`);
    }
  } catch (error) {
    console.log('❌ 数据库连接异常:', error.response?.data?.message || error.message);
    results.push({ service: '数据库连接', status: '异常', details: error.response?.data?.message || error.message });
    allHealthy = false;
  }

  // 输出检查结果
  console.log('\n📊 健康检查结果:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  results.forEach(result => {
    const statusIcon = result.status === '正常' ? '✅' : '❌';
    console.log(`${statusIcon} ${result.service.padEnd(12)} | ${result.status.padEnd(4)} | ${result.details}`);
  });
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  if (allHealthy) {
    console.log('\n🎉 系统整体状态: 健康');
    console.log('💡 所有核心服务运行正常，系统可以正常使用。');
  } else {
    console.log('\n⚠️  系统整体状态: 部分异常');
    console.log('💡 请检查异常服务并进行修复。');
  }
  
  console.log('\n📝 建议操作:');
  if (allHealthy) {
    console.log('   • 系统运行正常，可以开始使用');
    console.log('   • 定期运行此脚本进行健康检查');
    console.log('   • 监控系统性能和资源使用情况');
  } else {
    console.log('   • 检查异常服务的日志文件');
    console.log('   • 确认服务进程是否正在运行');
    console.log('   • 检查网络连接和端口占用');
    console.log('   • 重启异常服务并重新检查');
  }
  
  console.log('\n🔗 服务地址:');
  console.log(`   • 前端: ${FRONTEND_URL}`);
  console.log(`   • 后端: ${BACKEND_URL}`);
  console.log(`   • API文档: ${BACKEND_URL}/api`);
  
  return allHealthy;
}

// 运行健康检查
healthCheck()
  .then(healthy => {
    process.exit(healthy ? 0 : 1);
  })
  .catch(error => {
    console.error('\n💥 健康检查脚本执行失败:', error.message);
    process.exit(1);
  });