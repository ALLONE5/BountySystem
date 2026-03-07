#!/usr/bin/env node

/**
 * 修复前端logger导入路径错误的脚本
 */

const fs = require('fs');
const path = require('path');

class LoggerImportFixer {
  constructor() {
    this.fixedFiles = 0;
    this.totalFixes = 0;
    this.errors = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : '📝';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  getCorrectLoggerPath(filePath) {
    // 计算从文件位置到utils/logger的正确相对路径
    const relativePath = path.relative(path.dirname(filePath), 'packages/frontend/src/utils');
    return relativePath.replace(/\\/g, '/') + '/logger';
  }

  async fixLoggerImports() {
    this.log('修复logger导入路径错误...');
    
    const filesToFix = [
      'packages/frontend/src/pages/TaskListPage.tsx',
      'packages/frontend/src/contexts/SystemConfigContext.tsx', 
      'packages/frontend/src/contexts/NotificationContext.tsx',
      'packages/frontend/src/contexts/AuthContext.tsx',
      'packages/frontend/src/components/TaskDetailDrawer.tsx',
      'packages/frontend/src/components/TaskAssistants.tsx',
      'packages/frontend/src/components/ErrorBoundary.tsx',
      'packages/frontend/src/components/common/InviteMemberModal.tsx',
      'packages/frontend/src/components/BountyHistoryDrawer.tsx'
    ];

    for (const filePath of filesToFix) {
      if (fs.existsSync(filePath)) {
        await this.fixFileLoggerImport(filePath);
      } else {
        this.errors.push(`文件不存在: ${filePath}`);
      }
    }
  }

  async fixFileLoggerImport(filePath) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      let modified = false;

      // 根据文件位置确定正确的导入路径
      let correctPath;
      
      if (filePath.includes('/pages/')) {
        correctPath = '../utils/logger';
      } else if (filePath.includes('/contexts/')) {
        correctPath = '../utils/logger';
      } else if (filePath.includes('/components/common/')) {
        correctPath = '../../utils/logger';
      } else if (filePath.includes('/components/')) {
        correctPath = '../utils/logger';
      } else {
        correctPath = '../utils/logger';
      }

      // 修复logger导入
      const loggerImportPattern = /import \{ (logger|log) \} from ['"]\.\.\/utils\/logger['"];/;
      if (loggerImportPattern.test(content)) {
        content = content.replace(
          loggerImportPattern,
          `import { $1 } from '${correctPath}';`
        );
        modified = true;
      }

      // 检查是否有其他错误的logger导入模式
      const wrongPatterns = [
        /import \{ (logger|log) \} from ['"]\.\/utils\/logger['"];/,
        /import \{ (logger|log) \} from ['"]utils\/logger['"];/,
        /import \{ (logger|log) \} from ['"]\.\.\/\.\.\/\.\.\/utils\/logger['"];/
      ];

      for (const pattern of wrongPatterns) {
        if (pattern.test(content)) {
          content = content.replace(pattern, `import { $1 } from '${correctPath}';`);
          modified = true;
        }
      }

      if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        this.fixedFiles++;
        this.totalFixes++;
        this.log(`修复 ${path.relative('.', filePath)} 的logger导入路径`);
      }
    } catch (error) {
      this.errors.push(`修复 ${filePath} 失败: ${error.message}`);
    }
  }

  async fixHooksLoggerImports() {
    this.log('检查hooks目录中的logger导入...');
    
    const hooksFiles = [
      'packages/frontend/src/hooks/useCrudOperations.ts',
      'packages/frontend/src/hooks/useWebSocket.ts'
    ];

    for (const filePath of hooksFiles) {
      if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        // 检查是否缺少logger导入
        if (content.includes('logger.') && !content.includes('import { logger }')) {
          // 找到第一个import语句的位置
          const importMatch = content.match(/^import.*from.*['"];$/m);
          if (importMatch) {
            const importLine = importMatch[0];
            const newImport = importLine + '\nimport { logger } from \'../utils/logger\';';
            content = content.replace(importLine, newImport);
            modified = true;
          }
        }

        if (modified) {
          fs.writeFileSync(filePath, content, 'utf8');
          this.fixedFiles++;
          this.totalFixes++;
          this.log(`添加logger导入到 ${path.relative('.', filePath)}`);
        }
      }
    }
  }

  async generateReport() {
    const reportPath = 'LOGGER_IMPORTS_FIX_REPORT.md';
    const timestamp = new Date().toISOString();
    
    const report = `# Logger导入路径修复报告

## 执行时间
${timestamp}

## 修复统计
- 修复文件数: ${this.fixedFiles}
- 总修复数: ${this.totalFixes}
- 错误数: ${this.errors.length}

## 修复内容

### 1. 导入路径标准化
- 统一logger导入路径格式
- 根据文件位置计算正确的相对路径
- 修复错误的相对路径引用

### 2. 修复的文件类型
- **Pages**: 页面组件使用 \`../utils/logger\`
- **Contexts**: 上下文组件使用 \`../utils/logger\`
- **Components**: 普通组件使用 \`../utils/logger\`
- **Components/common**: 通用组件使用 \`../../utils/logger\`

### 3. 常见错误模式
- \`from '../utils/logger'\` → 根据实际位置调整
- \`from './utils/logger'\` → 修复为正确路径
- \`from 'utils/logger'\` → 修复为相对路径

## 发现的问题
${this.errors.length > 0 ? this.errors.map(error => `- ${error}`).join('\n') : '无问题'}

## 验证建议
1. 运行前端开发服务器检查是否还有导入错误
2. 检查浏览器控制台是否有模块解析错误
3. 确认所有logger调用正常工作

## 标准化导入规范
\`\`\`typescript
// 正确的logger导入方式
import { logger } from '../utils/logger';  // 大部分组件
import { log } from '../utils/logger';     // 使用便捷方法

// 使用示例
logger.info('Component rendered');
log.error('API call failed', error);
\`\`\`
`;

    fs.writeFileSync(reportPath, report, 'utf8');
    this.log(`Logger导入修复报告已生成: ${reportPath}`, 'success');
  }

  async run() {
    this.log('🚀 开始修复logger导入路径错误...');
    
    await this.fixLoggerImports();
    await this.fixHooksLoggerImports();
    
    await this.generateReport();
    
    this.log('✅ Logger导入路径修复完成!', 'success');
    this.log(`修复文件数: ${this.fixedFiles}`);
    this.log(`总修复数: ${this.totalFixes}`);
    
    if (this.errors.length > 0) {
      this.log(`发现 ${this.errors.length} 个问题，请查看报告`, 'error');
    }
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const fixer = new LoggerImportFixer();
  fixer.run().catch(console.error);
}

module.exports = LoggerImportFixer;