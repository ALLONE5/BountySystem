#!/usr/bin/env node

/**
 * 清除布局缓存脚本
 * 帮助解决界面一致性问题
 */

const fs = require('fs');
const path = require('path');

console.log('🧹 清除布局缓存...\n');

// 检查关键文件
const filesToCheck = [
  'packages/frontend/src/layouts/NewAdaptiveLayout.tsx',
  'packages/frontend/src/layouts/BottomNavLayout.tsx',
  'packages/frontend/src/router/router-v2.tsx',
  'packages/frontend/src/App.tsx'
];

console.log('📋 检查关键文件:');
filesToCheck.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - 文件不存在!`);
  }
});

console.log('\n🔍 验证布局配置:');

// 检查 NewAdaptiveLayout.tsx
try {
  const adaptiveLayoutContent = fs.readFileSync('packages/frontend/src/layouts/NewAdaptiveLayout.tsx', 'utf8');
  
  if (adaptiveLayoutContent.includes('return <BottomNavLayout />')) {
    console.log('✅ NewAdaptiveLayout 正确使用 BottomNavLayout');
  } else {
    console.log('❌ NewAdaptiveLayout 配置有问题');
  }
  
  if (!adaptiveLayoutContent.includes('MainLayout')) {
    console.log('✅ 已清除 MainLayout 引用');
  } else {
    console.log('⚠️  仍然包含 MainLayout 引用');
  }
} catch (error) {
  console.log('❌ 无法读取 NewAdaptiveLayout.tsx');
}

// 检查 App.tsx
try {
  const appContent = fs.readFileSync('packages/frontend/src/App.tsx', 'utf8');
  
  if (appContent.includes('routerV2')) {
    console.log('✅ App.tsx 使用正确的 routerV2');
  } else {
    console.log('❌ App.tsx 路由配置有问题');
  }
} catch (error) {
  console.log('❌ 无法读取 App.tsx');
}

console.log('\n💡 如果界面仍然不一致，请尝试:');
console.log('1. 硬刷新浏览器: Ctrl+Shift+R (Windows) 或 Cmd+Shift+R (Mac)');
console.log('2. 清除浏览器缓存和 Cookie');
console.log('3. 重启开发服务器:');
console.log('   cd packages/frontend && npm run dev');
console.log('4. 检查浏览器开发者工具的 Network 标签，确保加载的是最新文件');

console.log('\n🎯 预期行为:');
console.log('- 所有页面 (包括管理员页面) 都应该显示底部导航');
console.log('- 不应该有左侧边栏');
console.log('- 导航按钮根据用户角色显示 (普通用户3个，管理员4个，开发者5个)');

console.log('\n✨ 布局缓存清理完成!');