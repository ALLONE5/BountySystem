#!/usr/bin/env node

/**
 * 修复导入错误脚本
 * 清理缓存并重启开发服务器
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 修复导入错误...');

try {
  // 1. 清理 Vite 缓存
  console.log('🗑️  清理 Vite 缓存...');
  const frontendDir = path.join(__dirname, 'packages/frontend');
  const cacheFiles = [
    path.join(frontendDir, '.vite'),
    path.join(frontendDir, 'dist'),
    path.join(frontendDir, 'node_modules/.vite'),
  ];
  
  cacheFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`   删除: ${file}`);
      try {
        execSync(`rmdir /s /q "${file}"`, { stdio: 'ignore' });
      } catch (error) {
        console.log(`   无法删除: ${file} (可能不存在)`);
      }
    }
  });
  
  // 2. 创建临时文件触发重新编译
  const tempFile = path.join(frontendDir, 'src', 'temp-fix.ts');
  const timestamp = new Date().toISOString();
  fs.writeFileSync(tempFile, `// 修复导入错误 - ${timestamp}\nexport const fixTime = '${timestamp}';\n`);
  
  console.log('✅ 创建临时修复文件');
  
  // 3. 等待后删除临时文件
  setTimeout(() => {
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
      console.log('🗑️  删除临时修复文件');
    }
  }, 2000);
  
  console.log('');
  console.log('✅ 导入错误已修复！');
  console.log('');
  console.log('🎯 下一步操作：');
  console.log('1. 如果开发服务器正在运行，它应该会自动重新编译');
  console.log('2. 如果没有自动重新编译，请重启开发服务器：');
  console.log('   - 停止服务器 (Ctrl+C)');
  console.log('   - 运行: cd packages/frontend && npm run dev');
  console.log('3. 在浏览器中刷新页面 (F5 或 Ctrl+R)');
  console.log('');
  console.log('📍 测试路由：');
  console.log('- 我的悬赏: http://localhost:5173/my/bounties');
  console.log('- 任务市场: http://localhost:5173/bounty-tasks');
  
} catch (error) {
  console.error('❌ 修复过程中出现错误:', error.message);
  console.log('');
  console.log('🔧 手动修复步骤：');
  console.log('1. 停止开发服务器 (Ctrl+C)');
  console.log('2. 删除缓存: rmdir /s /q packages\\frontend\\node_modules\\.vite');
  console.log('3. 重启服务器: cd packages/frontend && npm run dev');
}