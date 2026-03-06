#!/usr/bin/env node

/**
 * 自动修复 console 日志脚本
 * 将所有 console.log, console.error 等替换为结构化日志
 */

const fs = require('fs');
const path = require('path');

class ConsoleLogFixer {
  constructor() {
    this.fixedFiles = 0;
    this.totalReplacements = 0;
    this.excludePatterns = [
      /node_modules/,
      /\.git/,
      /dist/,
      /build/,
      /coverage/,
      /\.log$/,
      /\.md$/,
      /\.json$/,
      /scripts/
    ];
  }

  shouldExcludeFile(filePath) {
    return this.excludePatterns.some(pattern => pattern.test(filePath));
  }

  readDirectory(dirPath, files = []) {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        if (!this.shouldExcludeFile(fullPath)) {
          this.readDirectory(fullPath, files);
        }
      } else if (stat.isFile() && !this.shouldExcludeFile(fullPath)) {
        if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
          files.push(fullPath);
        }
      }
    }
    
    return files;
  }

  fixBackendFile(filePath, content) {
    let modified = false;
    let newContent = content;
    
    // 跳过 logger.ts 文件本身
    if (filePath.includes('logger.ts')) {
      return { content: newContent, modified: false };
    }
    
    // 确保导入了 logger
    if (!content.includes("import { logger }") && !content.includes("from '../config/logger") && !content.includes("from '../../config/logger")) {
      // 找到其他导入语句的位置
      const importMatch = content.match(/^import.*from.*['"];$/gm);
      if (importMatch && importMatch.length > 0) {
        const lastImport = importMatch[importMatch.length - 1];
        const lastImportIndex = content.indexOf(lastImport) + lastImport.length;
        
        // 确定正确的 logger 路径
        const relativePath = path.relative(path.dirname(filePath), path.join('packages', 'backend', 'src', 'config'));
        const loggerPath = relativePath.replace(/\\/g, '/') + '/logger.js';
        
        newContent = content.slice(0, lastImportIndex) + 
                    `\nimport { logger } from '${loggerPath}';` + 
                    content.slice(lastImportIndex);
        modified = true;
      }
    }

    // 替换 console.log
    const consoleLogPattern = /console\.log\s*\(\s*(['"`])(.*?)\1\s*(?:,\s*(.*?))?\s*\);?/g;
    newContent = newContent.replace(consoleLogPattern, (match, quote, message, data) => {
      this.totalReplacements++;
      if (data) {
        return `logger.info('${message}', ${data});`;
      } else {
        return `logger.info('${message}');`;
      }
    });

    // 替换 console.error
    const consoleErrorPattern = /console\.error\s*\(\s*(['"`])(.*?)\1\s*(?:,\s*(.*?))?\s*\);?/g;
    newContent = newContent.replace(consoleErrorPattern, (match, quote, message, data) => {
      this.totalReplacements++;
      if (data) {
        return `logger.error('${message}', ${data});`;
      } else {
        return `logger.error('${message}');`;
      }
    });

    // 替换 console.warn
    const consoleWarnPattern = /console\.warn\s*\(\s*(['"`])(.*?)\1\s*(?:,\s*(.*?))?\s*\);?/g;
    newContent = newContent.replace(consoleWarnPattern, (match, quote, message, data) => {
      this.totalReplacements++;
      if (data) {
        return `logger.warn('${message}', ${data});`;
      } else {
        return `logger.warn('${message}');`;
      }
    });

    // 处理模板字符串的 console 调用
    const templateConsolePattern = /console\.(log|error|warn)\s*\(\s*`([^`]*)`\s*\);?/g;
    newContent = newContent.replace(templateConsolePattern, (match, level, message) => {
      this.totalReplacements++;
      // 将模板字符串转换为结构化日志
      const structuredMessage = message.replace(/\$\{([^}]+)\}/g, '${$1}');
      return `logger.${level}(\`${structuredMessage}\`);`;
    });

    return { content: newContent, modified: modified || newContent !== content };
  }

  fixFrontendFile(filePath, content) {
    let modified = false;
    let newContent = content;
    
    // 跳过 logger.ts 文件本身和一些特殊文件
    if (filePath.includes('logger.ts') || 
        filePath.includes('statusConfig.ts') || 
        filePath.includes('useWebSocket.ts')) {
      return { content: newContent, modified: false };
    }
    
    // 确保导入了 logger
    if (!content.includes("import { logger }") && !content.includes("from '../utils/logger") && !content.includes("from '../../utils/logger")) {
      // 找到其他导入语句的位置
      const importMatch = content.match(/^import.*from.*['"];$/gm);
      if (importMatch && importMatch.length > 0) {
        const lastImport = importMatch[importMatch.length - 1];
        const lastImportIndex = content.indexOf(lastImport) + lastImport.length;
        
        // 确定正确的 logger 路径
        const relativePath = path.relative(path.dirname(filePath), path.join('packages', 'frontend', 'src', 'utils'));
        const loggerPath = relativePath.replace(/\\/g, '/') + '/logger';
        
        newContent = content.slice(0, lastImportIndex) + 
                    `\nimport { logger } from '${loggerPath}';` + 
                    content.slice(lastImportIndex);
        modified = true;
      }
    }

    // 替换 console.log
    const consoleLogPattern = /console\.log\s*\(\s*(['"`])(.*?)\1\s*(?:,\s*(.*?))?\s*\);?/g;
    newContent = newContent.replace(consoleLogPattern, (match, quote, message, data) => {
      this.totalReplacements++;
      if (data) {
        return `logger.info('${message}', ${data});`;
      } else {
        return `logger.info('${message}');`;
      }
    });

    // 替换 console.error
    const consoleErrorPattern = /console\.error\s*\(\s*(['"`])(.*?)\1\s*(?:,\s*(.*?))?\s*\);?/g;
    newContent = newContent.replace(consoleErrorPattern, (match, quote, message, data) => {
      this.totalReplacements++;
      if (data) {
        return `logger.error('${message}', ${data});`;
      } else {
        return `logger.error('${message}');`;
      }
    });

    return { content: newContent, modified: modified || newContent !== content };
  }

  fixFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      let result;

      if (filePath.includes('packages/backend/')) {
        result = this.fixBackendFile(filePath, content);
      } else if (filePath.includes('packages/frontend/')) {
        result = this.fixFrontendFile(filePath, content);
      } else {
        return false;
      }

      if (result.modified) {
        fs.writeFileSync(filePath, result.content, 'utf8');
        this.fixedFiles++;
        return true;
      }

      return false;
    } catch (error) {
      console.error(`Error fixing file ${filePath}:`, error.message);
      return false;
    }
  }

  async run(projectPath = '.') {
    console.log('🔧 开始修复 console 日志...');
    
    const files = this.readDirectory(projectPath);
    console.log(`📁 找到 ${files.length} 个 TypeScript 文件`);
    
    for (const filePath of files) {
      const fixed = this.fixFile(filePath);
      if (fixed) {
        console.log(`✅ 修复: ${path.relative(projectPath, filePath)}`);
      }
    }
    
    console.log('\n📊 修复完成!');
    console.log(`修复文件数: ${this.fixedFiles}`);
    console.log(`总替换数: ${this.totalReplacements}`);
    
    return {
      fixedFiles: this.fixedFiles,
      totalReplacements: this.totalReplacements
    };
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const fixer = new ConsoleLogFixer();
  fixer.run(process.argv[2] || '.').catch(console.error);
}

module.exports = ConsoleLogFixer;