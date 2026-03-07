#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 需要修复logger导入的文件列表
const filesToFix = [
  'packages/frontend/src/pages/admin/AdminDashboardPage.tsx',
  'packages/frontend/src/pages/admin/ApplicationReviewPage.tsx',
  'packages/frontend/src/pages/admin/AuditLogPage.tsx',
  'packages/frontend/src/pages/admin/AvatarManagementPage.tsx',
  'packages/frontend/src/pages/admin/BountyAlgorithmPage.tsx',
  'packages/frontend/src/pages/admin/GroupManagementPage.tsx',
  'packages/frontend/src/pages/admin/NotificationBroadcastPage.tsx',
  'packages/frontend/src/pages/admin/SystemConfigPage.tsx',
  'packages/frontend/src/pages/admin/UserManagementPage.tsx',
  'packages/frontend/src/pages/auth/LoginPage.tsx',
  'packages/frontend/src/pages/auth/RegisterPage.tsx',
  'packages/frontend/src/pages/developer/DevAuditLogPage.tsx',
  'packages/frontend/src/pages/developer/DevSystemMonitorPage.tsx',
  'packages/frontend/src/pages/GroupsPage.tsx',
  'packages/frontend/src/pages/NotificationPage.tsx',
  'packages/frontend/src/pages/ProfilePage.tsx'
];

function fixLoggerImport(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // 检查是否已经有logger导入
    if (content.includes("import { logger }") || content.includes("import { log }")) {
      console.log(`✓ ${filePath} - logger导入已存在`);
      return;
    }
    
    // 检查是否使用了logger
    if (!content.includes('logger.')) {
      console.log(`- ${filePath} - 未使用logger，跳过`);
      return;
    }
    
    // 计算相对路径深度
    const relativePath = filePath.replace('packages/frontend/src/', '');
    const depth = relativePath.split('/').length - 1;
    const importPath = '../'.repeat(depth) + 'utils/logger';
    
    // 找到最后一个import语句的位置
    const lines = content.split('\n');
    let lastImportIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('import ') && !lines[i].includes('//')) {
        lastImportIndex = i;
      }
    }
    
    if (lastImportIndex === -1) {
      console.log(`! ${filePath} - 未找到import语句`);
      return;
    }
    
    // 在最后一个import后添加logger导入
    lines.splice(lastImportIndex + 1, 0, `import { logger } from '${importPath}';`);
    
    const newContent = lines.join('\n');
    fs.writeFileSync(filePath, newContent, 'utf8');
    
    console.log(`✓ ${filePath} - 已添加logger导入`);
    
  } catch (error) {
    console.error(`✗ ${filePath} - 修复失败:`, error.message);
  }
}

console.log('开始修复前端logger导入...\n');

filesToFix.forEach(fixLoggerImport);

console.log('\n前端logger导入修复完成！');