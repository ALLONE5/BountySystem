#!/usr/bin/env node

/**
 * 强制刷新开发服务器脚本
 * 用于解决页面更改后浏览器缓存问题
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔄 强制刷新开发服务器...');

try {
  // 1. 检查是否有运行中的进程
  console.log('📋 检查运行中的进程...');
  
  // 2. 清理浏览器缓存相关文件
  const frontendDir = path.join(__dirname, 'packages/frontend');
  const cacheFiles = [
    path.join(frontendDir, '.vite'),
    path.join(frontendDir, 'dist'),
    path.join(frontendDir, 'node_modules/.vite'),
  ];
  
  cacheFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`🗑️  删除缓存: ${file}`);
      execSync(`rmdir /s /q "${file}"`, { stdio: 'ignore' });
    }
  });
  
  // 3. 创建一个临时文件来触发热重载
  const tempFile = path.join(frontendDir, 'src', 'temp-refresh.ts');
  const timestamp = new Date().toISOString();
  fs.writeFileSync(tempFile, `// 临时刷新文件 - ${timestamp}\nexport const refreshTime = '${timestamp}';\n`);
  
  console.log('✅ 创建临时刷新文件');
  
  // 4. 等待一秒后删除临时文件
  setTimeout(() => {
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
      console.log('🗑️  删除临时刷新文件');
    }
  }, 1000);
  
  console.log('');
  console.log('🎯 请执行以下步骤：');
  console.log('1. 在浏览器中按 Ctrl+Shift+R (或 Cmd+Shift+R) 强制刷新');
  console.log('2. 或者按 F12 打开开发者工具，右键刷新按钮选择"清空缓存并硬性重新加载"');
  console.log('3. 如果还是没有变化，请重启开发服务器：');
  console.log('   - 停止当前服务器 (Ctrl+C)');
  console.log('   - 运行: cd packages/frontend && npm run dev');
  console.log('');
  console.log('📍 检查路由变化：');
  console.log('- 我的悬赏: /my/bounties (应该显示 PublishedTasksPage)');
  console.log('- 任务市场: /bounty-tasks (应该显示 BrowseTasksPage)');
  
} catch (error) {
  console.error('❌ 刷新过程中出现错误:', error.message);
}