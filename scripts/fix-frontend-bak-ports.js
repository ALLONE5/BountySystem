#!/usr/bin/env node

/**
 * 修复备份前端中硬编码的端口号
 * 将所有 localhost:3000 替换为 localhost:3001
 */

const fs = require('fs');
const path = require('path');

const files = [
  'packages/frontend-bak/src/api/client.ts',
  'packages/frontend-bak/src/hooks/useWebSocket.ts',
  'packages/frontend-bak/src/contexts/SystemConfigContext.tsx',
  'packages/frontend-bak/src/pages/auth/LoginPage.tsx',
  'packages/frontend-bak/src/pages/developer/DevSystemConfigPage.tsx',
  'packages/frontend-bak/src/pages/admin/SystemConfigPage.tsx',
  'packages/frontend-bak/src/layouts/ModernLayout.tsx',
  'packages/frontend-bak/vite.config.ts'
];

console.log('🔧 修复备份前端端口配置...\n');

let fixedCount = 0;

files.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  文件不存在: ${file}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  
  // 替换所有 localhost:3000 为 localhost:3001
  content = content.replace(/localhost:3000/g, 'localhost:3001');
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ 已修复: ${file}`);
    fixedCount++;
  } else {
    console.log(`✓  无需修复: ${file}`);
  }
});

console.log(`\n🎉 完成！共修复 ${fixedCount} 个文件`);
console.log('\n💡 提示: 请重启备份前端服务以应用更改');
console.log('   npm run dev:frontend-bak\n');
