#!/usr/bin/env node

/**
 * 强制重启开发服务器脚本
 * 彻底清理缓存并重新启动
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔄 强制重启开发服务器...');

try {
  const frontendDir = path.join(__dirname, 'packages/frontend');
  
  // 1. 彻底清理所有缓存
  console.log('🗑️  清理所有缓存文件...');
  const cacheDirectories = [
    path.join(frontendDir, '.vite'),
    path.join(frontendDir, 'dist'),
    path.join(frontendDir, 'node_modules/.vite'),
    path.join(frontendDir, 'node_modules/.cache'),
  ];
  
  cacheDirectories.forEach(dir => {
    if (fs.existsSync(dir)) {
      console.log(`   删除: ${path.relative(__dirname, dir)}`);
      try {
        execSync(`rmdir /s /q "${dir}"`, { stdio: 'ignore' });
      } catch (error) {
        console.log(`   跳过: ${path.relative(__dirname, dir)} (可能不存在或被占用)`);
      }
    }
  });
  
  // 2. 清理临时文件
  const tempFiles = [
    path.join(frontendDir, 'src', 'temp-fix.ts'),
    path.join(frontendDir, 'src', 'temp-refresh.ts'),
  ];
  
  tempFiles.forEach(file => {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
      console.log(`   删除临时文件: ${path.relative(__dirname, file)}`);
    }
  });
  
  console.log('');
  console.log('✅ 缓存清理完成！');
  console.log('');
  console.log('🚀 请手动重启开发服务器：');
  console.log('');
  console.log('1. 如果开发服务器正在运行，请按 Ctrl+C 停止它');
  console.log('2. 然后运行以下命令：');
  console.log('');
  console.log('   cd packages/frontend');
  console.log('   npm run dev');
  console.log('');
  console.log('3. 等待服务器启动后，在浏览器中访问：');
  console.log('   - 我的悬赏: http://localhost:5173/my/bounties');
  console.log('   - 任务市场: http://localhost:5173/bounty-tasks');
  console.log('');
  console.log('4. 如果浏览器仍显示错误，请强制刷新：');
  console.log('   - 按 Ctrl+Shift+R (Windows) 或 Cmd+Shift+R (Mac)');
  console.log('   - 或按 F12 → 右键刷新按钮 → "清空缓存并硬性重新加载"');
  
} catch (error) {
  console.error('❌ 清理过程中出现错误:', error.message);
  console.log('');
  console.log('🔧 请手动执行以下步骤：');
  console.log('1. 停止开发服务器 (Ctrl+C)');
  console.log('2. 删除缓存目录:');
  console.log('   rmdir /s /q packages\\frontend\\node_modules\\.vite');
  console.log('   rmdir /s /q packages\\frontend\\.vite');
  console.log('3. 重启服务器: cd packages/frontend && npm run dev');
}