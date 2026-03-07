#!/usr/bin/env node

/**
 * 全面修复logger导入脚本
 * 为所有使用logger但缺少导入的文件添加正确的导入
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class AllLoggerImportFixer {
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

  async findFilesUsingLogger() {
    this.log('搜索使用logger但可能缺少导入的文件...');
    
    try {
      // 搜索使用logger的文件
      const result = execSync('grep -r "logger\\." packages/backend/src --include="*.ts" --include="*.js" -l', { encoding: 'utf8' });
      const files = result.trim().split('\n').filter(f => f.trim());
      
      this.log(`找到 ${files.length} 个使用logger的文件`);
      
      for (const file of files) {
        await this.checkAndFixLoggerImport(file);
      }
    } catch (error) {
      // 如果grep命令失败，手动检查已知的文件
      this.log('使用备用方法检查文件...');
      const knownFiles = [
        'packages/backend/src/config/redis.ts',
        'packages/backend/src/config/env.ts',
        'packages/backend/src/middleware/errorHandler.middleware.ts',
        'packages/backend/src/middleware/performance.middleware.ts',
        'packages/backend/src/middleware/rateLimit.middleware.ts',
        'packages/backend/src/middleware/audit.middleware.ts',
        'packages/backend/src/middleware/cache.middleware.ts'
      ];
      
      for (const file of knownFiles) {
        if (fs.existsSync(file)) {
          await this.checkAndFixLoggerImport(file);
        }
      }
    }
  }

  async checkAndFixLoggerImport(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // 检查是否使用了logger但没有导入
      const usesLogger = content.includes('logger.') || content.includes('logger ');
      const hasImport = content.includes('import { logger }') || content.includes('import logger');
      
      if (usesLogger && !hasImport) {
        await this.addLoggerImport(filePath, content);
      }
    } catch (error) {
      this.errors.push(`检查文件${filePath}失败: ${error.message}`);
    }
  }

  async addLoggerImport(filePath, content) {
    try {
      let newContent = content;
      let modified = false;

      // 计算正确的logger导入路径
      const correctPath = this.calculateLoggerPath(filePath);
      
      // 找到合适的位置插入logger导入
      const firstImportMatch = content.match(/^import.*from.*['"];$/m);
      if (firstImportMatch) {
        const importLine = firstImportMatch[0];
        const newImport = importLine + `\nimport { logger } from '${correctPath}';`;
        newContent = newContent.replace(importLine, newImport);
        modified = true;
      } else {
        // 如果没有其他导入，在文件开头添加
        newContent = `import { logger } from '${correctPath}';\n` + newContent;
        modified = true;
      }

      if (modified) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        this.fixedFiles++;
        this.totalFixes++;
        this.log(`修复logger导入: ${path.relative('.', filePath)}`);
      }
    } catch (error) {
      this.errors.push(`修复${filePath}失败: ${error.message}`);
    }
  }

  calculateLoggerPath(filePath) {
    // 计算从文件位置到 config/logger 的正确相对路径
    const fileDir = path.dirname(filePath);
    const loggerPath = 'packages/backend/src/config/logger.js';
    const relativePath = path.relative(fileDir, loggerPath);
    
    // 确保路径以 ./ 开头（如果在同一目录）或 ../ 开头
    if (!relativePath.startsWith('.')) {
      return './' + relativePath;
    }
    return relativePath;
  }

  async generateReport() {
    const reportPath = 'ALL_LOGGER_IMPORTS_FIX_REPORT.md';
    const timestamp = new Date().toISOString();
    
    const report = `# 全面Logger导入修复报告

## 执行时间
${timestamp}

## 修复统计
- 修复文件数: ${this.fixedFiles}
- 总修复数: ${this.totalFixes}
- 错误数: ${this.errors.length}

## 修复内容

### 修复的导入问题
为所有使用logger但缺少导入的文件添加了正确的logger导入语句。

### 修复策略
1. 搜索所有使用logger的文件
2. 检查是否已有logger导入
3. 计算正确的相对路径
4. 在合适位置添加导入语句

## 发现的错误
${this.errors.length > 0 ? this.errors.map(error => `- ${error}`).join('\n') : '无错误'}

## 修复效果
修复后后端服务应该能够正常启动，不再出现logger未定义的错误。
`;

    fs.writeFileSync(reportPath, report, 'utf8');
    this.log(`修复报告已生成: ${reportPath}`, 'success');
  }

  async run() {
    this.log('🚀 开始全面修复logger导入...');
    
    await this.findFilesUsingLogger();
    await this.generateReport();
    
    this.log('✅ 全面logger导入修复完成!', 'success');
    this.log(`修复文件数: ${this.fixedFiles}`);
    this.log(`总修复数: ${this.totalFixes}`);
    
    if (this.errors.length > 0) {
      this.log(`发现 ${this.errors.length} 个问题，请查看报告`, 'error');
    }
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const fixer = new AllLoggerImportFixer();
  fixer.run().catch(console.error);
}

module.exports = AllLoggerImportFixer;