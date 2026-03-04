/**
 * 强制刷新布局变更的脚本
 * 用于解决开发环境中布局变更不生效的问题
 */

const fs = require('fs');
const path = require('path');

console.log('🔄 开始强制刷新布局变更...');

// 1. 清除可能的缓存文件
const cacheDirectories = [
  'packages/frontend/node_modules/.vite',
  'packages/frontend/.vite',
  'packages/frontend/dist'
];

cacheDirectories.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`🗑️  删除缓存目录: ${dir}`);
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// 2. 检查路由配置
const routerPath = 'packages/frontend/src/router/index.tsx';
if (fs.existsSync(routerPath)) {
  const content = fs.readFileSync(routerPath, 'utf8');
  if (content.includes('BottomNavLayout')) {
    console.log('✅ 路由配置正确 - 使用 BottomNavLayout');
  } else if (content.includes('ModernLayout')) {
    console.log('❌ 路由配置错误 - 仍在使用 ModernLayout');
  } else {
    console.log('⚠️  无法确定当前使用的布局');
  }
} else {
  console.log('❌ 路由文件不存在');
}

// 3. 创建临时标记文件来触发热重载
const tempFile = 'packages/frontend/src/temp-refresh.js';
const timestamp = new Date().toISOString();
fs.writeFileSync(tempFile, `// 临时文件用于触发热重载 - ${timestamp}\nexport const refreshTime = "${timestamp}";`);

console.log('📝 创建临时文件触发热重载');

// 4. 延迟删除临时文件
setTimeout(() => {
  if (fs.existsSync(tempFile)) {
    fs.unlinkSync(tempFile);
    console.log('🗑️  删除临时文件');
  }
}, 2000);

console.log(`
🎯 强制刷新完成！

请按以下步骤操作：
1. 重启开发服务器：
   cd packages/frontend
   npm run dev

2. 在浏览器中按 Ctrl+F5 强制刷新

3. 检查控制台是否有以下信息：
   "🔥 BottomNavLayout is now rendering! Layout change successful!"

4. 页面顶部应该显示红色横幅：
   "🔥 BottomNavLayout 已激活 - 布局切换成功！"

如果仍然没有变化，请检查：
- 浏览器开发者工具的 Console 标签页
- Network 标签页确认资源重新加载
- 清除浏览器缓存和 localStorage
`);