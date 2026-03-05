#!/usr/bin/env node

/**
 * 诊断路由变化脚本
 * 检查路由配置和页面组件是否正确
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 诊断路由变化状态...\n');

// 检查关键文件
const files = [
  'packages/frontend/src/router/index.tsx',
  'packages/frontend/src/layouts/ModernLayout.tsx',
  'packages/frontend/src/pages/PublishedTasksPage.tsx',
  'packages/frontend/src/pages/BrowseTasksPage.tsx'
];

files.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${file} - 存在`);
  } else {
    console.log(`❌ ${file} - 不存在`);
  }
});

console.log('\n📋 检查路由配置...');

// 检查路由配置
const routerPath = path.join(__dirname, 'packages/frontend/src/router/index.tsx');
if (fs.existsSync(routerPath)) {
  const routerContent = fs.readFileSync(routerPath, 'utf8');
  
  // 检查关键路由
  const routes = [
    { path: '/my/bounties', component: 'PublishedTasksPage', description: '我的悬赏' },
    { path: '/bounty-tasks', component: 'BrowseTasksPage', description: '任务市场' }
  ];
  
  routes.forEach(route => {
    const pathExists = routerContent.includes(`path: '${route.path.replace('/', '')}'`);
    const componentExists = routerContent.includes(`<${route.component}`);
    
    console.log(`\n🔗 ${route.description} (${route.path}):`);
    console.log(`   路径配置: ${pathExists ? '✅' : '❌'}`);
    console.log(`   组件配置: ${componentExists ? '✅' : '❌'}`);
  });
  
  // 检查导入
  console.log('\n📦 检查组件导入:');
  const imports = [
    'PublishedTasksPage',
    'BrowseTasksPage'
  ];
  
  imports.forEach(imp => {
    const imported = routerContent.includes(`import`) && routerContent.includes(imp);
    console.log(`   ${imp}: ${imported ? '✅' : '❌'}`);
  });
}

console.log('\n🎯 解决方案:');
console.log('1. 强制刷新浏览器缓存:');
console.log('   - 按 Ctrl+Shift+R (Windows) 或 Cmd+Shift+R (Mac)');
console.log('   - 或在开发者工具中右键刷新按钮选择"清空缓存并硬性重新加载"');
console.log('');
console.log('2. 重启开发服务器:');
console.log('   - 停止当前服务器 (Ctrl+C)');
console.log('   - cd packages/frontend');
console.log('   - npm run dev');
console.log('');
console.log('3. 检查浏览器控制台是否有错误信息');
console.log('');
console.log('4. 确认访问的URL:');
console.log('   - 我的悬赏: http://localhost:5173/my/bounties');
console.log('   - 任务市场: http://localhost:5173/bounty-tasks');

console.log('\n📝 预期变化:');
console.log('- 我的悬赏页面应该显示"我的悬赏"标题和发布任务的管理界面');
console.log('- 任务市场页面应该显示"浏览赏金任务"标题和任务浏览界面');
console.log('- 任务市场页面不应该包含"任务邀请"标签页');