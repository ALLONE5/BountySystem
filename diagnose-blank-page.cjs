/**
 * 诊断空白页面问题的脚本
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 开始诊断空白页面问题...\n');

// 1. 检查关键文件是否存在
const criticalFiles = [
  'packages/frontend/src/router/index.tsx',
  'packages/frontend/src/layouts/BottomNavLayout.tsx',
  'packages/frontend/src/layouts/SimpleBottomNavLayout.tsx',
  'packages/frontend/src/layouts/AuthLayout.tsx',
  'packages/frontend/src/App.tsx',
  'packages/frontend/src/store/authStore.ts',
  'packages/frontend/src/hooks/usePermission.ts'
];

console.log('📁 检查关键文件:');
criticalFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - 文件不存在!`);
  }
});

// 2. 检查路由配置
console.log('\n🛣️  检查路由配置:');
const routerPath = 'packages/frontend/src/router/index.tsx';
if (fs.existsSync(routerPath)) {
  const content = fs.readFileSync(routerPath, 'utf8');
  
  if (content.includes('SimpleBottomNavLayout')) {
    console.log('✅ 使用 SimpleBottomNavLayout (测试版本)');
  } else if (content.includes('BottomNavLayout')) {
    console.log('⚠️  使用 BottomNavLayout (可能有问题)');
  } else if (content.includes('ModernLayout')) {
    console.log('❌ 仍在使用 ModernLayout');
  } else {
    console.log('❓ 无法确定使用的布局');
  }
  
  // 检查是否有语法错误的迹象
  const lines = content.split('\n');
  let hasIssues = false;
  
  lines.forEach((line, index) => {
    if (line.includes('import') && !line.trim().endsWith(';') && !line.includes('from')) {
      console.log(`⚠️  第 ${index + 1} 行可能有语法问题: ${line.trim()}`);
      hasIssues = true;
    }
  });
  
  if (!hasIssues) {
    console.log('✅ 路由文件语法看起来正常');
  }
}

// 3. 检查 package.json 脚本
console.log('\n📦 检查前端配置:');
const packagePath = 'packages/frontend/package.json';
if (fs.existsSync(packagePath)) {
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  console.log(`✅ 项目名称: ${pkg.name}`);
  console.log(`✅ 开发脚本: ${pkg.scripts?.dev || '未找到'}`);
  console.log(`✅ 构建脚本: ${pkg.scripts?.build || '未找到'}`);
} else {
  console.log('❌ package.json 不存在');
}

// 4. 检查 Vite 配置
console.log('\n⚡ 检查 Vite 配置:');
const viteConfigPath = 'packages/frontend/vite.config.ts';
if (fs.existsSync(viteConfigPath)) {
  console.log('✅ vite.config.ts 存在');
  const viteContent = fs.readFileSync(viteConfigPath, 'utf8');
  if (viteContent.includes('5173')) {
    console.log('✅ 端口配置为 5173');
  } else {
    console.log('⚠️  端口配置可能不是 5173');
  }
} else {
  console.log('❌ vite.config.ts 不存在');
}

console.log(`
🎯 诊断完成！

根据诊断结果，请执行以下操作：

1. 🔄 重启开发服务器:
   cd packages/frontend
   npm run dev

2. 🌐 访问测试页面:
   http://localhost:5173/dashboard

3. 🔍 检查浏览器控制台:
   - 按 F12 打开开发者工具
   - 查看 Console 标签页的错误信息
   - 查看 Network 标签页的请求状态

4. 📋 预期结果:
   - 应该看到绿色横幅: "✅ SimpleBottomNavLayout 正在工作！"
   - 底部应该有蓝色导航条: "🎯 简化版底部导航 - 测试成功！"
   - 控制台应该显示: "🔥 SimpleBottomNavLayout is rendering!"

如果仍然是空白页面，请检查:
- 浏览器控制台的错误信息
- 认证状态 (localStorage.getItem('auth-storage'))
- 网络请求是否正常

如果简化版本工作正常，说明原始 BottomNavLayout 有问题，
需要逐步排查其依赖项。
`);