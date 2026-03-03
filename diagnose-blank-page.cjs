const fs = require('fs');
const path = require('path');

console.log('🔍 诊断空白页面问题...\n');

// 检查关键文件是否存在
const criticalFiles = [
  'packages/frontend/src/main.tsx',
  'packages/frontend/src/App.tsx',
  'packages/frontend/src/router/index.tsx',
  'packages/frontend/src/layouts/NewAdaptiveLayout.tsx',
  'packages/frontend/src/layouts/BottomNavLayout.tsx',
  'packages/frontend/src/pages/MyPage.tsx',
  'packages/frontend/src/pages/BountyTasksPage.tsx',
  'packages/frontend/src/pages/AdminPage.tsx',
  'packages/frontend/src/pages/TestPage.tsx',
  'packages/frontend/src/components/ProtectedRoute.tsx'
];

console.log('📁 检查关键文件:');
criticalFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`${exists ? '✅' : '❌'} ${file}`);
});

// 检查 package.json 依赖
console.log('\n📦 检查前端依赖:');
try {
  const packageJson = JSON.parse(fs.readFileSync('packages/frontend/package.json', 'utf8'));
  const deps = packageJson.dependencies || {};
  const devDeps = packageJson.devDependencies || {};
  
  const criticalDeps = ['react', 'react-dom', 'react-router-dom', 'antd', 'vite'];
  criticalDeps.forEach(dep => {
    const version = deps[dep] || devDeps[dep];
    console.log(`${version ? '✅' : '❌'} ${dep}: ${version || '未安装'}`);
  });
} catch (error) {
  console.log('❌ 无法读取 package.json');
}

// 检查 index.html
console.log('\n🌐 检查 index.html:');
const indexHtml = 'packages/frontend/index.html';
if (fs.existsSync(indexHtml)) {
  console.log('✅ index.html 存在');
  const content = fs.readFileSync(indexHtml, 'utf8');
  if (content.includes('<div id="root">')) {
    console.log('✅ root 元素存在');
  } else {
    console.log('❌ root 元素缺失');
  }
} else {
  console.log('❌ index.html 不存在');
}

// 检查 vite.config.ts
console.log('\n⚙️ 检查 Vite 配置:');
const viteConfig = 'packages/frontend/vite.config.ts';
if (fs.existsSync(viteConfig)) {
  console.log('✅ vite.config.ts 存在');
  const content = fs.readFileSync(viteConfig, 'utf8');
  if (content.includes('port: 5173')) {
    console.log('✅ 端口配置正确 (5173)');
  } else {
    console.log('⚠️ 端口配置可能有问题');
  }
} else {
  console.log('❌ vite.config.ts 不存在');
}

console.log('\n🎯 建议的解决步骤:');
console.log('1. 访问测试页面: http://localhost:5173/test');
console.log('2. 检查浏览器控制台错误信息');
console.log('3. 确认所有依赖已正确安装');
console.log('4. 尝试硬刷新浏览器 (Ctrl+Shift+R)');
console.log('5. 如果问题持续，重启开发服务器');

console.log('\n🔗 快速测试链接:');
console.log('- 测试页面: http://localhost:5173/test');
console.log('- 主页: http://localhost:5173/dashboard');
console.log('- 登录页: http://localhost:5173/auth/login');