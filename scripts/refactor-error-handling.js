#!/usr/bin/env node

/**
 * 自动重构错误处理脚本
 * 将重复的 try-catch 模式替换为统一的错误处理 Hook
 */

const fs = require('fs');
const path = require('path');

class ErrorHandlingRefactor {
  constructor() {
    this.refactoredFiles = 0;
    this.totalReplacements = 0;
    this.excludePatterns = [
      /node_modules/,
      /\.git/,
      /dist/,
      /build/,
      /coverage/,
      /scripts/,
      /useErrorHandler\.ts/,
      /logger\.ts/
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
        if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
          files.push(fullPath);
        }
      }
    }
    
    return files;
  }

  refactorFrontendFile(filePath, content) {
    let modified = false;
    let newContent = content;
    
    // 检查是否已经导入了 useErrorHandler
    const hasErrorHandlerImport = content.includes('useErrorHandler');
    
    // 查找需要重构的错误处理模式
    const errorPatterns = [
      // 模式1: try-catch with console.error and message.error
      {
        pattern: /try\s*\{([^}]*)\}\s*catch\s*\([^)]*error[^)]*\)\s*\{[^}]*console\.error\([^)]*error[^)]*\);?[^}]*message\.error\([^)]*\);?[^}]*\}/gs,
        replacement: (match, tryBlock) => {
          this.totalReplacements++;
          return `await handleAsyncError(async () => {${tryBlock}}, 'operation', undefined, '操作失败')`;
        }
      },
      // 模式2: 简单的 try-catch with console.error
      {
        pattern: /try\s*\{([^}]*)\}\s*catch\s*\([^)]*error[^)]*\)\s*\{[^}]*console\.error\([^)]*\);?[^}]*\}/gs,
        replacement: (match, tryBlock) => {
          this.totalReplacements++;
          return `try {${tryBlock}} catch (error) { handleError(error, '操作失败', { context: 'operation' }); }`;
        }
      }
    ];

    // 如果没有导入 useErrorHandler，添加导入
    if (!hasErrorHandlerImport && (content.includes('console.error') || content.includes('message.error'))) {
      const importMatch = content.match(/^import.*from.*['"];$/gm);
      if (importMatch && importMatch.length > 0) {
        const lastImport = importMatch[importMatch.length - 1];
        const lastImportIndex = content.indexOf(lastImport) + lastImport.length;
        
        newContent = content.slice(0, lastImportIndex) + 
                    `\nimport { useErrorHandler } from '../hooks/useErrorHandler';` + 
                    content.slice(lastImportIndex);
        modified = true;
      }
    }

    // 在组件函数中添加 useErrorHandler Hook
    if (!hasErrorHandlerImport && content.includes('React.FC')) {
      const componentMatch = content.match(/export const \w+: React\.FC[^=]*= \([^)]*\) => \{/);
      if (componentMatch) {
        const hookInsertPoint = componentMatch.index + componentMatch[0].length;
        newContent = newContent.slice(0, hookInsertPoint) + 
                    `\n  const { handleError, handleAsyncError } = useErrorHandler();` + 
                    newContent.slice(hookInsertPoint);
        modified = true;
      }
    }

    // 应用错误处理模式替换
    for (const { pattern, replacement } of errorPatterns) {
      if (pattern.test(newContent)) {
        newContent = newContent.replace(pattern, replacement);
        modified = true;
      }
    }

    return { content: newContent, modified };
  }

  refactorBackendFile(filePath, content) {
    let modified = false;
    let newContent = content;
    
    // 检查是否已经导入了 HandleError 装饰器
    const hasHandleErrorImport = content.includes('HandleError');
    
    // 如果没有导入 HandleError，添加导入
    if (!hasHandleErrorImport && content.includes('console.error')) {
      const importMatch = content.match(/^import.*from.*['"];$/gm);
      if (importMatch && importMatch.length > 0) {
        const lastImport = importMatch[importMatch.length - 1];
        const lastImportIndex = content.indexOf(lastImport) + lastImport.length;
        
        const relativePath = path.relative(path.dirname(filePath), path.join('packages', 'backend', 'src', 'utils', 'decorators'));
        const decoratorPath = relativePath.replace(/\\/g, '/') + '/handleError.js';
        
        newContent = content.slice(0, lastImportIndex) + 
                    `\nimport { HandleError } from '${decoratorPath}';` + 
                    content.slice(lastImportIndex);
        modified = true;
      }
    }

    // 查找可以添加装饰器的方法
    const methodPattern = /async\s+(\w+)\s*\([^)]*\)\s*:\s*Promise<[^>]*>\s*\{/g;
    let match;
    while ((match = methodPattern.exec(newContent)) !== null) {
      const methodName = match[1];
      const methodStart = match.index;
      
      // 检查是否已经有装饰器
      const beforeMethod = newContent.substring(Math.max(0, methodStart - 100), methodStart);
      if (!beforeMethod.includes('@HandleError')) {
        // 添加装饰器
        const decorator = `  @HandleError({ context: '${path.basename(filePath, '.ts')}.${methodName}' })\n  `;
        newContent = newContent.slice(0, methodStart) + decorator + newContent.slice(methodStart);
        modified = true;
        this.totalReplacements++;
      }
    }

    return { content: newContent, modified };
  }

  refactorFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      let result;

      if (filePath.includes('packages/backend/')) {
        result = this.refactorBackendFile(filePath, content);
      } else if (filePath.includes('packages/frontend/')) {
        result = this.refactorFrontendFile(filePath, content);
      } else {
        return false;
      }

      if (result.modified) {
        fs.writeFileSync(filePath, result.content, 'utf8');
        this.refactoredFiles++;
        return true;
      }

      return false;
    } catch (error) {
      console.error(`Error refactoring file ${filePath}:`, error.message);
      return false;
    }
  }

  async run(projectPath = '.') {
    console.log('🔧 开始重构错误处理...');
    
    const files = this.readDirectory(projectPath);
    console.log(`📁 找到 ${files.length} 个 TypeScript 文件`);
    
    for (const filePath of files) {
      const refactored = this.refactorFile(filePath);
      if (refactored) {
        console.log(`✅ 重构: ${path.relative(projectPath, filePath)}`);
      }
    }
    
    console.log('\n📊 重构完成!');
    console.log(`重构文件数: ${this.refactoredFiles}`);
    console.log(`总替换数: ${this.totalReplacements}`);
    
    return {
      refactoredFiles: this.refactoredFiles,
      totalReplacements: this.totalReplacements
    };
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const refactor = new ErrorHandlingRefactor();
  refactor.run(process.argv[2] || '.').catch(console.error);
}

module.exports = ErrorHandlingRefactor;